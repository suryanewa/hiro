#!/usr/bin/env node
import { createApiServer } from './api/http.js';

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? '127.0.0.1';
const server = createApiServer();

server.listen(port, host, () => {
  console.log(`Gradients API listening at http://${host}:${port}`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
