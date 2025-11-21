# Production Setup Guide - Equipment Management System

## Overview

This guide provides comprehensive instructions for setting up and deploying the Equipment Management System to production environment.

## Prerequisites

- Node.js 18+ installed
- Firebase CLI installed and authenticated
- Access to Firebase project: `equipment-lending-system-41b49`
- Production environment variables configured

## Production Environment Configuration

### 1. Environment Variables

Create `.env.production.local` with the following configuration:

```bash
# Environment
REACT_APP_ENVIRONMENT=production
NODE_ENV=production

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Equipment Management Features
REACT_APP_ENABLE_EQUIPMENT_MANAGEMENT=true
REACT_APP_MAX_IMAGE_SIZE=5242880
REACT_APP_MAX_IMAGES_PER_EQUIPMENT=10
REACT_APP_SUPPORTED_IMAGE_TYPES=image/jpeg,image/png,image/webp

# Security Settings
REACT_APP_ENABLE_AUDIT_LOGGING=true
REACT_APP_SESSION_TIMEOUT=3600000
REACT_APP_MAX_LOGIN_ATTEMPTS=5

# Performance Settings
REACT_APP_ENABLE_CACHING=true
REACT_APP_CACHE_TIMEOUT=300000
REACT_APP_PAGINATION_SIZE=20

# Build Settings
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
```

### 2. Firebase Security Rules

#### Firestore Rules
The production Firestore rules include:

- **Equipment Management Collection**: Admin-only write access with comprehensive validation
- **Equipment Categories**: Hierarchical category management with validation
- **Equipment History**: Audit trail with automatic logging
- **Equipment Templates**: Template management for common equipment types
- **User Authentication**: Role-based access control (admin, user)
- **Data Validation**: Comprehensive validation for all data types

Key security features:
- Equipment number uniqueness validation
- Image upload size and type restrictions
- Audit logging for all changes
- Role-based permissions
- Data integrity validation

#### Storage Rules
The production Storage rules include:

- **Equipment Images**: Organized by equipment ID with multiple sizes (original, thumbnail, medium)
- **QR Codes**: Generated QR codes for equipment identification
- **Labels**: PDF and image labels for printing
- **Access Control**: Admin-only write, approved users read
- **File Validation**: Type and size restrictions

### 3. Firebase Hosting Configuration

Production hosting includes:

- **CDN Optimization**: Long-term caching for static assets
- **Security Headers**: CSP, HSTS, XSS protection, frame options
- **Compression**: Gzip compression for all text assets
- **PWA Support**: Service worker and manifest configuration
- **Redirects**: SEO-friendly URL redirects

### 4. Database Indexes

Optimized indexes for:
- Equipment search by status, category, and date
- Search keyword arrays for full-text search
- User activity and audit logs
- Category hierarchy queries
- Equipment history tracking

## Deployment Process

### Automated Deployment

Use the production deployment script:

```bash
# Make script executable
chmod +x scripts/deploy-production-equipment.js

# Run deployment
node scripts/deploy-production-equipment.js
```

The script performs:
1. Environment variable validation
2. Firebase project configuration check
3. Security rules validation
4. Application build
5. Pre-deployment testing
6. Firebase deployment (rules, indexes, hosting)
7. Post-deployment validation
8. Deployment report generation

### Manual Deployment Steps

If you prefer manual deployment:

1. **Install Dependencies**
   ```bash
   npm ci
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Deploy Security Rules**
   ```bash
   firebase deploy --only firestore:rules,storage:rules --project equipment-lending-system-41b49
   ```

4. **Deploy Database Indexes**
   ```bash
   firebase deploy --only firestore:indexes --project equipment-lending-system-41b49
   ```

5. **Deploy Hosting**
   ```bash
   firebase deploy --only hosting --project equipment-lending-system-41b49
   ```

## Production Validation

### Automated Validation

Use the validation script:

```bash
node scripts/validate-production-equipment.js
```

The script checks:
- Site accessibility
- Security headers
- PWA features
- Firebase configuration
- Environment setup
- Basic performance metrics

### Manual Testing Checklist

#### Equipment Management Features
- [ ] Add new equipment with images
- [ ] Edit existing equipment
- [ ] Delete equipment (with confirmation)
- [ ] Bulk operations (edit, delete)
- [ ] Search and filtering
- [ ] Category management
- [ ] QR code generation
- [ ] Label printing
- [ ] Export functionality (Excel, PDF, CSV)

#### Image Management
- [ ] Upload multiple images
- [ ] Image compression and thumbnails
- [ ] Mobile camera capture
- [ ] Image gallery and lightbox
- [ ] Image deletion

#### Security and Permissions
- [ ] Admin-only access to management features
- [ ] User role validation
- [ ] Audit logging
- [ ] Session management
- [ ] Data validation

#### Performance and UX
- [ ] Page load times
- [ ] Mobile responsiveness
- [ ] PWA installation
- [ ] Offline functionality
- [ ] Search performance with large datasets

#### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Monitoring and Maintenance

### Performance Monitoring

1. **Firebase Performance Monitoring**
   - Automatic performance tracking
   - Real user metrics
   - Network request monitoring

2. **Google Analytics**
   - User behavior tracking
   - Feature usage analytics
   - Error tracking

3. **Custom Metrics**
   - Equipment management operations
   - Image upload success rates
   - Search performance

### Error Monitoring

1. **Firebase Crashlytics**
   - JavaScript error tracking
   - User session tracking
   - Custom error logging

2. **Console Monitoring**
   - Firebase Console alerts
   - Quota monitoring
   - Security rule violations

### Backup and Recovery

1. **Firestore Backup**
   - Automated daily backups
   - Export collections regularly
   - Test restore procedures

2. **Storage Backup**
   - Image backup to external storage
   - Regular integrity checks
   - Disaster recovery plan

### Security Maintenance

1. **Regular Security Audits**
   - Review security rules monthly
   - Update dependencies regularly
   - Monitor for vulnerabilities

2. **Access Control Review**
   - Review user permissions quarterly
   - Audit admin access logs
   - Update authentication policies

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables
   - Verify Node.js version
   - Clear npm cache: `npm cache clean --force`

2. **Deployment Failures**
   - Verify Firebase CLI authentication
   - Check project permissions
   - Validate security rules syntax

3. **Performance Issues**
   - Enable caching
   - Optimize images
   - Review database queries
   - Check network requests

4. **Security Rule Errors**
   - Test rules in Firebase Console
   - Check user permissions
   - Validate data structure

### Support and Documentation

- **Firebase Documentation**: https://firebase.google.com/docs
- **React Documentation**: https://reactjs.org/docs
- **Project Repository**: Internal documentation
- **Support Contact**: System administrator

## Maintenance Schedule

### Daily
- Monitor error rates
- Check system performance
- Review security alerts

### Weekly
- Review user feedback
- Check storage usage
- Update documentation

### Monthly
- Security audit
- Performance optimization
- Backup verification
- Dependency updates

### Quarterly
- Full system review
- User access audit
- Disaster recovery test
- Feature usage analysis

## Conclusion

This production setup ensures a secure, performant, and maintainable Equipment Management System. Regular monitoring and maintenance are essential for optimal performance and security.

For questions or issues, contact the system administrator or refer to the troubleshooting section above.