#!/usr/bin/env node
/*
  Dilo Office server (no deps):
  - Serves a small UI
  - SSE stream for events
  - POST /api/event to publish events
*/

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.OFFICE_PORT ? Number(process.env.OFFICE_PORT) : 3010;
const PUBLIC_DIR = path.join(__dirname, 'public');

/** @type {Set<http.ServerResponse>} */
const sseClients = new Set();

function sendSse(res, eventName, data) {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function broadcast(eventName, data) {
  for (const res of sseClients) {
    try { sendSse(res, eventName, data); } catch {}
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', (c) => {
      buf += c;
      if (buf.length > 1_000_000) {
        reject(Object.assign(new Error('Body too large'), { statusCode: 413 }));
        req.destroy();
      }
    });
    req.on('end', () => resolve(buf));
    req.on('error', reject);
  });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'text/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.svg': return 'image/svg+xml';
    case '.png': return 'image/png';
    default: return 'application/octet-stream';
  }
}

function serveStatic(req, res, pathname) {
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.normalize(filePath).replace(/^\.+/, '');
  const abs = path.join(PUBLIC_DIR, filePath);

  if (!abs.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); res.end('Forbidden');
    return;
  }

  fs.readFile(abs, (err, data) => {
    if (err) {
      res.writeHead(404); res.end('Not found');
      return;
    }
    res.writeHead(200, { 'content-type': contentType(abs), 'cache-control': 'no-cache' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://${req.headers.host}`);

    // SSE
    if (req.method === 'GET' && u.pathname === '/events') {
      res.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-transform',
        'connection': 'keep-alive',
        'access-control-allow-origin': '*',
      });
      res.write('\n');
      sseClients.add(res);
      sendSse(res, 'hello', { ok: true, ts: Date.now() });

      const keepAlive = setInterval(() => {
        try { sendSse(res, 'ping', { ts: Date.now() }); } catch {}
      }, 15000);

      req.on('close', () => {
        clearInterval(keepAlive);
        sseClients.delete(res);
      });
      return;
    }

    // CORS preflight for API
    if (u.pathname.startsWith('/api/') && req.method === 'OPTIONS') {
      res.writeHead(204, {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,POST,OPTIONS',
        'access-control-allow-headers': 'content-type',
      });
      res.end();
      return;
    }

    // Publish event
    if (req.method === 'POST' && u.pathname === '/api/event') {
      const body = await readBody(req);
      const data = body ? JSON.parse(body) : {};
      const evt = {
        id: data.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type: data.type || 'event',
        agent: data.agent || 'unknown',
        task: data.task,
        progress: data.progress,
        status: data.status,
        pos: data.pos,
        text: data.text,
        ts: data.ts || Date.now(),
      };
      broadcast('event', evt);
      res.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
        'access-control-allow-origin': '*',
      });
      res.end(JSON.stringify({ ok: true, event: evt }));
      return;
    }

    // Basic health
    if (req.method === 'GET' && u.pathname === '/api/health') {
      res.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
        'access-control-allow-origin': '*',
      });
      res.end(JSON.stringify({ ok: true, clients: sseClients.size, ts: Date.now() }));
      return;
    }

    // Static
    if (req.method === 'GET') {
      return serveStatic(req, res, u.pathname);
    }

    res.writeHead(405); res.end('Method not allowed');
  } catch (e) {
    res.writeHead(e.statusCode || 500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(e.stack || String(e));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[office] listening on http://localhost:${PORT}`);
});
