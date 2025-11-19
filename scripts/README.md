# Scripts Directory

This directory contains maintenance and utility scripts for the Equipment Lending System.

## Active Maintenance Scripts

### Equipment Management

- **`seed-equipment-data.js`** - Seeds equipment data into Firestore with full validation
- **`seed-equipment-data-simple.js`** - Simple equipment data seeding for testing
- **`seed-equipment-categories.js`** - Seeds equipment categories into Firestore
- **`setup-equipment-management.js`** - Initial setup for equipment management system
- **`validate-equipment-schema.js`** - Validates equipment data against schema

### Database Checks

- **`check-equipment-collections.js`** - Checks equipment collections structure
- **`check-equipment-schema.js`** - Validates equipment schema in database
- **`check-equipment-status.js`** - Checks equipment status values
- **`check-firebase-config.js`** - Validates Firebase configuration

### Category Management

- **`create-categories-collection.js`** - Creates equipment categories collection
- **`create-equipment-collection.js`** - Creates equipment collection with proper structure

### User Management

- **`setup-first-admin.js`** - Sets up the first admin user
- **`set-first-admin-manual.js`** - Manual admin setup script
- **`delete-user-for-testing.js`** - Deletes test users (development only)

### Deployment & Production

- **`deploy-production.js`** - Deploys to production environment
- **`deploy-production-equipment.js`** - Deploys equipment data to production
- **`deploy-vercel.js`** - Deploys to Vercel platform
- **`validate-production.js`** - Validates production deployment
- **`validate-production-equipment.js`** - Validates production equipment data

### Testing & QA

- **`run-production-tests.js`** - Runs production test suite
- **`run-qa-tests.js`** - Runs QA test suite
- **`production-test-suite.js`** - Comprehensive production testing
- **`mobile-device-testing.js`** - Mobile device compatibility testing
- **`security-performance-audit.js`** - Security and performance auditing

### Statistics & Monitoring

- **`update-public-stats.js`** - Updates public statistics
- **`run-update-stats.js`** - Runs statistics update job

### Cache Management

- **`clear-vercel-cache.js`** - Clears Vercel deployment cache

## Archived Scripts

One-time fix scripts and debugging tools have been moved to `scripts/archive/`. These scripts were used to resolve specific issues during development and are kept for historical reference.

### Archived Categories:

- **Debug Scripts**: Tools for debugging authentication, admin access, and equipment issues
- **Fix Scripts**: One-time fixes for data schema, profiles, and permissions
- **Test Scripts**: Ad-hoc testing scripts for specific features

See `scripts/archive/README.md` for details on archived scripts.

## Usage Guidelines

### Running Scripts

Most scripts require Firebase Admin SDK credentials:

```bash
# Set up environment variables
cp .env.example .env.local
# Add your Firebase credentials

# Run a script
node scripts/script-name.js
```

### Development vs Production

- Always test scripts in development environment first
- Use `--dry-run` flag when available
- Backup data before running destructive operations
- Review script output carefully before confirming changes

### Adding New Scripts

When adding new maintenance scripts:

1. Place in appropriate category (or create new one)
2. Add clear documentation at the top of the file
3. Update this README with script description
4. Include error handling and logging
5. Test thoroughly before committing

### Archiving Scripts

Move scripts to `archive/` when:

- They were created for one-time fixes
- The issue they address has been permanently resolved
- They're no longer needed for regular maintenance
- They're superseded by better solutions

## Script Dependencies

Most scripts require:

- Node.js 14+
- Firebase Admin SDK
- Environment variables configured
- Appropriate Firebase permissions

## Support

For issues with scripts:

1. Check script documentation (comments at top of file)
2. Verify environment variables are set correctly
3. Ensure Firebase credentials are valid
4. Check Firebase Console for permission issues
5. Review script output for error messages

## Security Notes

- Never commit service account keys
- Keep `.env` files out of version control
- Use environment-specific credentials
- Limit script permissions to minimum required
- Audit scripts before running in production
