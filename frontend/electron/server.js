const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = 3002;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
  '.ico': 'image/x-icon',
};

function startServer(outDir) {
  const server = http.createServer((req, res) => {
    // Remove query string and decode URI
    let filePath = decodeURIComponent(req.url.split('?')[0]);

    // Handle root path
    if (filePath === '/') {
      filePath = '/index.html';
    }

    // Determine full path - all files are in the out directory
    const fullPath = path.join(outDir, filePath);

    // Read file
    fs.readFile(fullPath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // File not found - try to serve index.html for client-side routing
          fs.readFile(path.join(outDir, 'index.html'), (err2, content2) => {
            if (err2) {
              res.writeHead(404);
              res.end('Not found');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(content2, 'utf-8');
            }
          });
        } else {
          res.writeHead(500);
          res.end(`Server error: ${err.code}`);
        }
      } else {
        const ext = path.extname(fullPath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });

  server.listen(PORT, 'localhost', () => {
    console.log(`[Static Server] Running at http://localhost:${PORT}/`);
  });

  return server;
}

module.exports = { startServer };
