const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'drive.google.com');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

function sendResponse(res, statusCode, contentType, data) {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(data);
}

function send404(res) {
  sendResponse(res, 404, 'text/plain; charset=utf-8', '404 Not Found');
}

function send500(res) {
  sendResponse(res, 500, 'text/plain; charset=utf-8', '500 Server Error');
}

const server = http.createServer((req, res) => {
  try {
    const requestedPath = decodeURI(req.url.split('?')[0]);
    const normalizedPath = path.normalize(requestedPath)
      .replace(/^\/+/, '')
      .replace(/^(?:drive|docs|classroom)\.google\.com(?:[\\/]|$)/i, '');
    let fsPath = path.join(PUBLIC_DIR, normalizedPath);

    if (fsPath.endsWith(path.sep) || requestedPath === '/' || requestedPath === '') {
      fsPath = path.join(PUBLIC_DIR, 'index.html');
    }

    if (!fsPath.startsWith(PUBLIC_DIR)) {
      send404(res);
      return;
    }

    fs.stat(fsPath, (err, stats) => {
      if (err) {
        send404(res);
        return;
      }

      if (stats.isDirectory()) {
        fsPath = path.join(fsPath, 'index.html');
        fs.stat(fsPath, (err2, stats2) => {
          if (err2 || !stats2.isFile()) {
            send404(res);
            return;
          }
          const contentType = mimeTypes[path.extname(fsPath).toLowerCase()] || 'application/octet-stream';
          const stream = fs.createReadStream(fsPath);
          res.writeHead(200, { 'Content-Type': contentType });
          stream.pipe(res);
        });
        return;
      }

      if (!stats.isFile()) {
        send404(res);
        return;
      }

      const contentType = mimeTypes[path.extname(fsPath).toLowerCase()] || 'application/octet-stream';
      const stream = fs.createReadStream(fsPath);
      res.writeHead(200, { 'Content-Type': contentType });
      stream.on('error', () => send500(res));
      stream.pipe(res);
    });
  } catch (err) {
    send500(res);
  }
});

server.listen(PORT, () => {
  console.log(`Preview server running at http://localhost:${PORT}/`);
  console.log(`Serving content from ${PUBLIC_DIR}`);
});
