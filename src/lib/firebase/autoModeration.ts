// Automated moderation system
import { 
  doc, 
  updateDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { ReportDocument, UserDocument } from './types';

/**
 * Check and apply automated moderation rules after a report is submitted
 * @param reportedUserId - ID of the user being reported
 * @returns Promise resolving to the action taken
 */
export async function applyAutoModeration(reportedUserId: string): Promise<{
  action: 'flagged' | 'temp_blocked' | 'none';
  reportCount: number;
}> {
  // Get all reports for this user
  const reportsRef = collection(db, 'reports');
  const q = query(
    reportsRef,
    where('reported_user_id', '==', reportedUserId),
    where('status', 'in', ['pending', 'under_review'])
  );
  
  const querySnapshot = await getDocs(q);
  const reportCount = querySnapshot.size;
  
  const userRef = doc(db, 'users', reportedUserId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return { action: 'none', reportCount };
  }
  
  const userData = userSnap.data() as UserDocument;
  
  // Rule 1: First report → Auto-flag
  if (reportCount === 1 && !userData.account_status) {
    await updateDoc(userRef, {
      account_status: 'flagged',
      flagged_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    
    console.log(`User ${reportedUserId} auto-flagged (1 report)`);
    return { action: 'flagged', reportCount: 1 };
  }
  
  // Rule 2: Multiple reports (3+) → Auto-temporary block (7 days)
  if (reportCount >= 3 && userData.account_status !== 'temp_blocked' && userData.ban_status !== 'active') {
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const blockExpiresAt = Timestamp.fromMillis(Date.now() + sevenDaysInMs);
    
    await updateDoc(userRef, {
      account_status: 'temp_blocked',
      ban_status: 'active',
      ban_reason: `Automatically blocked due to ${reportCount} reports. Pending admin review.`,
      ban_expires_at: blockExpiresAt,
      blocked_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    
    console.log(`User ${reportedUserId} auto-blocked temporarily (${reportCount} reports)`);
    return { action: 'temp_blocked', reportCount };
  }
  
  return { action: 'none', reportCount };
}

/**
 * Permanently ban a user and remove all their listings (admin action)
 * @param userId - User ID to ban
 * @param reason - Reason for permanent ban
 * @returns Promise resolving when ban is complete
 */
export async function permanentlyBanUser(userId: string, reason: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  
  // Update user status
  await updateDoc(userRef, {
    account_status: 'permanently_banned',
    ban_status: 'active',
    ban_reason: reason,
    ban_expires_at: null, // Permanent ban has no expiry
    banned_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  
  // Remove all active listings
  const listingsRef = collection(db, 'listings');
  const listingsQuery = query(
    listingsRef,
    where('poster_id', '==', userId),
    where('status', '==', 'active')
  );
  
  const listingsSnapshot = await getDocs(listingsQuery);
  const updatePromises = listingsSnapshot.docs.map(async (listingDoc) => {
    await updateDoc(doc(db, 'listings', listingDoc.id), {
      status: 'deleted',
      deleted_reason: 'User permanently banned',
      updated_at: serverTimestamp(),
    });
  });
  
  await Promise.all(updatePromises);
  
  // Remove all active room requests
  const requestsRef = collection(db, 'room_requests');
  const requestsQuery = query(
    requestsRef,
    where('searcher_id', '==', userId),
    where('status', '==', 'active')
  );
  
  const requestsSnapshot = await getDocs(requestsQuery);
  const requestUpdatePromises = requestsSnapshot.docs.map(async (requestDoc) => {
    await updateDoc(doc(db, 'room_requests', requestDoc.id), {
      status: 'deleted',
      deleted_reason: 'User permanently banned',
      updated_at: serverTimestamp(),
    });
  });
  
  await Promise.all(requestUpdatePromises);
  
  console.log(`User ${userId} permanently banned. All listings and requests removed.`);
}

/**
 * Check if a temporary block has expired and unblock the user
 * @param userId - User ID to check
 * @returns Promise resolving to whether the user was unblocked
 */
export async function checkAndUnblockExpiredBans(userId: string): Promise<boolean> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return false;
  }
  
  const userData = userSnap.data() as UserDocument;
  
  // Check if user has a temporary ban that has expired
  if (
    userData.ban_status === 'active' &&
    userData.ban_expires_at &&
    userData.ban_expires_at.toMillis() <= Date.now()
  ) {
    await updateDoc(userRef, {
      account_status: 'active',
      ban_status: 'none',
      ban_reason: null,
      ban_expires_at: null,
      unblocked_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    
    console.log(`User ${userId} automatically unblocked (ban expired)`);
    return true;
  }
  
  return false;
}

/**
 * Get moderation status for a user
 * @param userId - User ID
 * @returns Promise resolving to moderation status
 */
export async function getModerationStatus(userId: string): Promise<{
  isFlagged: boolean;
  isTempBlocked: boolean;
  isPermanentlyBanned: boolean;
  reportCount: number;
  banExpiresAt: Timestamp | null;
}> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return {
      isFlagged: false,
      isTempBlocked: false,
      isPermanentlyBanned: false,
      reportCount: 0,
      banExpiresAt: null,
    };
  }
  
  const userData = userSnap.data() as UserDocument;
  
  // Get report count
  const reportsRef = collection(db, 'reports');
  const q = query(
    reportsRef,
    where('reported_user_id', '==', userId)
  );
  
  const querySnapshot = await getDocs(q);
  const reportCount = querySnapshot.size;
  
  return {
    isFlagged: (userData as any).account_status === 'flagged',
    isTempBlocked: (userData as any).account_status === 'temp_blocked',
    isPermanentlyBanned: (userData as any).account_status === 'permanently_banned',
    reportCount,
    banExpiresAt: userData.ban_expires_at || null,
  };
}
