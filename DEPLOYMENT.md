# Production Deployment Guide

## Prerequisites

### 1. Firebase Project Setup
- Create a production Firebase project at [Firebase Console](https://console.firebase.google.com)
- Enable Authentication with Google provider
- Set up Firestore Database
- Enable Firebase Storage
- Configure Firebase Hosting

### 2. Environment Configuration
1. Copy `.env.example` to `.env.production`
2. Update all production Firebase configuration values:
   ```bash
   REACT_APP_ENVIRONMENT=production
   REACT_APP_USE_EMULATOR=false
   REACT_APP_FIREBASE_API_KEY_PROD=your_production_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN_PROD=your_production_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID_PROD=your_production_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET_PROD=your_production_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID_PROD=your_production_sender_id
   REACT_APP_FIREBASE_APP_ID_PROD=your_production_app_id
   REACT_APP_FIREBASE_MEASUREMENT_ID_PROD=your_production_measurement_id
   GENERATE_SOURCEMAP=false
   ```

### 3. Firebase CLI Setup
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (if not already done)
firebase init
```

## Deployment Process

### Option 1: Automated Deployment Script
```bash
npm run deploy:production
```

### Option 2: Manual Deployment Steps

#### Step 1: Pre-deployment Checks
```bash
# Run tests
npm run test:coverage

# Build for production
npm run build:production
```

#### Step 2: Deploy Firebase Services
```bash
# Switch to production project
firebase use your-production-project-id

# Deploy Firestore rules and indexes
firebase deploy --only firestore

# Deploy Storage rules
firebase deploy --only storage

# Deploy hosting
firebase deploy --only hosting
```

#### Step 3: Verify Deployment
1. Visit your production URL: `https://your-project-id.web.app`
2. Test authentication flow
3. Verify all features work correctly

## Security Configuration

### 1. Firestore Security Rules
The production security rules include:
- Email domain validation (@gmail.com, @g.lpru.ac.th)
- Role-based access control
- Data validation for all collections
- Protection against unauthorized access

### 2. Storage Security Rules
- User-specific file access
- Admin-only equipment image management
- File type and size validation

### 3. Authentication Configuration
- Google OAuth with domain restrictions
- User approval workflow
- Admin role management

## Performance Optimization

### 1. Build Optimization
- Source maps disabled in production
- Code splitting enabled
- Bundle size optimization
- Asset compression

### 2. Caching Strategy
- Static assets cached for 1 year
- HTML files with no-cache policy
- CDN distribution via Firebase Hosting

### 3. Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

## Monitoring and Analytics

### 1. Firebase Analytics
- User engagement tracking
- Feature usage analytics
- Performance monitoring

### 2. Error Tracking
- JavaScript error reporting
- Performance metrics
- User behavior analytics

## Post-Deployment Checklist

### Functional Testing
- [ ] User registration and approval workflow
- [ ] Google OAuth authentication
- [ ] Equipment management (CRUD operations)
- [ ] Loan request workflow
- [ ] Reservation system
- [ ] Notification system
- [ ] Admin dashboard functionality
- [ ] Reports generation
- [ ] Search and filtering

### Security Testing
- [ ] Firestore security rules enforcement
- [ ] Storage access controls
- [ ] Authentication flow security
- [ ] Input validation
- [ ] XSS protection

### Performance Testing
- [ ] Page load times
- [ ] Mobile responsiveness
- [ ] Image optimization
- [ ] Bundle size analysis
- [ ] Network performance

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Device Testing
- [ ] Desktop (1920x1080, 1366x768)
- [ ] Tablet (iPad, Android tablets)
- [ ] Mobile (iPhone, Android phones)

## Rollback Procedure

If issues are discovered after deployment:

1. **Immediate Rollback**:
   ```bash
   # Revert to previous hosting deployment
   firebase hosting:clone SOURCE_SITE_ID:SOURCE_VERSION_ID TARGET_SITE_ID
   ```

2. **Database Rollback**:
   - Restore Firestore from backup
   - Revert security rules if needed

3. **Investigation**:
   - Check Firebase Console logs
   - Review error reports
   - Analyze performance metrics

## Maintenance

### Regular Updates
- Update dependencies monthly
- Monitor security advisories
- Review and update security rules
- Backup database regularly

### Performance Monitoring
- Monitor Core Web Vitals
- Track user engagement metrics
- Review error rates
- Analyze performance trends

## Support and Documentation

### User Documentation
- User manual (Thai language)
- Admin guide
- FAQ section
- Video tutorials

### Technical Documentation
- API documentation
- Database schema
- Security implementation
- Troubleshooting guide

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_ENVIRONMENT` | Environment name (production) | Yes |
| `REACT_APP_USE_EMULATOR` | Use Firebase emulators (false) | Yes |
| `REACT_APP_FIREBASE_API_KEY_PROD` | Firebase API key | Yes |
| `REACT_APP_FIREBASE_AUTH_DOMAIN_PROD` | Firebase auth domain | Yes |
| `REACT_APP_FIREBASE_PROJECT_ID_PROD` | Firebase project ID | Yes |
| `REACT_APP_FIREBASE_STORAGE_BUCKET_PROD` | Firebase storage bucket | Yes |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID_PROD` | Firebase messaging sender ID | Yes |
| `REACT_APP_FIREBASE_APP_ID_PROD` | Firebase app ID | Yes |
| `REACT_APP_FIREBASE_MEASUREMENT_ID_PROD` | Firebase measurement ID | No |
| `GENERATE_SOURCEMAP` | Generate source maps (false) | Yes |

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables
   - Verify Node.js version compatibility
   - Clear npm cache: `npm cache clean --force`

2. **Deployment Failures**
   - Verify Firebase CLI authentication
   - Check project permissions
   - Ensure correct project selection

3. **Authentication Issues**
   - Verify OAuth configuration
   - Check domain restrictions
   - Validate security rules

4. **Performance Issues**
   - Analyze bundle size
   - Check network requests
   - Review caching configuration

### Getting Help
- Firebase Support: [Firebase Support](https://firebase.google.com/support)
- React Documentation: [React Docs](https://react.dev)
- Project Issues: Create an issue in the project repository