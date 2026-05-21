import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithCredential,
  GoogleAuthProvider,
  PhoneAuthProvider,
  RecaptchaVerifier,
  updateProfile,
  onAuthStateChanged
} from "@firebase/auth";
import { auth, db } from "../config/firebaseConfig";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

/**
 * Sign up user with email and password
 */
export const signUpWithEmail = async (email, password, name, role) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update Firebase Auth user profile
    await updateProfile(userCredential.user, { displayName: name });
    
    // Create user document in Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: email,
      name: name,
      role: role, // "customer", "vendor", "admin"
      status: role === "vendor" ? "pending" : "active",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Sign in user with email and password
 */
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (googleCredential, role) => {
  try {
    const credential = GoogleAuthProvider.credential(googleCredential.idToken);
    const userCredential = await signInWithCredential(auth, credential);
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    
    if (!userDoc.exists()) {
      // Create new user document
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || userCredential.user.email.split("@")[0],
        role: role, // "customer", "vendor", "admin"
        status: role === "vendor" ? "pending" : "active",
        photoURL: userCredential.user.photoURL || null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      // Update role if not already set or if signing in with a different role
      const userData = userDoc.data();
      if (!userData.role || userData.role !== role) {
        await updateDoc(doc(db, "users", userCredential.user.uid), {
          role: role,
          updatedAt: new Date()
        });
      }
    }
    
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Sign in with phone number - Step 1: Send verification code
 */
export const sendPhoneVerificationCode = async (phoneNumber, recaptchaContainerRef) => {
  try {
    // Initialize reCAPTCHA verifier
    const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef, {
      size: "invisible",
      callback: (token) => {
        console.log("reCAPTCHA verified");
      }
    });
    
    // Send verification code
    const phoneProvider = new PhoneAuthProvider(auth);
    const verificationId = await phoneProvider.verifyPhoneNumber(
      phoneNumber,
      recaptchaVerifier
    );
    
    return verificationId;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Sign in with phone number - Step 2: Confirm verification code
 */
export const confirmPhoneVerificationCode = async (verificationId, verificationCode, phoneNumber, role) => {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
    const userCredential = await signInWithCredential(auth, credential);
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    
    if (!userDoc.exists()) {
      // Create new user document
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email || "",
        phone: phoneNumber,
        name: userCredential.user.displayName || "User",
        role: role, // "customer", "vendor", "admin"
        status: role === "vendor" ? "pending" : "active",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      // Update role and phone if needed
      const userData = userDoc.data();
      if (!userData.role || userData.role !== role) {
        await updateDoc(doc(db, "users", userCredential.user.uid), {
          role: role,
          phone: phoneNumber,
          updatedAt: new Date()
        });
      }
    }
    
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Sign out user
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Get current user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Get current user with Firestore data
 */
export const getCurrentUserWithData = async () => {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;
  
  try {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      return { ...userDoc.data(), id: currentUser.uid };
    }
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Update user profile in Firestore
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    throw new Error(error.message);
  }
};
