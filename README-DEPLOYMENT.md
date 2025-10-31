# Equipment Lending System - Deployment Guide

## Quick Start

### 1. Vercel Deployment (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to preview
npm run deploy:vercel:preview

# Deploy to production
npm run deploy:vercel
```

### 2. Firebase Hosting Deployment
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy to Firebase
npm run firebase:deploy
```

## Environment Setup

### Required Environment Variables
Set these in Vercel Dashboard or your deployment platform:

```bash
# Environment
REACT_APP_ENVIRONMENT=production
REACT_APP_USE_EMULATOR=false

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY_PROD=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN_PROD=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID_PROD=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET_PROD=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID_PROD=your_sender_id
REACT_APP_FIREBASE_APP_ID_PROD=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID_PROD=your_measurement_id

# Build Settings
GENERATE_SOURCEMAP=false
CI=false
```

## Pre-deployment Checklist

### 1. Run Quality Assurance Tests
```bash
npm run qa:test
```

### 2. Validate Production Environment
```bash
npm run validate:production
```

### 3. Build and Test Locally
```bash
npm run build:production
npm run analyze
```

## Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project
3. Enable Authentication (Google provider)
4. Create Firestore Database
5. Enable Firebase Storage

### 2. Configure Authentication
1. Add authorized domains:
   - `localhost` (for development)
   - `your-domain.vercel.app`
   - `your-custom-domain.com`

### 3. Deploy Security Rules
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## Vercel Setup

### 1. Connect Repository
1. Import project from GitHub
2. Configure build settings:
   - Build Command: `npm run build:production`
   - Output Directory: `build`
   - Install Command: `npm install`

### 2. Set Environment Variables
Add all required environment variables in Vercel Dashboard

### 3. Configure Custom Domain (Optional)
1. Add domain in Vercel Dashboard
2. Update DNS settings
3. Add domain to Firebase authorized domains

## Monitoring and Maintenance

### 1. Performance Monitoring
- Vercel Analytics
- Firebase Performance Monitoring
- Google Analytics (if configured)

### 2. Error Tracking
- Check Vercel Function Logs
- Monitor Firebase Console
- Set up error alerts

### 3. Regular Maintenance
- Update dependencies monthly
- Monitor security advisories
- Review and update security rules
- Backup database regularly

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build:production
```

#### Environment Variables Not Working
1. Check Vercel Dashboard settings
2. Redeploy after changes
3. Verify variable names match exactly

#### Firebase Connection Issues
1. Check authorized domains
2. Verify API keys
3. Test authentication flow

### Getting Help
- Check deployment logs in Vercel Dashboard
- Review Firebase Console for errors
- Contact support if needed

## Security Considerations

### 1. Environment Variables
- Never commit sensitive data to repository
- Use platform-specific environment variable systems
- Rotate API keys regularly

### 2. Firebase Security
- Review Firestore security rules
- Monitor authentication logs
- Set up security alerts

### 3. Domain Security
- Use HTTPS only
- Configure security headers
- Monitor for unauthorized access

## Performance Optimization

### 1. Build Optimization
- Source maps disabled in production
- Code splitting enabled
- Bundle size optimization

### 2. Caching Strategy
- Static assets cached for 1 year
- Dynamic content cached appropriately
- CDN distribution via Vercel

### 3. Database Optimization
- Efficient Firestore queries
- Proper indexing
- Connection pooling

## Backup and Recovery

### 1. Code Backup
- Repository stored in GitHub
- Deployment history in Vercel
- Tagged releases for versions

### 2. Database Backup
- Firebase automatic backups
- Manual exports when needed
- Recovery procedures documented

### 3. Recovery Process
1. Identify issue scope
2. Rollback deployment if needed
3. Restore database if required
4. Verify system functionality
5. Document incident

---

For detailed deployment instructions, see:
- [Vercel Deployment Guide](docs/vercel-deployment.md)
- [Firebase Deployment Guide](DEPLOYMENT.md)
- [User Manual (Thai)](docs/user-manual-th.md)
- [Admin Manual (Thai)](docs/admin-manual-th.md)