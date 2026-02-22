// Rating and review system functions
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
import { RatingDocument, UserDocument } from './types';
import { validateStars } from './validation';

/**
 * Submit a rating for a user
 * @param reviewerId - ID of user submitting the rating
 * @param revieweeId - ID of user being rated
 * @param stars - Star rating (1-5)
 * @param reviewText - Optional review text
 * @param listingId - Optional listing ID if rating is for a specific listing
 * @returns Promise resolving to the created rating document
 */
export async function submitRating(
  reviewerId: string,
  revieweeId: string,
  stars: number,
  reviewText?: string,
  listingId?: string
): Promise<RatingDocument> {
  // Validate stars
  if (!validateStars(stars)) {
    throw new Error('Stars must be an integer between 1 and 5');
  }
  
  // Prevent self-rating
  if (reviewerId === revieweeId) {
    throw new Error('You cannot rate yourself');
  }
  
  // Check for duplicate rating
  const existingRating = await findExistingRating(reviewerId, revieweeId, listingId);
  if (existingRating) {
    throw new Error('You have already rated this user for this listing');
  }
  
  const ratingRef = doc(collection(db, 'ratings'));
  const ratingId = ratingRef.id;
  
  const newRating: any = {
    rating_id: ratingId,
    reviewer_id: reviewerId,
    reviewee_id: revieweeId,
    stars: stars,
    status: 'active',
    created_at: serverTimestamp(),
  };
  
  if (reviewText) {
    newRating.review_text = reviewText;
  }
  
  if (listingId) {
    newRating.listing_id = listingId;
  }
  
  try {
    await setDoc(ratingRef, newRating);
    
    // Trigger aggregate rating recalculation
    await recalculateAggregateRatings(revieweeId);
    
    // Return the rating with current timestamp for local use
    return {
      ...newRating,
      created_at: Timestamp.now(),
    } as RatingDocument;
  } catch (error: any) {
    console.error('Error submitting rating:', error);
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please make sure you are logged in and have the necessary permissions.');
    }
    throw error;
  }
}

/**
 * Find existing rating by reviewer, reviewee, and optional listing
 * @param reviewerId - Reviewer user ID
 * @param revieweeId - Reviewee user ID
 * @param listingId - Optional listing ID
 * @returns Promise resolving to existing rating or null
 */
async function findExistingRating(
  reviewerId: string,
  revieweeId: string,
  listingId?: string
): Promise<RatingDocument | null> {
  const ratingsRef = collection(db, 'ratings');
  let q = query(
    ratingsRef,
    where('reviewer_id', '==', reviewerId),
    where('reviewee_id', '==', revieweeId)
  );
  
  if (listingId) {
    q = query(q, where('listing_id', '==', listingId));
  }
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  return querySnapshot.docs[0].data() as RatingDocument;
}

/**
 * Recalculate aggregate ratings for a user
 * @param userId - User ID to recalculate ratings for
 * @returns Promise resolving when recalculation is complete
 */
export async function recalculateAggregateRatings(userId: string): Promise<void> {
  try {
    // Get all active ratings for this user
    const ratingsRef = collection(db, 'ratings');
    const q = query(
      ratingsRef,
      where('reviewee_id', '==', userId),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    const ratings = querySnapshot.docs.map(doc => doc.data() as RatingDocument);
    
    if (ratings.length === 0) {
      // No ratings, set to defaults
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        average_rating: 0,
        total_ratings: 0,
        rating_distribution: {},
        updated_at: serverTimestamp(),
      });
      return;
    }
    
    // Calculate average
    const totalStars = ratings.reduce((sum, rating) => sum + rating.stars, 0);
    const averageRating = totalStars / ratings.length;
    
    // Calculate distribution
    const distribution: { [key: number]: number } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    
    ratings.forEach(rating => {
      distribution[rating.stars] = (distribution[rating.stars] || 0) + 1;
    });
    
    // Update user document
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      average_rating: averageRating,
      total_ratings: ratings.length,
      rating_distribution: distribution,
      updated_at: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error recalculating aggregate ratings:', error);
    // Don't throw error - rating was already submitted successfully
    // Just log the error for debugging
  }
}

/**
 * Flag a rating as inappropriate
 * @param ratingId - Rating ID
 * @returns Promise resolving when flag is complete
 */
export async function flagRating(ratingId: string): Promise<void> {
  const ratingRef = doc(db, 'ratings', ratingId);
  
  await updateDoc(ratingRef, {
    status: 'flagged',
  });
}

/**
 * Remove a rating (admin only)
 * @param ratingId - Rating ID
 * @param adminNotes - Optional admin notes
 * @returns Promise resolving when removal is complete
 */
export async function removeRating(
  ratingId: string,
  adminNotes?: string
): Promise<void> {
  const ratingRef = doc(db, 'ratings', ratingId);
  const ratingSnap = await getDoc(ratingRef);
  
  if (!ratingSnap.exists()) {
    throw new Error('Rating not found');
  }
  
  const rating = ratingSnap.data() as RatingDocument;
  
  await updateDoc(ratingRef, {
    status: 'removed',
    ...(adminNotes && { admin_notes: adminNotes }),
  });
  
  // Recalculate aggregate ratings for the reviewee
  await recalculateAggregateRatings(rating.reviewee_id);
}

/**
 * Get a rating by ID
 * @param ratingId - Rating ID
 * @returns Promise resolving to rating document or null
 */
export async function getRating(ratingId: string): Promise<RatingDocument | null> {
  const ratingRef = doc(db, 'ratings', ratingId);
  const ratingSnap = await getDoc(ratingRef);
  
  if (!ratingSnap.exists()) {
    return null;
  }
  
  return ratingSnap.data() as RatingDocument;
}

/**
 * Get all active ratings for a user
 * @param userId - User ID
 * @param limitCount - Maximum number of ratings to retrieve (default 20)
 * @returns Promise resolving to array of rating documents
 */
export async function getUserRatings(
  userId: string,
  limitCount: number = 20
): Promise<RatingDocument[]> {
  const ratingsRef = collection(db, 'ratings');
  const q = query(
    ratingsRef,
    where('reviewee_id', '==', userId),
    where('status', '==', 'active'),
    orderBy('created_at', 'desc'),
    limit(limitCount)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as RatingDocument);
}

/**
 * Get all flagged ratings (admin only)
 * @returns Promise resolving to array of flagged ratings
 */
export async function getFlaggedRatings(): Promise<RatingDocument[]> {
  const ratingsRef = collection(db, 'ratings');
  const q = query(
    ratingsRef,
    where('status', '==', 'flagged'),
    orderBy('created_at', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as RatingDocument);
}
