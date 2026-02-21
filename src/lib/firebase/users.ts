// User profile management functions
import { 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserDocument } from './types';

/**
 * Create a new user document in Firestore
 * @param userId - User ID (typically from Firebase Auth)
 * @param userData - User profile data
 * @returns Promise resolving to the created user document
 */
export async function createUser(
  userId: string,
  userData: Omit<UserDocument, 'user_id' | 'created_at' | 'updated_at' | 'average_rating' | 'total_ratings' | 'rating_distribution' | 'ban_status'>
): Promise<UserDocument> {
  const userRef = doc(db, 'users', userId);
  
  const newUser: UserDocument = {
    user_id: userId,
    ...userData,
    // Initialize rating fields
    average_rating: 0,
    total_ratings: 0,
    rating_distribution: {},
    // Initialize ban status
    ban_status: 'none',
    // Timestamps
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  };
  
  await setDoc(userRef, newUser);
  return newUser;
}

/**
 * Update an existing user document
 * @param userId - User ID
 * @param updates - Partial user data to update
 * @returns Promise resolving when update is complete
 */
export async function updateUser(
  userId: string,
  updates: Partial<Omit<UserDocument, 'user_id' | 'created_at' | 'updated_at' | 'verification_status' | 'verification_badges' | 'ban_status' | 'ban_reason' | 'ban_expires_at'>>
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  
  await updateDoc(userRef, {
    ...updates,
    updated_at: serverTimestamp(),
  });
}

/**
 * Get a user document by ID
 * @param userId - User ID
 * @returns Promise resolving to the user document or null if not found
 */
export async function getUser(userId: string): Promise<UserDocument | null> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return null;
  }
  
  return userSnap.data() as UserDocument;
}

/**
 * Update user with student verification fields
 * @param userId - User ID
 * @param studentData - Student verification data
 * @returns Promise resolving when update is complete
 */
export async function updateStudentVerification(
  userId: string,
  studentData: {
    college: string;
    course: string;
    year: number;
    student_id_url: string;
  }
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  
  await updateDoc(userRef, {
    ...studentData,
    updated_at: serverTimestamp(),
  });
}

/**
 * Update user with professional verification fields
 * @param userId - User ID
 * @param professionalData - Professional verification data
 * @returns Promise resolving when update is complete
 */
export async function updateProfessionalVerification(
  userId: string,
  professionalData: {
    company: string;
    role: string;
    professional_id_url: string;
  }
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  
  await updateDoc(userRef, {
    ...professionalData,
    updated_at: serverTimestamp(),
  });
}

/**
 * Update user with identity verification fields
 * @param userId - User ID
 * @param identityData - Identity verification data
 * @returns Promise resolving when update is complete
 */
export async function updateIdentityVerification(
  userId: string,
  identityData: {
    aadhaar_verified: boolean;
    pan_verified: boolean;
    selfie_url?: string;
  }
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  
  await updateDoc(userRef, {
    ...identityData,
    updated_at: serverTimestamp(),
  });
}

/**
 * Add a verification badge to user
 * Note: This should typically be called by Cloud Functions after admin approval
 * @param userId - User ID
 * @param badge - Badge to add ('student', 'professional', 'identity')
 * @returns Promise resolving when update is complete
 */
export async function addVerificationBadge(
  userId: string,
  badge: string
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    throw new Error('User not found');
  }
  
  const userData = userSnap.data() as UserDocument;
  const badges = userData.verification_badges || [];
  
  if (!badges.includes(badge)) {
    badges.push(badge);
    await updateDoc(userRef, {
      verification_badges: badges,
      updated_at: serverTimestamp(),
    });
  }
}
