const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * electron-builder afterPack hook
 * This runs AFTER the app is packaged but BEFORE the DMG is created
 */
module.exports = async function(context) {
  const appOutDir = context.appOutDir;
  const platform = context.electronPlatformName;

  console.log('\n📦 [AfterPack] Running afterPack hook...');
  console.log('Platform:', platform);
  console.log('App output directory:', appOutDir);

  // Determine the app path based on platform
  let appPath;
  if (platform === 'darwin') {
    const appName = context.packager.appInfo.productFilename;
    appPath = path.join(appOutDir, `${appName}.app`, 'Contents', 'Resources', 'nextjs');
  } else if (platform === 'win32') {
    appPath = path.join(appOutDir, 'resources', 'nextjs');
  } else if (platform === 'linux') {
    appPath = path.join(appOutDir, 'resources', 'nextjs');
  }

  const sourceNodeModules = path.join(__dirname, '../.next/standalone/node_modules');
  const targetNodeModules = path.join(appPath, 'node_modules');

  console.log('Source node_modules:', sourceNodeModules);
  console.log('Target location:', targetNodeModules);

  if (!fs.existsSync(sourceNodeModules)) {
    console.error('❌ Source node_modules not found!');
    throw new Error('Source node_modules directory does not exist');
  }

  if (!fs.existsSync(appPath)) {
    console.error('❌ App path not found!');
    throw new Error('App path does not exist');
  }

  // Copy node_modules
  try {
    console.log('Copying node_modules...');

    // Use platform-specific copy command
    if (platform === 'win32') {
      // Windows: use xcopy or robocopy
      execSync(`xcopy "${sourceNodeModules}" "${targetNodeModules}" /E /I /H /Y`, { stdio: 'inherit' });
    } else {
      // macOS/Linux: use rsync
      execSync(`rsync -a "${sourceNodeModules}/" "${targetNodeModules}/"`, { stdio: 'inherit' });
    }

    console.log('✅ node_modules copied successfully!');
  } catch (error) {
    console.error('❌ Failed to copy node_modules:', error.message);
    throw error;
  }

  console.log('📦 [AfterPack] Hook completed successfully\n');
};
