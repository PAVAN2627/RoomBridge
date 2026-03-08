// Room request management functions
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
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { RoomRequestDocument } from './types';
import { validateAmount } from './validation';

/**
 * Create a new room request
 * @param searcherId - ID of the user creating the request
 * @param requestData - Room request data
 * @returns Promise resolving to the created request document
 */
export async function createRoomRequest(
  searcherId: string,
  requestData: Omit<RoomRequestDocument, 'request_id' | 'searcher_id' | 'status' | 'expires_at' | 'created_at' | 'updated_at'>
): Promise<RoomRequestDocument> {
  // Validate amounts
  if (!validateAmount(requestData.budget_min) || !validateAmount(requestData.budget_max)) {
    throw new Error('Budget amounts must be positive');
  }
  
  if (requestData.budget_min > requestData.budget_max) {
    throw new Error('Minimum budget cannot exceed maximum budget');
  }
  
  const requestRef = doc(collection(db, 'room_requests'));
  const requestId = requestRef.id;
  
  const now = Timestamp.now();
  
  // Calculate expires_at for emergency requests (3 days from now)
  let expiresAt: Timestamp | undefined;
  if (requestData.request_type === 'emergency') {
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    expiresAt = Timestamp.fromMillis(now.toMillis() + threeDaysInMs);
  }
  
  const newRequest: RoomRequestDocument = {
    request_id: requestId,
    searcher_id: searcherId,
    ...requestData,
    expires_at: expiresAt,
    status: 'active',
    created_at: now,
    updated_at: now,
  };
  
  await setDoc(requestRef, newRequest);
  return newRequest;
}

/**
 * Update an existing room request
 * @param requestId - Request ID
 * @param updates - Partial request data to update
 * @returns Promise resolving when update is complete
 */
export async function updateRoomRequest(
  requestId: string,
  updates: Partial<Omit<RoomRequestDocument, 'request_id' | 'searcher_id' | 'created_at' | 'updated_at' | 'expires_at'>>
): Promise<void> {
  // Validate amounts if provided
  if (updates.budget_min !== undefined && !validateAmount(updates.budget_min)) {
    throw new Error('Minimum budget must be positive');
  }
  
  if (updates.budget_max !== undefined && !validateAmount(updates.budget_max)) {
    throw new Error('Maximum budget must be positive');
  }
  
  // Validate budget range if both are provided
  if (updates.budget_min !== undefined && updates.budget_max !== undefined) {
    if (updates.budget_min > updates.budget_max) {
      throw new Error('Minimum budget cannot exceed maximum budget');
    }
  }
  
  const requestRef = doc(db, 'room_requests', requestId);
  
  await updateDoc(requestRef, {
    ...updates,
    updated_at: serverTimestamp(),
  });
}

/**
 * Soft delete a room request by setting status to 'deleted'
 * @param requestId - Request ID
 * @returns Promise resolving when deletion is complete
 */
export async function deleteRoomRequest(requestId: string): Promise<void> {
  const requestRef = doc(db, 'room_requests', requestId);
  
  await updateDoc(requestRef, {
    status: 'deleted',
    updated_at: serverTimestamp(),
  });
}

/**
 * Get a room request by ID
 * @param requestId - Request ID
 * @returns Promise resolving to the request document or null if not found
 */
export async function getRoomRequest(requestId: string): Promise<RoomRequestDocument | null> {
  const requestRef = doc(db, 'room_requests', requestId);
  const requestSnap = await getDoc(requestRef);
  
  if (!requestSnap.exists()) {
    return null;
  }
  
  return requestSnap.data() as RoomRequestDocument;
}

/**
 * Get all active room requests for a specific searcher
 * @param searcherId - Searcher user ID
 * @returns Promise resolving to array of request documents
 */
export async function getRoomRequestsBySearcher(searcherId: string): Promise<RoomRequestDocument[]> {
  const requestsRef = collection(db, 'room_requests');
  const q = query(
    requestsRef,
    where('searcher_id', '==', searcherId),
    where('status', '==', 'active'),
    orderBy('created_at', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as RoomRequestDocument);
}

/**
 * Search active room requests by city and type
 * @param city - City to search in
 * @param requestType - Optional request type filter ('normal' or 'emergency')
 * @param limitCount - Maximum number of results (default 20)
 * @returns Promise resolving to array of request documents
 */
export async function searchRoomRequests(
  city: string,
  requestType?: 'normal' | 'emergency',
  limitCount: number = 20
): Promise<RoomRequestDocument[]> {
  const requestsRef = collection(db, 'room_requests');
  
  let q = query(
    requestsRef,
    where('city', '==', city),
    where('status', '==', 'active')
  );
  
  if (requestType) {
    q = query(q, where('request_type', '==', requestType));
  }
  
  q = query(q, orderBy('created_at', 'desc'), limit(limitCount));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as RoomRequestDocument);
}

/**
 * Mark a room request as fulfilled
 * @param requestId - Request ID
 * @returns Promise resolving when update is complete
 */
export async function markRequestAsFulfilled(requestId: string): Promise<void> {
  const requestRef = doc(db, 'room_requests', requestId);
  
  await updateDoc(requestRef, {
    status: 'fulfilled',
    updated_at: serverTimestamp(),
  });
}

/**
 * Mark a room request as expired (typically called by Cloud Function)
 * @param requestId - Request ID
 * @returns Promise resolving when update is complete
 */
export async function markRequestAsExpired(requestId: string): Promise<void> {
  const requestRef = doc(db, 'room_requests', requestId);
  
  await updateDoc(requestRef, {
    status: 'expired',
    updated_at: serverTimestamp(),
  });
}

/**
 * Get all emergency requests that need expiration check
 * @returns Promise resolving to array of expired emergency requests
 */
export async function getExpiredEmergencyRequests(): Promise<RoomRequestDocument[]> {
  const requestsRef = collection(db, 'room_requests');
  const now = Timestamp.now();
  
  const q = query(
    requestsRef,
    where('status', '==', 'active'),
    where('request_type', '==', 'emergency'),
    where('expires_at', '<=', now)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as RoomRequestDocument);
}
