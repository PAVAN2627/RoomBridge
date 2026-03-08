// Listing management functions
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
import { ListingDocument } from './types';
import { validateImagesArray, validateCoordinates, validateAmount } from './validation';

/**
 * Create a new listing
 * @param posterId - ID of the user creating the listing
 * @param listingData - Listing data
 * @returns Promise resolving to the created listing document
 */
export async function createListing(
  posterId: string,
  listingData: Omit<ListingDocument, 'listing_id' | 'poster_id' | 'status' | 'created_at' | 'updated_at'>
): Promise<ListingDocument> {
  // Validate images array
  if (!validateImagesArray(listingData.images)) {
    throw new Error('Images array must contain 10 or fewer items');
  }
  
  // Validate coordinates
  if (!validateCoordinates(listingData.latitude, listingData.longitude)) {
    throw new Error('Invalid coordinates');
  }
  
  // Validate amounts
  if (!validateAmount(listingData.rent_amount)) {
    throw new Error('Rent amount must be positive');
  }
  
  const listingRef = doc(collection(db, 'listings'));
  const listingId = listingRef.id;
  
  const newListing: ListingDocument = {
    listing_id: listingId,
    poster_id: posterId,
    ...listingData,
    status: 'active',
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  };
  
  await setDoc(listingRef, newListing);
  return newListing;
}

/**
 * Update an existing listing
 * @param listingId - Listing ID
 * @param updates - Partial listing data to update
 * @returns Promise resolving when update is complete
 */
export async function updateListing(
  listingId: string,
  updates: Partial<Omit<ListingDocument, 'listing_id' | 'poster_id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  // Validate images array if provided
  if (updates.images && !validateImagesArray(updates.images)) {
    throw new Error('Images array must contain 10 or fewer items');
  }
  
  // Validate coordinates if provided
  if ((updates.latitude !== undefined || updates.longitude !== undefined)) {
    const listingRef = doc(db, 'listings', listingId);
    const listingSnap = await getDoc(listingRef);
    
    if (!listingSnap.exists()) {
      throw new Error('Listing not found');
    }
    
    const currentData = listingSnap.data() as ListingDocument;
    const lat = updates.latitude ?? currentData.latitude;
    const lng = updates.longitude ?? currentData.longitude;
    
    if (!validateCoordinates(lat, lng)) {
      throw new Error('Invalid coordinates');
    }
  }
  
  // Validate amounts if provided
  if (updates.rent_amount !== undefined && !validateAmount(updates.rent_amount)) {
    throw new Error('Rent amount must be positive');
  }
  
  const listingRef = doc(db, 'listings', listingId);
  
  await updateDoc(listingRef, {
    ...updates,
    updated_at: serverTimestamp(),
  });
}

/**
 * Soft delete a listing by setting status to 'deleted'
 * @param listingId - Listing ID
 * @returns Promise resolving when deletion is complete
 */
export async function deleteListing(listingId: string): Promise<void> {
  const listingRef = doc(db, 'listings', listingId);
  
  await updateDoc(listingRef, {
    status: 'deleted',
    updated_at: serverTimestamp(),
  });
}

/**
 * Get a listing by ID
 * @param listingId - Listing ID
 * @returns Promise resolving to the listing document or null if not found
 */
export async function getListing(listingId: string): Promise<ListingDocument | null> {
  const listingRef = doc(db, 'listings', listingId);
  const listingSnap = await getDoc(listingRef);
  
  if (!listingSnap.exists()) {
    return null;
  }
  
  return listingSnap.data() as ListingDocument;
}

/**
 * Get all active listings for a specific poster
 * @param posterId - Poster user ID
 * @returns Promise resolving to array of listing documents
 */
export async function getListingsByPoster(posterId: string): Promise<ListingDocument[]> {
  const listingsRef = collection(db, 'listings');
  const q = query(
    listingsRef,
    where('poster_id', '==', posterId),
    where('status', '==', 'active'),
    orderBy('created_at', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as ListingDocument);
}

/**
 * Search active listings by city and type
 * @param city - City to search in
 * @param listingType - Optional listing type filter
 * @param limitCount - Maximum number of results (default 20)
 * @returns Promise resolving to array of listing documents
 */
export async function searchListings(
  city: string,
  listingType?: string,
  limitCount: number = 20
): Promise<ListingDocument[]> {
  const listingsRef = collection(db, 'listings');
  
  let q = query(
    listingsRef,
    where('city', '==', city),
    where('status', '==', 'active')
  );
  
  if (listingType) {
    q = query(q, where('listing_type', '==', listingType));
  }
  
  q = query(q, orderBy('created_at', 'desc'), limit(limitCount));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as ListingDocument);
}

/**
 * Mark a listing as rented
 * @param listingId - Listing ID
 * @returns Promise resolving when update is complete
 */
export async function markListingAsRented(listingId: string): Promise<void> {
  const listingRef = doc(db, 'listings', listingId);
  
  await updateDoc(listingRef, {
    status: 'rented',
    updated_at: serverTimestamp(),
  });
}

/**
 * Mark a listing as inactive
 * @param listingId - Listing ID
 * @returns Promise resolving when update is complete
 */
export async function markListingAsInactive(listingId: string): Promise<void> {
  const listingRef = doc(db, 'listings', listingId);
  
  await updateDoc(listingRef, {
    status: 'inactive',
    updated_at: serverTimestamp(),
  });
}

/**
 * Reactivate an inactive listing
 * @param listingId - Listing ID
 * @returns Promise resolving when update is complete
 */
export async function reactivateListing(listingId: string): Promise<void> {
  const listingRef = doc(db, 'listings', listingId);
  
  await updateDoc(listingRef, {
    status: 'active',
    updated_at: serverTimestamp(),
  });
}
