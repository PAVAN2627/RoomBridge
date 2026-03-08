// Notification system functions
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
  limit,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../firebase';
import { NotificationDocument } from './types';

/**
 * Create a notification for a user
 * Note: This is typically called by Cloud Functions, not directly by clients
 * @param userId - User ID to receive notification
 * @param type - Notification type
 * @param title - Notification title
 * @param message - Notification message
 * @param relatedId - Optional ID of related entity
 * @param expiresAt - Optional expiration timestamp
 * @returns Promise resolving to the created notification document
 */
export async function createNotification(
  userId: string,
  type: 'new_match' | 'chat_message' | 'verification_approved' | 'listing_expired' | 'request_response',
  title: string,
  message: string,
  relatedId?: string,
  expiresAt?: Timestamp
): Promise<NotificationDocument> {
  const notificationRef = doc(collection(db, 'notifications'));
  const notificationId = notificationRef.id;
  
  const newNotification: NotificationDocument = {
    notification_id: notificationId,
    user_id: userId,
    type,
    title,
    message,
    read_status: false,
    created_at: Timestamp.now(),
  };
  
  if (relatedId) {
    newNotification.related_id = relatedId;
  }
  
  if (expiresAt) {
    newNotification.expires_at = expiresAt;
  }
  
  await setDoc(notificationRef, newNotification);
  return newNotification;
}

/**
 * Mark a notification as read
 * @param notificationId - Notification ID
 * @returns Promise resolving when update is complete
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const notificationRef = doc(db, 'notifications', notificationId);
  
  await updateDoc(notificationRef, {
    read_status: true,
  });
}

/**
 * Mark all notifications as read for a user
 * @param userId - User ID
 * @returns Promise resolving when all updates are complete
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('user_id', '==', userId),
    where('read_status', '==', false)
  );
  
  const querySnapshot = await getDocs(q);
  
  const updatePromises = querySnapshot.docs.map(doc => 
    updateDoc(doc.ref, { read_status: true })
  );
  
  await Promise.all(updatePromises);
}

/**
 * Get a notification by ID
 * @param notificationId - Notification ID
 * @returns Promise resolving to notification document or null
 */
export async function getNotification(notificationId: string): Promise<NotificationDocument | null> {
  const notificationRef = doc(db, 'notifications', notificationId);
  const notificationSnap = await getDoc(notificationRef);
  
  if (!notificationSnap.exists()) {
    return null;
  }
  
  return notificationSnap.data() as NotificationDocument;
}

/**
 * Get all notifications for a user
 * @param userId - User ID
 * @param limitCount - Maximum number of notifications to retrieve (default 20)
 * @param unreadOnly - Whether to retrieve only unread notifications
 * @returns Promise resolving to array of notification documents
 */
export async function getUserNotifications(
  userId: string,
  limitCount: number = 20,
  unreadOnly: boolean = false
): Promise<NotificationDocument[]> {
  const notificationsRef = collection(db, 'notifications');
  
  let q = query(
    notificationsRef,
    where('user_id', '==', userId)
  );
  
  if (unreadOnly) {
    q = query(q, where('read_status', '==', false));
  }
  
  q = query(q, orderBy('created_at', 'desc'), limit(limitCount));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as NotificationDocument);
}

/**
 * Get unread notification count for a user
 * @param userId - User ID
 * @returns Promise resolving to count of unread notifications
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('user_id', '==', userId),
    where('read_status', '==', false)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

/**
 * Delete a notification
 * @param notificationId - Notification ID
 * @returns Promise resolving when deletion is complete
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const notificationRef = doc(db, 'notifications', notificationId);
  await deleteDoc(notificationRef);
}

/**
 * Delete expired notifications
 * Note: This is typically called by a scheduled Cloud Function
 * @returns Promise resolving to count of deleted notifications
 */
export async function deleteExpiredNotifications(): Promise<number> {
  const notificationsRef = collection(db, 'notifications');
  const now = Timestamp.now();
  
  const q = query(
    notificationsRef,
    where('expires_at', '<=', now)
  );
  
  const querySnapshot = await getDocs(q);
  
  const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  
  return querySnapshot.size;
}

/**
 * Set up real-time listener for user notifications
 * @param userId - User ID
 * @param callback - Callback function to handle notification updates
 * @returns Unsubscribe function to stop listening
 */
export function setupNotificationListener(
  userId: string,
  callback: (notifications: NotificationDocument[]) => void
): Unsubscribe {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('user_id', '==', userId),
    orderBy('created_at', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => doc.data() as NotificationDocument);
    callback(notifications);
  });
}

/**
 * Helper function to create specific notification types
 */
export const NotificationHelpers = {
  /**
   * Create a new match notification
   */
  async newMatch(userId: string, listingId: string, matchScore: number): Promise<NotificationDocument> {
    return createNotification(
      userId,
      'new_match',
      'New Match Found!',
      `We found a ${matchScore}% match for you. Check it out!`,
      listingId
    );
  },
  
  /**
   * Create a chat message notification
   */
  async chatMessage(userId: string, chatId: string, senderName: string): Promise<NotificationDocument> {
    return createNotification(
      userId,
      'chat_message',
      'New Message',
      `${senderName} sent you a message`,
      chatId
    );
  },
  
  /**
   * Create a verification approved notification
   */
  async verificationApproved(userId: string, verificationType: string): Promise<NotificationDocument> {
    return createNotification(
      userId,
      'verification_approved',
      'Verification Approved',
      `Your ${verificationType} verification has been approved!`
    );
  },
  
  /**
   * Create a listing expired notification
   */
  async listingExpired(userId: string, listingId: string): Promise<NotificationDocument> {
    return createNotification(
      userId,
      'listing_expired',
      'Listing Expired',
      'Your listing has expired. Please renew it to keep it active.',
      listingId
    );
  },
  
  /**
   * Create a request response notification
   */
  async requestResponse(userId: string, requestId: string, responderName: string): Promise<NotificationDocument> {
    return createNotification(
      userId,
      'request_response',
      'New Response to Your Request',
      `${responderName} responded to your room request`,
      requestId
    );
  },
};
