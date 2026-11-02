import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request as httpRequest } from 'node:http';
import { once } from 'node:events';
import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { openDownloadStream } from '../server/download-stream.js';

test('native download forwards more than 5 GB with bounded memory and backpressure', async () => {
  const size = 5 * 1024 ** 3 + 731;
  const block = Buffer.alloc(64 * 1024, 0x5a);
  const server = createServer((_request, response) => {
    response.writeHead(200, {'Content-Length':String(size)});
    const chunks = async function* () {
      let remaining = size;
      while (remaining > 0) {
        const amount = Math.min(remaining, block.length);
        yield block.subarray(0, amount);
        remaining -= amount;
      }
    };
    pipeline(Readable.from(chunks()), response).catch(() => {});
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  let bytes = 0;
  const initialRSS = process.memoryUsage().rss;
  let peakRSS = initialRSS;
  const timer = setInterval(() => { peakRSS = Math.max(peakRSS, process.memoryUsage().rss); }, 10);
  try {
    const input = await openDownloadStream(`http://127.0.0.1:${server.address().port}`, {}, httpRequest);
    await pipeline(input, new Writable({
      highWaterMark: 16 * 1024,
      write(chunk, _encoding, callback) {
        bytes += chunk.length;
        assert.equal(chunk[0], 0x5a);
        assert.equal(chunk.at(-1), 0x5a);
        setImmediate(callback);
      },
    }));
    assert.equal(bytes, size);
    assert.ok(peakRSS - initialRSS < 256 * 1024 ** 2, `RSS grew by ${(peakRSS-initialRSS)/1024**2} MB`);
    console.log(JSON.stringify({transferredBytes:bytes, peakRSS_MB:Math.round(peakRSS/1024**2), growthMB:Math.round((peakRSS-initialRSS)/1024**2)}));
  } finally {
    clearInterval(timer);
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('aborting a download closes the upstream connection', async () => {
  let closed;
  const disconnected = new Promise((resolve) => { closed = resolve; });
  const server = createServer((_request, response) => {
    response.writeHead(200);
    response.write('start');
    response.once('close', closed);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const controller = new AbortController();
  try {
    const input = await openDownloadStream(`http://127.0.0.1:${server.address().port}`, {signal:controller.signal}, httpRequest);
    const failed = once(input, 'error');
    controller.abort();
    await failed;
    await disconnected;
    assert.ok(input.destroyed);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
