# Fix Google OAuth Error 400: redirect_uri_mismatch

## Problem
You're getting: `Error 400: redirect_uri_mismatch` when trying to sign in with Google.

This happens because the redirect URIs in your app don't match what's configured in Google Cloud Console.

---

## Solution: Configure Google Cloud Console Properly

### Step 1: Go to Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (StreetConnect or whatever you named it)
3. Go to **APIs & Services** → **Credentials**

### Step 2: Edit OAuth 2.0 Client ID (Web)

1. Find and click on the **Web Client** (NOT Android or iOS)
2. Under **Authorized JavaScript origins**, add:
   ```
   http://localhost:19000
   http://localhost:19001
   http://localhost
   https://localhost
   http://127.0.0.1:19000
   ```

3. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:19000
   http://localhost:19001
   http://localhost
   https://localhost
   https://YOUR_PROJECT.firebaseapp.com/__/auth/callback
   ```
   *(Replace YOUR_PROJECT with your actual Firebase project ID)*

4. Click **Save**

### Step 3: Get Your Client ID Correctly

1. Still in the **Credentials** page
2. Copy your **Web Client ID** (looks like: `123456789-abcdef.apps.googleusercontent.com`)
3. This goes in your `.env.local` as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

### Step 4: Configure Android & iOS (Optional but Recommended)

#### For Android:
1. In Google Cloud Console → Credentials → **Android Client**
2. You'll see the Android Client ID
3. Add to `.env.local` as `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

#### For iOS:
1. In Google Cloud Console → Credentials → **iOS Client**
2. You'll see the iOS Client ID
3. Add to `.env.local` as `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

---

## Step 5: Update .env.local

Your `.env.local` should look like:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyDvtb3ZdyLxDCtdHdiueB4yqXzOxX_mcNU
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=streetconnect-a33c6.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=streetconnect-a33c6
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=streetconnect-a33c6.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=438680171133
EXPO_PUBLIC_FIREBASE_APP_ID=1:438680171133:web:YOUR_APP_ID

EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=YOUR_IOS_CLIENT_ID.apps.googleusercontent.com

EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

---

## Step 6: Verify Firebase Console Settings

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Make sure these are listed:
   - `localhost`
   - `YOUR_PROJECT.firebaseapp.com`
   - Any other domains you'll use

---

## Step 7: Test

1. Stop your app if it's running
2. Clear Expo cache: `expo r -c` or just `r` in the Expo terminal
3. Run again: `npm start`
4. Try Google login

---

## If Still Getting Error

### Try This:
1. **Hard restart Expo:**
   ```bash
   npm start -- --reset-cache
   ```

2. **Check Node/Expo version:**
   ```bash
   npm --version
   npx expo --version
   ```

3. **Clear browser cache:**
   - When Google OAuth popup appears, your browser might have cached old redirect URIs

4. **Check Firebase Project ID:**
   - Make sure `EXPO_PUBLIC_FIREBASE_PROJECT_ID` matches exactly with Google Cloud Project ID

### Common Issues:

| Issue | Solution |
|-------|----------|
| "redirect_uri_mismatch" | Check Authorized JavaScript origins in Google Console |
| "invalid_client" | Check Web Client ID is correct |
| Blank popup | Check Authorized redirect URIs in Google Console |
| Can't sign in locally | Add `http://localhost:19000` and `http://localhost:19001` |

---

## For Production Deployment

When you deploy your app, also add your production domain:

**Google Cloud Console → Credentials → Authorized JavaScript origins:**
```
https://your-production-domain.com
```

**Firebase Console → Authorized domains:**
```
your-production-domain.com
```

---

## Reference Links
- [Expo Google Auth Setup](https://docs.expo.dev/guides/google-authentication/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Firebase Console](https://console.firebase.google.com/)

---

Done! Your Google OAuth should now work perfectly. 🎉
