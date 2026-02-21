// Firebase Authentication functions
import { 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  User,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';
import { createUser, getUser } from './users';
import { Timestamp } from 'firebase/firestore';

/**
 * Sign in with Google
 * @returns Promise resolving to user credentials
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  
  // Check if user document exists, if not create one
  const existingUser = await getUser(result.user.uid);
  
  if (!existingUser) {
    // Create user document for new Google sign-in
    await createUser(result.user.uid, {
      name: result.user.displayName || 'User',
      age: 18, // Default, user should update
      gender: 'other', // Default, user should update
      phone: result.user.phoneNumber || '', // Will need to be updated
      email: result.user.email || '',
      city: '', // User should update
      home_district: '', // User should update
      user_type: 'both',
      aadhaar_verified: false,
      pan_verified: false,
      verification_status: 'unverified',
      verification_badges: [],
    });
  }
  
  return result;
}

/**
 * Sign in with email and password
 * @param email - User email
 * @param password - User password
 * @returns Promise resolving to user credentials
 */
export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Register with email and password
 * @param email - User email
 * @param password - User password
 * @param userData - Additional user data
 * @returns Promise resolving to user credentials
 */
export async function registerWithEmail(
  email: string,
  password: string,
  userData: {
    name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    phone: string;
    city: string;
    home_district: string;
    user_type: 'searcher' | 'poster' | 'both';
  }
) {
  // Create Firebase Auth user
  const result = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update display name
  await updateProfile(result.user, {
    displayName: userData.name,
  });
  
  // Create Firestore user document
  await createUser(result.user.uid, {
    ...userData,
    email,
    aadhaar_verified: false,
    pan_verified: false,
    verification_status: 'unverified',
    verification_badges: [],
  });
  
  return result;
}

/**
 * Sign out current user
 * @returns Promise resolving when sign out is complete
 */
export async function signOut() {
  return firebaseSignOut(auth);
}

/**
 * Get current authenticated user
 * @returns Current user or null
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Listen to authentication state changes
 * @param callback - Callback function to handle auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Check if user is authenticated
 * @returns Boolean indicating if user is authenticated
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}
