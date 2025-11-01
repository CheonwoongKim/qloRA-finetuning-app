const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log('🐍 Bundling Python dependencies...');

// Detect platform
const platform = os.platform();
const isWindows = platform === 'win32';
const isMac = platform === 'darwin';

// Paths
const backendDir = path.join(__dirname, '../../backend');
const bundledVenvDir = path.join(__dirname, '../bundled_venv');
const requirementsPath = path.join(backendDir, 'requirements.txt');

// Clean up existing bundled venv if it exists
if (fs.existsSync(bundledVenvDir)) {
  console.log('Removing existing bundled venv...');
  if (isWindows) {
    execSync(`rmdir /s /q "${bundledVenvDir}"`, { stdio: 'inherit', shell: true });
  } else {
    execSync(`rm -rf "${bundledVenvDir}"`, { stdio: 'inherit' });
  }
}

// Find system Python
let pythonPath;
try {
  if (isWindows) {
    pythonPath = execSync('where python', { encoding: 'utf8' }).trim().split('\n')[0];
  } else {
    pythonPath = execSync('which python3', { encoding: 'utf8' }).trim();
  }
  console.log(`Found Python: ${pythonPath}`);
} catch (e) {
  console.error('Python is not installed or not in PATH');
  process.exit(1);
}

// Create venv
console.log(`Creating virtual environment at: ${bundledVenvDir}`);
try {
  execSync(`"${pythonPath}" -m venv "${bundledVenvDir}"`, { stdio: 'inherit' });
} catch (e) {
  console.error('Failed to create virtual environment');
  process.exit(1);
}

// Determine venv Python path based on platform
const venvPython = isWindows
  ? path.join(bundledVenvDir, 'Scripts', 'python.exe')
  : path.join(bundledVenvDir, 'bin', 'python');

console.log(`Installing dependencies from: ${requirementsPath}`);
try {
  execSync(`"${venvPython}" -m pip install --upgrade pip`, { stdio: 'inherit' });
  execSync(`"${venvPython}" -m pip install -r "${requirementsPath}"`, { stdio: 'inherit' });
} catch (e) {
  console.error('Failed to install dependencies');
  process.exit(1);
}

console.log('✅ Python dependencies bundled successfully!');
