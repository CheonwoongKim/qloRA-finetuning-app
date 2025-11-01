const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

console.log('📦 Bundling Node.js binary...');

// Detect platform
const platform = os.platform();
const isWindows = platform === 'win32';

// Find Node.js binary
let nodePath;
try {
  if (isWindows) {
    // Windows: use 'where' command
    const output = execSync('where node', { encoding: 'utf8' }).trim();
    // Take the first line if multiple paths are returned
    nodePath = output.split('\n')[0].trim();
  } else {
    // macOS/Linux: use 'which' command
    nodePath = execSync('which node', { encoding: 'utf8' }).trim();
  }
  console.log(`Found Node.js at: ${nodePath}`);
} catch (e) {
  console.error('❌ Node.js not found in PATH');
  process.exit(1);
}

// Verify the path exists
if (!fs.existsSync(nodePath)) {
  console.error(`❌ Node.js binary not found at: ${nodePath}`);
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
const targetFileName = isWindows ? 'node.exe' : 'node';
const targetPath = path.join(bundledNodeDir, targetFileName);
try {
  console.log(`Copying from: ${nodePath}`);
  console.log(`Copying to: ${targetPath}`);
  fs.copyFileSync(nodePath, targetPath);
  // Make it executable (Unix-like systems only)
  if (!isWindows) {
    fs.chmodSync(targetPath, '755');
  }
  console.log(`✅ Node.js binary bundled successfully at: ${targetPath}`);
} catch (e) {
  console.error('❌ Failed to copy Node.js binary:', e.message);
  process.exit(1);
}
