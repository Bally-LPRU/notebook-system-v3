#!/usr/bin/env node

/**
 * Clear Cache and Restart Development Server
 * ล้าง cache ทั้งหมดและรีสตาร์ท development server
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 กำลังล้าง cache...\n');

// Directories to clear
const cacheDirs = [
  'node_modules/.cache',
  'build',
  '.cache'
];

// Clear cache directories
cacheDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  ลบ ${dir}...`);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ ลบ ${dir} สำเร็จ`);
    } catch (error) {
      console.log(`⚠️  ไม่สามารถลบ ${dir}: ${error.message}`);
    }
  } else {
    console.log(`ℹ️  ${dir} ไม่มีอยู่`);
  }
});

console.log('\n📝 คำแนะนำ:');
console.log('1. ปิด development server ที่กำลังรัน (Ctrl+C)');
console.log('2. ล้าง browser cache:');
console.log('   - Chrome: Ctrl+Shift+Delete > Clear browsing data');
console.log('   - หรือเปิด DevTools > Application > Clear storage > Clear site data');
console.log('3. รัน development server ใหม่: npm start');
console.log('4. เปิดหน้าเว็บในโหมด Incognito/Private');
console.log('\n✅ เสร็จสิ้น!');
