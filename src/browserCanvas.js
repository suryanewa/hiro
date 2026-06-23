import { assertExportDimensions, ExportError } from './exportGuards.js';
import { renderGradient } from './gradientRenderer.js';

export function renderGradientToDataUrl(options) {
  assertExportDimensions(options);

  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new ExportError('canvas_unavailable', 'Canvas rendering is unavailable in this browser.');
  }

  renderGradient(ctx, options);

  try {
    return canvas.toDataURL('image/png');
  } catch {
    throw new ExportError('canvas_export_failed', 'Canvas export failed.');
  }
}
