import { getApp, getApps, initializeApp } from "firebase/app";
import * as FirebaseAuth from "@firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase. Reuse the app during Expo Fast Refresh.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication with React Native persistence
let auth;
try {
  const persistence = FirebaseAuth.getReactNativePersistence
    ? FirebaseAuth.getReactNativePersistence(AsyncStorage)
    : FirebaseAuth.inMemoryPersistence;

  auth = FirebaseAuth.initializeAuth(app, { persistence });
} catch (error) {
  // Auth may already be initialized during Fast Refresh.
  auth = FirebaseAuth.getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Storage
const storage = getStorage(app);

export { app, auth, db, storage };
