import { LIMITS } from './api/constants.js';

export class ExportError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ExportError';
    this.code = code;
  }
}

const DATA_URL_RE = /^data:([^;,]+)?(;base64)?,(.*)$/s;

export function sanitizeExportSlug(value, fallback = 'custom') {
  const slug = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/:/g, 'x')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
}

export function validateExportDimensions({ width, height }) {
  const errors = [];

  for (const [field, value] of [['width', width], ['height', height]]) {
    if (!Number.isInteger(value)) {
      errors.push(`${field} must be an integer.`);
    } else if (value < LIMITS.minDimension || value > LIMITS.maxDimension) {
      errors.push(`${field} must be between ${LIMITS.minDimension} and ${LIMITS.maxDimension}.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertExportDimensions(dimensions) {
  const result = validateExportDimensions(dimensions);
  if (!result.valid) {
    throw new ExportError('invalid_dimensions', result.errors.join(' '));
  }
}

export function parseDataUrl(dataUrl, { expectedMimeTypes = ['image/png'] } = {}) {
  if (typeof dataUrl !== 'string') {
    throw new ExportError('invalid_data_url', 'Export image data must be a data URL string.');
  }

  const match = DATA_URL_RE.exec(dataUrl);
  if (!match) {
    throw new ExportError('invalid_data_url', 'Export image data is not a valid data URL.');
  }

  const mimeType = match[1] || 'text/plain';
  const isBase64 = Boolean(match[2]);
  const payload = match[3];

  if (expectedMimeTypes.length && !expectedMimeTypes.includes(mimeType)) {
    throw new ExportError('invalid_data_url_type', `Export image data must be ${expectedMimeTypes.join(' or ')}.`);
  }

  if (!isBase64) {
    throw new ExportError('invalid_data_url_encoding', 'Export image data must be base64 encoded.');
  }

  if (!payload) {
    throw new ExportError('invalid_data_url', 'Export image data is empty.');
  }

  return {
    mimeType,
    payload,
  };
}

export function dataUrlToBytes(dataUrl, options) {
  const { payload } = parseDataUrl(dataUrl, options);

  try {
    if (typeof atob !== 'function') {
      throw new Error('Base64 decoder is unavailable.');
    }

    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  } catch {
    throw new ExportError('invalid_data_url', 'Export image data could not be decoded.');
  }
}

export function selectExportImageDataUrl({ hasShader, displayedDataUrl, renderedDataUrl, fallbackDataUrl }) {
  if (displayedDataUrl) return displayedDataUrl;

  if (hasShader) {
    throw new ExportError(
      'shader_capture_unavailable',
      'Shader export is not ready yet. Wait for the preview to finish rendering, then export again.',
    );
  }

  return renderedDataUrl || fallbackDataUrl || null;
}
