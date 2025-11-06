#!/usr/bin/env node

/**
 * Firebase Configuration Checker
 * ตรวจสอบการตั้งค่า Firebase และ Google Authentication
 */

const config = {
  apiKey: "AIzaSyA9D6ReIlhiaaJ1g1Obd-dcjp2R0LO_eyo",
  authDomain: "equipment-lending-system-41b49.firebaseapp.com",
  projectId: "equipment-lending-system-41b49",
  storageBucket: "equipment-lending-system-41b49.firebasestorage.app",
  messagingSenderId: "47770598089",
  appId: "1:47770598089:web:9d898f247f742fe1686b18",
  measurementId: "G-YQ5GGVMR4V"
};

console.log('🔍 Firebase Configuration Check');
console.log('================================');

// Check required fields
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !config[field]);

if (missingFields.length > 0) {
  console.error('❌ Missing required fields:', missingFields);
} else {
  console.log('✅ All required fields present');
}

// Check domains
console.log('\n🔍 Domain Configuration:');
console.log('Auth Domain:', config.authDomain);
console.log('Current Domain:', process.env.VERCEL_URL || 'localhost');

// Check if domains match
const expectedDomains = [
  'equipment-lending-system-41b49.vercel.app',
  'localhost:3000',
  'localhost:3001',
  '127.0.0.1:3000'
];

console.log('\n🔍 Expected Authorized Domains:');
expectedDomains.forEach(domain => {
  console.log(`- ${domain}`);
});

console.log('\n📋 Firebase Console Checklist:');
console.log('1. Go to Firebase Console > Authentication > Sign-in method');
console.log('2. Enable Google sign-in provider');
console.log('3. Add authorized domains in Authentication > Settings > Authorized domains:');
expectedDomains.forEach(domain => {
  console.log(`   - ${domain}`);
});
console.log('4. Check OAuth consent screen in Google Cloud Console');
console.log('5. Verify redirect URIs in Google Cloud Console > APIs & Services > Credentials');

console.log('\n🔧 Quick Fix Commands:');
console.log('1. Test locally: npm start');
console.log('2. Test production: visit your Vercel URL');
console.log('3. Check browser console for detailed errors');