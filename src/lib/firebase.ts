// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfq4iJMXzEn3IfnOGhpIo9IFD9D0cpKJ8",
  authDomain: "roombridge-e6a36.firebaseapp.com",
  projectId: "roombridge-e6a36",
  storageBucket: "roombridge-e6a36.firebasestorage.app",
  messagingSenderId: "387169383202",
  appId: "1:387169383202:web:79c02d5673a5042bfd2b7b",
  measurementId: "G-KM0JB8LDVT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
