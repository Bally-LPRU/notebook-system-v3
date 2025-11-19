# Public Directory

This directory contains static assets and files served directly by the web server.

## Essential Files

### Application Files
- **index.html** - Main HTML entry point for the React application
- **manifest.json** - Progressive Web App (PWA) manifest file
- **robots.txt** - Search engine crawler instructions
- **_headers** - Vercel deployment headers configuration

### Assets
- **favicon.ico** - Browser favicon
- **logo192.png** - PWA icon (192x192)
- **logo512.png** - PWA icon (512x512)
- **default-avatar.svg** - Default user avatar image

### Service Workers
- **sw.js** - Production service worker for PWA functionality and caching

## Removed Files (Archived)

The following debugging and one-time setup files have been removed as they were used for initial development and troubleshooting:

- `check-equipment-collections.html` - Equipment collection verification tool
- `debug-equipment-list.html` - Equipment list debugging interface
- `fix-equipment-schema.html` - Schema migration tool
- `seed-categories.html` - Category seeding interface
- `simple-test.html` - Basic login testing page
- `test-equipment-simple.html` - Equipment data testing page
- `test-incognito.html` - Incognito mode testing page
- `test-login.html` - Login functionality testing page
- `test-in-console.js` - Console-based testing script
- `sw-clear.js` - Cache clearing service worker

These files served their purpose during development and are no longer needed in production. If you need to reference them, check the git history or archived documentation.

## Notes

- Do not add test or debug HTML files directly to this directory
- Use the `scripts/` directory for maintenance and debugging scripts
- Keep this directory clean and production-ready
