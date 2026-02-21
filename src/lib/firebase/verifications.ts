// Verification system functions
import { 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { VerificationDocument } from './types';

/**
 * Submit a verification document
 * @param userId - User ID submitting verification
 * @param verificationType - Type of verification
 * @param documentUrl - Cloud Storage URL of the document
 * @param livenessCheckResult - Optional liveness check result for selfie verification
 * @returns Promise resolving to the created verification document
 */
export async function submitVerification(
  userId: string,
  verificationType: 'student' | 'professional' | 'aadhaar' | 'pan' | 'selfie',
  documentUrl: string,
  livenessCheckResult?: boolean
): Promise<VerificationDocument> {
  const verificationRef = doc(collection(db, 'verifications'));
  const verificationId = verificationRef.id;
  
  const now = Timestamp.now();
  
  const newVerification: VerificationDocument = {
    verification_id: verificationId,
    user_id: userId,
    verification_type: verificationType,
    document_url: documentUrl,
    status: 'pending',
    submitted_at: now,
    created_at: now,
  };
  
  // Add liveness check result for selfie verification
  if (verificationType === 'selfie' && livenessCheckResult !== undefined) {
    newVerification.liveness_check_result = livenessCheckResult;
  }
  
  await setDoc(verificationRef, newVerification);
  
  // Add to user's verification history
  const historyRef = doc(collection(db, 'users', userId, 'verification_history'));
  await setDoc(historyRef, {
    verification_id: verificationId,
    verification_type: verificationType,
    status: 'pending',
    submitted_at: now,
  });
  
  return newVerification;
}

/**
 * Review a verification document (admin only)
 * @param verificationId - Verification ID
 * @param reviewerId - Admin user ID
 * @param approved - Whether to approve or reject
 * @param rejectionReason - Optional reason for rejection
 * @returns Promise resolving when review is complete
 */
export async function reviewVerification(
  verificationId: string,
  reviewerId: string,
  approved: boolean,
  rejectionReason?: string
): Promise<void> {
  const verificationRef = doc(db, 'verifications', verificationId);
  const verificationSnap = await getDoc(verificationRef);
  
  if (!verificationSnap.exists()) {
    throw new Error('Verification not found');
  }
  
  const verification = verificationSnap.data() as VerificationDocument;
  
  await updateDoc(verificationRef, {
    status: approved ? 'approved' : 'rejected',
    reviewed_at: serverTimestamp(),
    reviewer_id: reviewerId,
    ...(rejectionReason && { rejection_reason: rejectionReason }),
  });
  
  // Update user's verification history
  const historyQuery = query(
    collection(db, 'users', verification.user_id, 'verification_history'),
    where('verification_id', '==', verificationId)
  );
  
  const historySnapshot = await getDocs(historyQuery);
  historySnapshot.forEach(async (doc) => {
    await updateDoc(doc.ref, {
      status: approved ? 'approved' : 'rejected',
      reviewed_at: serverTimestamp(),
    });
  });
  
  // If approved, update user's verification status
  if (approved) {
    await updateUserVerificationStatus(verification.user_id, verification.verification_type);
  }
}

/**
 * Update user's verification status after approval
 * @param userId - User ID
 * @param verificationType - Type of verification approved
 * @returns Promise resolving when update is complete
 */
async function updateUserVerificationStatus(
  userId: string,
  verificationType: string
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return;
  }
  
  const updates: any = {};
  
  // Update specific verification fields
  if (verificationType === 'aadhaar') {
    updates.aadhaar_verified = true;
  } else if (verificationType === 'pan') {
    updates.pan_verified = true;
  }
  
  // Add verification badge
  const userData = userSnap.data();
  const badges = userData.verification_badges || [];
  
  let badgeToAdd: string | null = null;
  if (verificationType === 'student') {
    badgeToAdd = 'student';
  } else if (verificationType === 'professional') {
    badgeToAdd = 'professional';
  } else if (verificationType === 'aadhaar' || verificationType === 'pan' || verificationType === 'selfie') {
    badgeToAdd = 'identity';
  }
  
  if (badgeToAdd && !badges.includes(badgeToAdd)) {
    badges.push(badgeToAdd);
    updates.verification_badges = badges;
  }
  
  // Update verification status if all identity verifications are complete
  if (userData.aadhaar_verified || userData.pan_verified) {
    updates.verification_status = 'verified';
  }
  
  if (Object.keys(updates).length > 0) {
    updates.updated_at = serverTimestamp();
    await updateDoc(userRef, updates);
  }
}

/**
 * Get verification document by ID
 * @param verificationId - Verification ID
 * @returns Promise resolving to verification document or null
 */
export async function getVerification(verificationId: string): Promise<VerificationDocument | null> {
  const verificationRef = doc(db, 'verifications', verificationId);
  const verificationSnap = await getDoc(verificationRef);
  
  if (!verificationSnap.exists()) {
    return null;
  }
  
  return verificationSnap.data() as VerificationDocument;
}

/**
 * Get all pending verifications (admin only)
 * @returns Promise resolving to array of pending verifications
 */
export async function getPendingVerifications(): Promise<VerificationDocument[]> {
  const verificationsRef = collection(db, 'verifications');
  const q = query(
    verificationsRef,
    where('status', '==', 'pending'),
    orderBy('submitted_at', 'asc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as VerificationDocument);
}

/**
 * Get verification history for a user
 * @param userId - User ID
 * @returns Promise resolving to array of verification documents
 */
export async function getUserVerifications(userId: string): Promise<VerificationDocument[]> {
  const verificationsRef = collection(db, 'verifications');
  const q = query(
    verificationsRef,
    where('user_id', '==', userId),
    orderBy('submitted_at', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as VerificationDocument);
}
