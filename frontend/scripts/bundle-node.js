const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Bundling Node.js binary...');

// Find Node.js binary
let nodePath;
try {
  nodePath = execSync('which node', { encoding: 'utf8' }).trim();
  console.log(`Found Node.js at: ${nodePath}`);
} catch (e) {
  console.error('❌ Node.js not found in PATH');
  process.exit(1);
}

// Create bundled_node directory
const bundledNodeDir = path.join(__dirname, '../bundled_node');
if (fs.existsSync(bundledNodeDir)) {
  console.log('Removing existing bundled_node...');
  fs.rmSync(bundledNodeDir, { recursive: true, force: true });
}
fs.mkdirSync(bundledNodeDir, { recursive: true });

// Copy Node.js binary
const targetPath = path.join(bundledNodeDir, 'node');
try {
  fs.copyFileSync(nodePath, targetPath);
  // Make it executable
  fs.chmodSync(targetPath, '755');
  console.log(`✅ Node.js binary bundled successfully at: ${targetPath}`);
} catch (e) {
  console.error('❌ Failed to copy Node.js binary:', e.message);
  process.exit(1);
}
