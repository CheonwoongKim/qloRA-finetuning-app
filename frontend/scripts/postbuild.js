const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appPath = path.join(__dirname, '../dist/mac-arm64/FineTuning App.app/Contents/Resources/nextjs');
const sourceNodeModules = path.join(__dirname, '../.next/standalone/node_modules');
const targetNodeModules = path.join(appPath, 'node_modules');

console.log('📦 Copying node_modules to packaged app...');
console.log('Source:', sourceNodeModules);
console.log('Target:', targetNodeModules);

if (!fs.existsSync(sourceNodeModules)) {
  console.error('❌ Source node_modules not found!');
  process.exit(1);
}

if (!fs.existsSync(appPath)) {
  console.error('❌ App path not found!');
  process.exit(1);
}

// Use rsync to copy node_modules
try {
  execSync(`rsync -a "${sourceNodeModules}/" "${targetNodeModules}/"`, { stdio: 'inherit' });
  console.log('✅ node_modules copied successfully!');
} catch (error) {
  console.error('❌ Failed to copy node_modules:', error.message);
  process.exit(1);
}
