import assert from 'node:assert/strict';
import test from 'node:test';
import { createApiServer } from '../api/http.js';
import {
  createGradientConfig,
  createGradientHtml,
  createRandomGradientConfig,
  listGradientMetadata,
  normalizeGradientConfig,
  renderGradientAsSvg,
} from '../src/api/index.js';

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve(`http://${address.address}:${address.port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function postJson(baseUrl, path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('creates deterministic seeded random configs', () => {
  const first = createRandomGradientConfig({ seed: 'launch', count: 4, vibrancy: 'normal', ratio: '1:1' });
  const second = createRandomGradientConfig({ seed: 'launch', count: 4, vibrancy: 'normal', ratio: '1:1' });

  assert.deepEqual(first, second);
  assert.equal(first.colors.length, 4);
  assert.equal(first.width, 1080);
  assert.equal(first.height, 1080);
});

test('validates and normalizes gradient configs', () => {
  const config = createGradientConfig({
    colors: ['#abc', '#123456'],
    ratio: 'Web',
    seed: 0.25,
    blurStrength: 55,
    blendMode: 'dynamic',
  });

  assert.equal(config.colors[0], '#aabbcc');
  assert.equal(config.width, 1440);
  assert.equal(config.height, 900);

  const invalid = normalizeGradientConfig({ colors: ['nope'], width: 0, blendMode: 'bad' });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.length >= 3);
});

test('renders gradients as SVG and creates standalone HTML', () => {
  const config = createGradientConfig({
    colors: ['#0f172a', '#3b82f6', '#8b5cf6'],
    width: 320,
    height: 180,
    seed: 0.5,
    blendMode: 'source-over',
  });
  const svg = renderGradientAsSvg(config);
  const html = createGradientHtml(config);

  assert.match(svg, /^<svg/);
  assert.match(svg, /<path|<rect/);
  assert.match(html, /renderGradient/);
});

test('exposes metadata', () => {
  const metadata = listGradientMetadata();
  assert.equal(metadata.name, 'gradients');
  assert.ok(metadata.ratios.some((ratio) => ratio.label === '16:9'));
  assert.ok(metadata.shaderPresets['paper-texture'].length > 0);
});

test('serves HTTP API routes', async () => {
  const server = createApiServer();
  const baseUrl = await listen(server);

  try {
    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).ok, true);

    const random = await postJson(baseUrl, '/api/gradients/random', {
      seed: 'api',
      count: 3,
      includeShader: false,
    });
    assert.equal(random.status, 200);
    const randomJson = await random.json();
    assert.equal(randomJson.config.colors.length, 3);

    const render = await postJson(baseUrl, '/api/gradients/render', randomJson.config);
    assert.equal(render.status, 200);
    assert.match(render.headers.get('content-type'), /image\/svg\+xml/);
    assert.match(await render.text(), /^<svg/);

    const invalid = await postJson(baseUrl, '/api/gradients', { colors: ['bad'] });
    assert.equal(invalid.status, 400);

    const openapi = await fetch(`${baseUrl}/api/openapi.json`);
    assert.equal(openapi.status, 200);
    assert.equal((await openapi.json()).openapi, '3.1.0');
  } finally {
    await close(server);
  }
});
