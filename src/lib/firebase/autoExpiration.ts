// Auto-expiration system for emergency room requests
import { 
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { RoomRequestDocument } from './types';
import { createNotification } from './notifications';

/**
 * Check and expire emergency requests that are past their expiration date
 * This should be called periodically (e.g., via a cron job or Cloud Function)
 * @returns Promise resolving to the number of requests expired
 */
export async function expireEmergencyRequests(): Promise<number> {
  const requestsRef = collection(db, 'room_requests');
  const now = Timestamp.now();
  
  // Find all active emergency requests that have expired
  const q = query(
    requestsRef,
    where('status', '==', 'active'),
    where('request_type', '==', 'emergency'),
    where('expires_at', '<=', now)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return 0;
  }
  
  // Expire each request
  const updatePromises = querySnapshot.docs.map(async (requestDoc) => {
    const requestData = requestDoc.data() as RoomRequestDocument;
    
    await updateDoc(doc(db, 'room_requests', requestDoc.id), {
      status: 'expired',
      expired_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    
    // Send notification to the user
    try {
      await createNotification(
        requestData.searcher_id,
        'request_expired',
        'Emergency Request Expired',
        `Your emergency room request "${requestData.title}" has expired after 3 days.`,
        requestDoc.id
      );
    } catch (error) {
      console.error(`Failed to send expiration notification for request ${requestDoc.id}:`, error);
    }
    
    console.log(`Expired emergency request: ${requestDoc.id}`);
  });
  
  await Promise.all(updatePromises);
  
  return querySnapshot.size;
}

/**
 * Send expiration warning notifications for emergency requests expiring soon (within 24 hours)
 * @returns Promise resolving to the number of warnings sent
 */
export async function sendExpirationWarnings(): Promise<number> {
  const requestsRef = collection(db, 'room_requests');
  const now = Timestamp.now();
  const twentyFourHoursLater = Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000);
  
  // Find all active emergency requests expiring within 24 hours
  const q = query(
    requestsRef,
    where('status', '==', 'active'),
    where('request_type', '==', 'emergency'),
    where('expires_at', '>', now),
    where('expires_at', '<=', twentyFourHoursLater)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return 0;
  }
  
  // Send warning notification to each user
  const notificationPromises = querySnapshot.docs.map(async (requestDoc) => {
    const requestData = requestDoc.data() as RoomRequestDocument;
    
    // Check if warning was already sent (to avoid duplicate notifications)
    const requestRef = doc(db, 'room_requests', requestDoc.id);
    const requestSnapshot = await requestRef.get();
    const data = requestSnapshot.data() as any;
    
    if (data.expiration_warning_sent) {
      return; // Skip if warning already sent
    }
    
    const hoursRemaining = Math.ceil(
      (requestData.expires_at!.toMillis() - now.toMillis()) / (60 * 60 * 1000)
    );
    
    try {
      await createNotification(
        requestData.searcher_id,
        'request_expiring_soon',
        'Emergency Request Expiring Soon',
        `Your emergency room request "${requestData.title}" will expire in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}. Consider extending or reposting if still needed.`,
        requestDoc.id
      );
      
      // Mark warning as sent
      await updateDoc(requestRef, {
        expiration_warning_sent: true,
        expiration_warning_sent_at: serverTimestamp(),
      });
      
      console.log(`Sent expiration warning for request: ${requestDoc.id}`);
    } catch (error) {
      console.error(`Failed to send expiration warning for request ${requestDoc.id}:`, error);
    }
  });
  
  await Promise.all(notificationPromises);
  
  return querySnapshot.size;
}

/**
 * Get emergency requests that will expire soon (for admin dashboard)
 * @param hoursThreshold - Number of hours threshold (default 24)
 * @returns Promise resolving to array of requests expiring soon
 */
export async function getExpiringSoonRequests(hoursThreshold: number = 24): Promise<RoomRequestDocument[]> {
  const requestsRef = collection(db, 'room_requests');
  const now = Timestamp.now();
  const thresholdTime = Timestamp.fromMillis(now.toMillis() + hoursThreshold * 60 * 60 * 1000);
  
  const q = query(
    requestsRef,
    where('status', '==', 'active'),
    where('request_type', '==', 'emergency'),
    where('expires_at', '>', now),
    where('expires_at', '<=', thresholdTime)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    request_id: doc.id,
  })) as RoomRequestDocument[];
}

/**
 * Manually extend an emergency request expiration (admin or user action)
 * @param requestId - Request ID
 * @param additionalDays - Number of additional days to extend (default 3)
 * @returns Promise resolving when extension is complete
 */
export async function extendRequestExpiration(
  requestId: string,
  additionalDays: number = 3
): Promise<void> {
  const requestRef = doc(db, 'room_requests', requestId);
  const requestSnap = await requestRef.get();
  
  if (!requestSnap.exists()) {
    throw new Error('Request not found');
  }
  
  const requestData = requestSnap.data() as RoomRequestDocument;
  
  if (requestData.request_type !== 'emergency') {
    throw new Error('Only emergency requests can be extended');
  }
  
  if (requestData.status !== 'active') {
    throw new Error('Only active requests can be extended');
  }
  
  const currentExpiresAt = requestData.expires_at || Timestamp.now();
  const newExpiresAt = Timestamp.fromMillis(
    currentExpiresAt.toMillis() + additionalDays * 24 * 60 * 60 * 1000
  );
  
  await updateDoc(requestRef, {
    expires_at: newExpiresAt,
    expiration_warning_sent: false, // Reset warning flag
    extended_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  
  // Send notification
  try {
    await createNotification(
      requestData.searcher_id,
      'request_extended',
      'Request Extended',
      `Your emergency room request "${requestData.title}" has been extended by ${additionalDays} day${additionalDays !== 1 ? 's' : ''}.`,
      requestId
    );
  } catch (error) {
    console.error(`Failed to send extension notification for request ${requestId}:`, error);
  }
  
  console.log(`Extended request ${requestId} by ${additionalDays} days`);
}
