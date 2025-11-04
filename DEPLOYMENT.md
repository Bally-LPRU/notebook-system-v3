# 🚀 Deployment Guide - Equipment Lending System

## 📋 Overview

This guide covers the deployment process for the Equipment Lending System to production environment.

## 🔧 Prerequisites

### Required Tools
- Node.js (v16 or higher)
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Git

### Required Accounts
- Firebase project with Hosting, Firestore, and Authentication enabled
- Google Cloud Console access (for Firebase project)

## 🌍 Environment Setup

### 1. Environment Variables

Create `.env.production` file with the following variables:

```env
REACT_APP_ENVIRONMENT=production
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
REACT_APP_USE_EMULATOR=false
GENERATE_SOURCEMAP=false
```

### 2. Firebase Configuration

1. **Login to Firebase CLI:**
   ```bash
   firebase login
   ```

2. **Initialize Firebase (if not done):**
   ```bash
   firebase init
   ```

3. **Select your production project:**
   ```bash
   firebase use your-production-project-id
   ```

## 🚀 Deployment Methods

### Method 1: Automated Deployment Script (Recommended)

```bash
npm run deploy:production
```

This script will:
- ✅ Check environment variables
- ✅ Verify Firebase project access
- ✅ Build the application
- ✅ Deploy Firestore rules and indexes
- ✅ Deploy to Firebase Hosting
- ✅ Run post-deployment checks

### Method 2: Manual Deployment

1. **Build the application:**
   ```bash
   npm run build:production
   ```

2. **Deploy Firestore rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Deploy Firestore indexes:**
   ```bash
   firebase deploy --only firestore:indexes
   ```

4. **Deploy to hosting:**
   ```bash
   firebase deploy --only hosting
   ```

### Method 3: Complete Firebase Deployment

```bash
npm run firebase:deploy
```

## 🔒 Security Checklist

### Before Deployment
- [ ] Review Firestore security rules
- [ ] Verify authentication configuration
- [ ] Check environment variables
- [ ] Test build locally
- [ ] Review code for sensitive information

### After Deployment
- [ ] Test authentication flow
- [ ] Verify user permissions
- [ ] Check admin functions
- [ ] Test equipment management
- [ ] Verify notification system
- [ ] Test on multiple devices/browsers

## 📊 Monitoring and Maintenance

### Firebase Console Monitoring
1. **Hosting:** Monitor traffic and performance
2. **Firestore:** Check database usage and queries
3. **Authentication:** Monitor user sign-ins
4. **Functions:** Check function execution (if applicable)

### Performance Monitoring
- Use Firebase Performance Monitoring
- Monitor Core Web Vitals
- Check bundle size and loading times

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check for TypeScript/ESLint errors
   - Verify all dependencies are installed
   - Check environment variables

2. **Deployment Failures:**
   - Verify Firebase CLI authentication
   - Check project permissions
   - Ensure correct project is selected

3. **Runtime Errors:**
   - Check browser console for errors
   - Verify Firebase configuration
   - Check Firestore security rules

### Debug Commands

```bash
# Check Firebase project
firebase projects:list

# Check current project
firebase use

# Test Firestore rules locally
firebase emulators:start --only firestore

# Analyze bundle size
npm run analyze
```

## 📈 Performance Optimization

### Build Optimization
- Source maps disabled in production
- Code splitting enabled
- Tree shaking for unused code
- Minification and compression

### Runtime Optimization
- Lazy loading for routes
- Image optimization
- Caching strategies
- CDN usage (Firebase Hosting)

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm ci
      - run: npm run build:production
        env:
          REACT_APP_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          # ... other environment variables
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-project-id
```

## 📞 Support

For deployment issues:
1. Check Firebase Console for error logs
2. Review application logs in browser console
3. Check Firestore security rules
4. Verify environment configuration

## 📚 Additional Resources

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)