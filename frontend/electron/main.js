const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let loadingWindow = null;
let pythonProcess = null;
let nextJsServer = null;

function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width: 500,
    height: 350,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  loadingWindow.loadURL(`data:text/html;charset=utf-8,
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            overflow: hidden;
          }
          .container {
            background: rgba(255, 255, 255, 0.98);
            border-radius: 20px;
            padding: 40px 50px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.8);
          }
          .logo {
            width: 60px;
            height: 60px;
            margin: 0 auto 20px;
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            font-weight: 700;
            color: white;
            box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
          }
          .spinner-container {
            position: relative;
            width: 80px;
            height: 80px;
            margin: 20px auto;
          }
          .spinner {
            position: absolute;
            width: 100%;
            height: 100%;
            border: 4px solid transparent;
            border-top: 4px solid #6366f1;
            border-right: 4px solid #a855f7;
            border-radius: 50%;
            animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          }
          .spinner:nth-child(2) {
            border-top-color: #a855f7;
            border-right-color: #6366f1;
            animation-delay: -0.3s;
            width: 90%;
            height: 90%;
            top: 5%;
            left: 5%;
          }
          .spinner:nth-child(3) {
            border-top-color: rgba(99, 102, 241, 0.3);
            border-right-color: rgba(168, 85, 247, 0.3);
            animation-delay: -0.6s;
            width: 80%;
            height: 80%;
            top: 10%;
            left: 10%;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          h2 {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          .status {
            font-size: 14px;
            color: #6b7280;
            margin-top: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .dots {
            display: inline-flex;
            gap: 4px;
          }
          .dot {
            width: 4px;
            height: 4px;
            background: #6366f1;
            border-radius: 50%;
            animation: dotPulse 1.5s ease-in-out infinite;
          }
          .dot:nth-child(2) { animation-delay: 0.2s; }
          .dot:nth-child(3) { animation-delay: 0.4s; }
          @keyframes dotPulse {
            0%, 60%, 100% { transform: scale(1); opacity: 0.5; }
            30% { transform: scale(1.3); opacity: 1; }
          }
          .progress-bar {
            width: 100%;
            height: 3px;
            background: rgba(99, 102, 241, 0.1);
            border-radius: 10px;
            margin-top: 20px;
            overflow: hidden;
          }
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%);
            border-radius: 10px;
            animation: progressFill 2s ease-in-out infinite;
          }
          @keyframes progressFill {
            0% { width: 0%; transform: translateX(-100%); }
            50% { width: 100%; transform: translateX(0); }
            100% { width: 0%; transform: translateX(100%); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">FT</div>
          <h2>FineTuning App</h2>
          <div class="spinner-container">
            <div class="spinner"></div>
            <div class="spinner"></div>
            <div class="spinner"></div>
          </div>
          <div class="status">
            <span id="status-text">Starting application</span>
            <div class="dots">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
        </div>
        <script>
          const statusTexts = [
            'Starting application',
            'Initializing services',
            'Loading resources',
            'Almost ready'
          ];
          let currentIndex = 0;
          setInterval(() => {
            currentIndex = (currentIndex + 1) % statusTexts.length;
            document.getElementById('status-text').textContent = statusTexts[currentIndex];
          }, 1500);
        </script>
      </body>
    </html>
  `);
}

// Check if server is ready
function checkServerReady(url, maxRetries = 30, interval = 1000) {
  return new Promise((resolve, reject) => {
    let retries = 0;

    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          console.log(`Server is ready at ${url}`);
          resolve();
        } else {
          retry();
        }
      }).on('error', () => {
        retry();
      });
    };

    const retry = () => {
      retries++;
      if (retries >= maxRetries) {
        reject(new Error(`Server failed to start after ${maxRetries} attempts`));
      } else {
        console.log(`Waiting for server... (${retries}/${maxRetries})`);
        setTimeout(check, interval);
      }
    };

    check();
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: process.env.NODE_ENV !== 'development', // Enable web security in production
      allowRunningInsecureContent: false,
    },
  });

  const loadURL = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001'
    : 'http://localhost:3002';

  try {
    console.log(`Waiting for server at ${loadURL}...`);
    await checkServerReady(loadURL);

    console.log(`Loading URL: ${loadURL}`);
    await mainWindow.loadURL(loadURL);

    // Close loading window and show main window
    if (loadingWindow) {
      loadingWindow.close();
      loadingWindow = null;
    }

    mainWindow.show();

    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }
  } catch (error) {
    console.error('Failed to load application:', error);
    dialog.showErrorBox('Error', `Failed to start application: ${error.message}`);
    app.quit();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start Next.js server in production
async function startNextJsServer() {
  if (process.env.NODE_ENV === 'development') {
    return; // In dev mode, Next.js dev server is already running
  }

  // In production, run Next.js standalone server
  const resourcesPath = process.resourcesPath;

  // Path to bundled Node.js binary
  const nodePath = path.join(resourcesPath, 'node_bin/node');

  // Path to Next.js standalone server (in extraResources)
  const serverPath = path.join(resourcesPath, 'nextjs/server.js');
  const workingDir = path.join(resourcesPath, 'nextjs');

  console.log('Starting Next.js server...');
  console.log('Node path:', nodePath);
  console.log('Server path:', serverPath);
  console.log('Working directory:', workingDir);

  // Start Next.js server using bundled Node.js
  nextJsServer = spawn(nodePath, [serverPath], {
    cwd: workingDir,
    env: {
      ...process.env,
      PORT: '3002',
      HOSTNAME: 'localhost'
    }
  });

  nextJsServer.stdout.on('data', (data) => {
    console.log(`[Next.js] ${data.toString().trim()}`);
  });

  nextJsServer.stderr.on('data', (data) => {
    console.error(`[Next.js Error] ${data.toString().trim()}`);
  });

  nextJsServer.on('close', (code) => {
    console.log(`Next.js server exited with code ${code}`);
  });
}

// Stop Next.js server
function stopNextJsServer() {
  if (nextJsServer) {
    if (typeof nextJsServer.close === 'function') {
      nextJsServer.close();
    } else if (typeof nextJsServer.kill === 'function') {
      nextJsServer.kill();
    }
    nextJsServer = null;
  }
}

// Find Python executable
function findPython() {
  const possiblePaths = [
    '/usr/bin/python3',
    '/usr/local/bin/python3',
    '/opt/homebrew/bin/python3',
    '/Library/Frameworks/Python.framework/Versions/3.12/bin/python3',
    '/Library/Frameworks/Python.framework/Versions/3.11/bin/python3',
  ];

  // Try to find python3 in PATH
  const { execSync } = require('child_process');
  try {
    const result = execSync('which python3', { encoding: 'utf8' }).trim();
    if (result) return result;
  } catch (e) {
    // Continue to check possible paths
  }

  // Check each possible path
  const fs = require('fs');
  for (const pythonPath of possiblePaths) {
    try {
      if (fs.existsSync(pythonPath)) {
        return pythonPath;
      }
    } catch (e) {
      continue;
    }
  }

  return 'python3'; // Fallback
}

// Start Python backend
function startPythonBackend() {
  let pythonPath, backendPath, workingDir;

  // Use different ports for development and production to avoid conflicts
  const pythonPort = process.env.NODE_ENV === 'development' ? '8000' : '8001';

  if (process.env.NODE_ENV === 'development') {
    // Development mode - use local venv
    pythonPath = path.join(__dirname, '../../backend/venv/bin/python');
    backendPath = path.join(__dirname, '../../backend/app/main.py');
    workingDir = path.join(__dirname, '../../backend');
  } else {
    // Production mode - use bundled venv
    const resourcesPath = process.resourcesPath;
    pythonPath = path.join(resourcesPath, 'python_venv/bin/python');
    backendPath = path.join(resourcesPath, 'backend/app/main.py');
    workingDir = path.join(resourcesPath, 'backend');
  }

  console.log('Starting Python backend:', { pythonPath, backendPath, workingDir, port: pythonPort });

  pythonProcess = spawn(pythonPath, ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', pythonPort], {
    cwd: workingDir,
    env: { ...process.env }
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Python] ${data.toString().trim()}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Python Error] ${data.toString().trim()}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python backend exited with code ${code}`);
  });
}

// Stop Python backend
function stopPythonBackend() {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
}

// IPC Handlers
ipcMain.handle('select-directory', async (event, defaultPath) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    defaultPath: defaultPath || app.getPath('home'),
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('get-app-info', async () => {
  return {
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
  };
});

ipcMain.handle('get-path', async (event, name) => {
  return app.getPath(name);
});

// App lifecycle
app.on('ready', async () => {
  createLoadingWindow();

  await startNextJsServer();
  await createWindow();
  startPythonBackend();
});

app.on('window-all-closed', () => {
  stopNextJsServer();
  stopPythonBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  stopNextJsServer();
  stopPythonBackend();
});
