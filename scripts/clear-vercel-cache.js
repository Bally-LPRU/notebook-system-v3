#!/usr/bin/env node

/**
 * Clear Vercel Cache Script
 * 
 * This script helps clear Vercel's cache to fix ChunkLoadError issues
 */

console.log('🧹 Vercel Cache Clearing Guide\n');
console.log('================================\n');

console.log('📋 Steps to clear Vercel cache:\n');

console.log('1️⃣ Via Vercel Dashboard:');
console.log('   - Go to https://vercel.com/dashboard');
console.log('   - Select your project');
console.log('   - Go to Settings > General');
console.log('   - Scroll to "Build & Development Settings"');
console.log('   - Click "Clear Cache"\n');

console.log('2️⃣ Via Vercel CLI:');
console.log('   npm install -g vercel');
console.log('   vercel --prod --force\n');

console.log('3️⃣ Redeploy with cache cleared:');
console.log('   git commit --allow-empty -m "Clear cache"');
console.log('   git push origin main\n');

console.log('4️⃣ Clear browser cache:');
console.log('   - Chrome: Ctrl+Shift+Delete');
console.log('   - Firefox: Ctrl+Shift+Delete');
console.log('   - Edge: Ctrl+Shift+Delete');
console.log('   - Or use Incognito/Private mode\n');

console.log('5️⃣ Clear Service Worker:');
console.log('   - Open DevTools (F12)');
console.log('   - Go to Application > Service Workers');
console.log('   - Click "Unregister" for all workers');
console.log('   - Refresh the page\n');

console.log('⚠️ Common Issues:\n');
console.log('   - ChunkLoadError: Old chunks cached');
console.log('   - MIME type errors: Wrong Content-Type headers');
console.log('   - Service Worker issues: Old SW cached\n');

console.log('✅ After clearing cache:');
console.log('   - Wait 2-5 minutes for deployment');
console.log('   - Test in Incognito mode');
console.log('   - Check Console for errors\n');

console.log('🔗 Useful Links:');
console.log('   - Vercel Docs: https://vercel.com/docs/concepts/deployments/overview');
console.log('   - Cache Issues: https://vercel.com/docs/concepts/edge-network/caching\n');

// Check if we're in a Vercel environment
if (process.env.VERCEL) {
  console.log('✅ Running in Vercel environment');
  console.log('   Build ID:', process.env.VERCEL_GIT_COMMIT_SHA);
  console.log('   URL:', process.env.VERCEL_URL);
} else {
  console.log('ℹ️ Not running in Vercel environment');
  console.log('   Run this after deploying to Vercel\n');
}

console.log('================================\n');
console.log('💡 Tip: Use "npm run build" locally to test before deploying\n');
