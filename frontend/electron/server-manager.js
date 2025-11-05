/**
 * Server management module for Next.js and Python backend
 */

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const config = require('./config');

class ServerManager {
  constructor() {
    this.nextJsProcess = null;
    this.pythonProcess = null;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Check if a server is ready by making HTTP requests
   */
  checkServerReady(url, maxRetries = config.retry.maxRetries, interval = config.retry.interval) {
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

  /**
   * Start Next.js server in production mode
   */
  startNextJsServer() {
    if (this.isDevelopment) {
      console.log('Development mode - Next.js dev server should already be running');
      return;
    }

    const resourcesPath = process.resourcesPath;
    const nodePath = path.join(resourcesPath, 'node_bin/node');
    const serverPath = path.join(resourcesPath, 'nextjs/server.js');
    const workingDir = path.join(resourcesPath, 'nextjs');
    const port = config.server.nextjs.production.port;

    console.log('Starting Next.js server...');
    console.log('Node path:', nodePath);
    console.log('Server path:', serverPath);
    console.log('Working directory:', workingDir);

    this.nextJsProcess = spawn(nodePath, [serverPath], {
      cwd: workingDir,
      env: {
        ...process.env,
        PORT: port.toString(),
        HOSTNAME: 'localhost'
      }
    });

    this.nextJsProcess.stdout.on('data', (data) => {
      console.log(`[Next.js] ${data.toString().trim()}`);
    });

    this.nextJsProcess.stderr.on('data', (data) => {
      console.error(`[Next.js Error] ${data.toString().trim()}`);
    });

    this.nextJsProcess.on('close', (code) => {
      console.log(`Next.js server exited with code ${code}`);
    });
  }

  /**
   * Stop Next.js server
   */
  stopNextJsServer() {
    if (this.nextJsProcess) {
      if (typeof this.nextJsProcess.close === 'function') {
        this.nextJsProcess.close();
      } else if (typeof this.nextJsProcess.kill === 'function') {
        this.nextJsProcess.kill();
      }
      this.nextJsProcess = null;
      console.log('Next.js server stopped');
    }
  }

  /**
   * Get Python paths based on environment
   */
  _getPythonPaths() {
    if (this.isDevelopment) {
      return {
        pythonPath: path.join(__dirname, '../../backend/venv/bin/python'),
        backendPath: path.join(__dirname, '../../backend/app/main.py'),
        workingDir: path.join(__dirname, '../../backend'),
        port: config.server.python.dev.port
      };
    } else {
      const resourcesPath = process.resourcesPath;
      return {
        pythonPath: path.join(resourcesPath, 'python_venv/bin/python'),
        backendPath: path.join(resourcesPath, 'backend/app/main.py'),
        workingDir: path.join(resourcesPath, 'backend'),
        port: config.server.python.production.port
      };
    }
  }

  /**
   * Start Python backend server
   */
  startPythonBackend() {
    const { pythonPath, backendPath, workingDir, port } = this._getPythonPaths();

    console.log('Starting Python backend:', { pythonPath, backendPath, workingDir, port });

    this.pythonProcess = spawn(
      pythonPath,
      ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', port.toString()],
      {
        cwd: workingDir,
        env: { ...process.env }
      }
    );

    this.pythonProcess.stdout.on('data', (data) => {
      console.log(`[Python] ${data.toString().trim()}`);
    });

    this.pythonProcess.stderr.on('data', (data) => {
      console.error(`[Python Error] ${data.toString().trim()}`);
    });

    this.pythonProcess.on('close', (code) => {
      console.log(`Python backend exited with code ${code}`);
    });
  }

  /**
   * Stop Python backend server
   */
  stopPythonBackend() {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
      console.log('Python backend stopped');
    }
  }

  /**
   * Get the appropriate Next.js URL based on environment
   */
  getNextJsUrl() {
    return this.isDevelopment
      ? config.server.nextjs.dev.url
      : config.server.nextjs.production.url;
  }

  /**
   * Stop all servers
   */
  stopAll() {
    this.stopNextJsServer();
    this.stopPythonBackend();
  }
}

module.exports = ServerManager;
