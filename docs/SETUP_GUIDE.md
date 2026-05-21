# StreetConnect Firebase Migration Guide

Complete setup and installation guide for migrating from MongoDB to Firebase.

---

## Table of Contents

1. [Pre-requisites](#pre-requisites)
2. [Firebase Setup](#firebase-setup)
3. [Environment Configuration](#environment-configuration)
4. [Installation & Dependencies](#installation--dependencies)
5. [Firestore Database Setup](#firestore-database-setup)
6. [Authentication Setup](#authentication-setup)
7. [Running the Application](#running-the-application)
8. [Deployment](#deployment)

---

## Pre-requisites

- Node.js (v16+) and npm
- Expo CLI: `npm install -g expo-cli`
- Firebase Account (https://console.firebase.google.com)
- Google OAuth Application (https://console.cloud.google.com)
- Xcode (for iOS) or Android Studio (for Android)

---

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name: **streetconnect-a33c6**
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Register Your App

#### For Web:
1. In Firebase Console → Project Settings
2. Click "Add app" → Select Web
3. App nickname: "StreetConnect Web"
4. Copy the Firebase config (you'll use this in `.env.local`)

#### For Android:
1. Click "Add app" → Android
2. Package name: **street.connect.app** (from google-services.json)
3. SHA-1 fingerprint: Get from your Android keystore
4. Download `google-services.json` and place in `android/app/`

#### For iOS:
1. Click "Add app" → iOS
2. Bundle ID: **com.streetconnect.app**
3. Download `GoogleService-Info.plist`
4. Add to Xcode project

### Step 3: Enable Authentication Methods

1. Go to **Authentication** tab
2. Click "Get started"
3. Enable these sign-in methods:
   - **Google** - Required for OAuth
   - **Phone** - For phone authentication (optional, requires billing)
   - **Email/Password** - For email-password login

For Google:
- Go to **Google** provider
- Add your OAuth consent screen information
- Set Authorized JavaScript origins: `http://localhost:19006`, `http://localhost:19000`

### Step 4: Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Production mode**
4. Select region: **asia-southeast1** (or closest to you)
5. Click "Enable"

### Step 5: Set Firestore Security Rules

1. Go to **Firestore → Rules**
2. Replace the default rules with content from `config/firebaseRulesExample.txt`
3. Click "Publish"

### Step 6: Create Storage Bucket

1. Go to **Storage**
2. Click "Get started"
3. Start in **Production mode**
4. Choose same region as Firestore
5. Click "Done"

---

## Environment Configuration

### Frontend Environment Variables

Create/update `.env.local` in project root with your Firebase credentials:

```bash
# From your Firebase Console → Project Settings
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyDvtb3ZdyLxDCtdHdiueB4yqXzOxX_mcNU
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=streetconnect-a33c6.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=streetconnect-a33c6
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=streetconnect-a33c6.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=438680171133
EXPO_PUBLIC_FIREBASE_APP_ID=1:438680171133:web:2ed08dd5c586ebe5a43714

# Google OAuth (from Google Cloud Console)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=438680171133-96q3fhg8eud86q9gke4kh6606nptoplq.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com

# API Configuration
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

**Important:** Use `EXPO_PUBLIC_` prefix for frontend variables (visible to client).

### Backend Environment Variables

Create `.env` in `backend/` directory with Firebase Admin SDK credentials:

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=streetconnect-a33c6
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-private-key-here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@streetconnect-a33c6.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Server Configuration
PORT=4000
NODE_ENV=development
```

#### Getting Firebase Admin SDK Credentials:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the downloaded JSON file
4. Copy values to `.env` or use the JSON file directly

---

## Installation & Dependencies

### Frontend Installation

```bash
cd d:\StreetConnect\StreetConnect

# Install dependencies
npm install

# For development, also install Expo development tools
npm install -g expo-cli
```

**Frontend Dependencies:**
```json
{
  "firebase": "^10.7.0",
  "@react-native-async-storage/async-storage": "^1.21.0",
  "expo-auth-session": "~7.0.11"
}
```

### Backend Installation

```bash
cd backend

# Install dependencies
npm install
```

**Backend Dependencies:**
```json
{
  "firebase-admin": "^12.0.0",
  "express": "^4.21.2",
  "cors": "^2.8.5",
  "dotenv": "^16.4.7"
}
```

**Removed Dependencies:**
- `mongoose` - MongoDB ORM (no longer needed)
- `jsonwebtoken` - JWT tokens (replaced with Firebase ID tokens)

---

## Firestore Database Setup

### Create Collections

The following collections will be created automatically when you first write data, but you can pre-create them for better organization:

#### 1. Create `users` Collection

```bash
# Via Firebase Console:
# → Firestore Database → Create Collection
# Collection ID: users
# Leave first document empty or add sample
```

#### 2. Create `vendors` Collection

Same process with collection ID: `vendors`

#### 3. Create Indexes

Go to Firestore → Indexes and create these composite indexes:

| Collection | Fields | Order |
|-----------|--------|-------|
| vendors | primaryPostalCode, approvalStatus | Ascending, Ascending |
| vendors | primaryPostalCode, primaryCity, createdAt | Ascending, Ascending, Descending |

---

## Authentication Setup

### Google OAuth Setup

#### Step 1: Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select your project (should match Firebase project)
3. Go to **Credentials**
4. Click "Create Credentials" → OAuth 2.0 Client ID
5. Choose "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:19006` (Expo web)
   - `http://localhost:19000` (Expo dev)
   - Your production domain

#### Step 2: Create Android OAuth

1. Create new credential → OAuth 2.0 Client ID → Android
2. Get SHA-1 fingerprint:
   ```bash
   # Development keystore
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
3. Add SHA-1 to OAuth credential
4. Copy Client ID to `.env.local`

#### Step 3: Create iOS OAuth

1. Create new credential → OAuth 2.0 Client ID → iOS
2. Add bundle ID: `com.streetconnect.app`
3. Copy Client ID to `.env.local`

### Phone Authentication Setup

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable "Phone"
3. Configure Phone Verification
4. Note: Phone authentication requires billing enabled on Firebase project

---

## Running the Application

### Development Environment

#### Terminal 1: Run Backend

```bash
cd backend
npm install  # First time only
npm run dev  # Runs with nodemon (watches for changes)
```

Backend will be available at: `http://localhost:4000/api`

#### Terminal 2: Run Frontend

```bash
# From project root
npm start

# Or to run on specific platform:
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # Web browser
```

### Testing Authentication

1. **Email/Password:**
   - Sign up with any email/password
   - Select portal (customer/vendor/admin)
   - App will create user in Firestore

2. **Google Login:**
   - Click "Sign in with Google"
   - Select account
   - User role assigned based on portal selection

3. **Multiple Roles:**
   - Same Google account can login to different portals
   - Role is stored in Firestore per authentication session

### Testing Vendor Features

1. Login as **Vendor**
2. Go to "Address" tab
3. Fill in vendor details and address
4. Click "Save Address"
5. Address will be saved to `vendors/{uid}/addresses/` in Firestore
6. Login as **Admin** to see pending vendor applications

---

## Project Structure

```
StreetConnect/
├── .env.local                    # Frontend environment variables
├── package.json                  # Frontend dependencies
├── App.js                        # Original app (keep as backup)
├── AppNew.js                     # New Firebase-based app
├── babel.config.js
├── app.json
│
├── config/
│   ├── firebaseConfig.js         # Firebase initialization
│   └── firebaseRulesExample.txt  # Firestore Security Rules
│
├── services/
│   ├── authService.js            # Authentication functions
│   └── vendorService.js          # Vendor & locality features
│
├── docs/
│   ├── FIRESTORE_SCHEMA.md       # Database schema documentation
│   └── SETUP_GUIDE.md            # This file
│
└── backend/
    ├── .env                      # Backend environment variables
    ├── package.json              # Backend dependencies
    └── src/
        └── server.js             # Firebase Admin SDK backend
```

---

## Key Changes from MongoDB

### 1. Authentication
- **Before:** JWT tokens generated by backend
- **After:** Firebase ID tokens (automatic, secure)

### 2. Database
- **Before:** MongoDB with Mongoose ORM
- **After:** Firestore with direct SDK calls

### 3. Data Models
- **Before:** MongoDB ObjectIds
- **After:** Firestore document IDs + Firebase Auth UIDs

### 4. Queries
- **Before:** MongoDB queries with Mongoose
- **After:** Firestore queries with built-in indexing

### 5. Real-time Updates
- **Firebase Advantage:** Built-in real-time listeners
  ```javascript
  onSnapshot(doc(db, 'vendors', vendorId), (doc) => {
    // Real-time updates
  });
  ```

---

## Important Files to Replace

### Update App.js

The original `App.js` still uses MongoDB. Replace it with `AppNew.js`:

```bash
# Backup original
cp App.js App.backup.js

# Use new version
cp AppNew.js App.js
```

---

## Deployment

### Frontend Deployment (Expo)

#### Build APK (Android)

```bash
eas build --platform android --profile preview
```

#### Build IPA (iOS)

```bash
eas build --platform ios --profile preview
```

#### Web Deployment

```bash
npm run web
# Build for production
npm run build:web
# Deploy to Vercel, Netlify, etc.
```

### Backend Deployment

#### Option 1: Firebase Cloud Functions (Recommended)

Convert `backend/src/server.js` to Cloud Functions for serverless deployment.

#### Option 2: Cloud Run

```bash
gcloud run deploy street-connect-api --source . --region asia-southeast1
```

#### Option 3: Heroku / Railway / Render

Standard Node.js deployment with environment variables.

---

## Troubleshooting

### Issue: "Firebase is not defined"
- Ensure `firebaseConfig.js` is properly imported in App.js
- Check that EXPO_PUBLIC_FIREBASE_* variables are in `.env.local`

### Issue: "Permission denied" in Firestore
- Check Firestore Rules in Firebase Console
- Ensure user is authenticated before accessing Firestore
- Verify request.auth.uid matches document permissions

### Issue: Google Login not working
- Verify OAuth credentials in `.env.local`
- Check authorized origins in Google Cloud Console
- Ensure Google sign-in method is enabled in Firebase

### Issue: Backend can't connect to Firestore
- Check FIREBASE_PROJECT_ID in `.env`
- Verify service account JSON has correct permissions
- Ensure backend .env variables are properly loaded

---

## Security Checklist

- [ ] Firebase Emulator disabled in production
- [ ] Firestore Rules are restrictive (deny by default)
- [ ] No secrets committed to Git (use .env files)
- [ ] Environment variables properly scoped (EXPO_PUBLIC_ for frontend)
- [ ] API keys rotated regularly
- [ ] Phone authentication requires ReCAPTCHA
- [ ] Admin operations protected with role-based access
- [ ] User data encrypted in transit (HTTPS only)

---

## Next Steps

1. Copy `AppNew.js` to `App.js`
2. Update `.env.local` with your Firebase credentials
3. Run `npm install` to install dependencies
4. Test authentication flows (Email, Google)
5. Test vendor portal and address saving
6. Deploy to Firebase Hosting and Cloud Functions

---

## Support & Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)

---

## Summary of Changes Made

### MongoDB → Firebase Migration

| Component | Before | After |
|-----------|--------|-------|
| Database | MongoDB | Firestore |
| ORM | Mongoose | Firebase SDK |
| Auth | JWT Tokens | Firebase Auth |
| User IDs | ObjectIds | Firebase UID |
| Real-time | Socket.io | Firestore listeners |
| Storage | Server files | Firebase Storage |
| API Keys | Environment | Firestore Rules |

**Total packages removed:** 2 (mongoose, jsonwebtoken)
**Total packages added:** 2 (firebase, @react-native-async-storage/async-storage)
**Breaking changes:** Yes - Complete authentication flow changed
**Migration effort:** Low-Medium (provided scripts handle most)

---

Last Updated: 2024-05-12
