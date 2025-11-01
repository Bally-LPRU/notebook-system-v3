# Vercel Environment Variables Setup

## Required Environment Variables for Production

Set these variables in Vercel Dashboard → Settings → Environment Variables:

```
REACT_APP_ENVIRONMENT=production
REACT_APP_FIREBASE_API_KEY_PROD=AIzaSyA9D6ReIlhiaaJ1g1Obd-dcjp2R0LO_eyo
REACT_APP_FIREBASE_AUTH_DOMAIN_PROD=equipment-lending-system-41b49.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID_PROD=equipment-lending-system-41b49
REACT_APP_FIREBASE_STORAGE_BUCKET_PROD=equipment-lending-system-41b49.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID_PROD=47770598089
REACT_APP_FIREBASE_APP_ID_PROD=1:47770598089:web:9d898f247f742fe1686b18
REACT_APP_FIREBASE_MEASUREMENT_ID_PROD=G-YQ5GGVMR4V
REACT_APP_USE_EMULATOR=false
```

## Setup Steps:

1. Go to Vercel Dashboard
2. Select your project: equipment-lending-system
3. Navigate to Settings → Environment Variables
4. Add each variable above with:
   - Environment: Production (and Preview if needed)
   - Value: Copy the exact value from above
5. Save each variable
6. Redeploy the project

## Firebase Project Details:
- Project ID: equipment-lending-system-41b49
- Project Number: 47770598089
- App ID: 1:47770598089:web:9d898f247f742fe1686b18

## After Setup:
The website should load properly without Firebase connection errors.