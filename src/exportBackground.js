import { zipSync } from 'fflate';
import { buildReactShaderSnippet, generateReplicationHtml } from './api/snippets.js';
import { renderGradientToDataUrl } from './browserCanvas.js';
import {
  assertExportDimensions,
  dataUrlToBytes,
  ExportError,
  sanitizeExportSlug,
  selectExportImageDataUrl,
} from './exportGuards.js';
import gradientRendererSource from './gradientRenderer.js?raw';

function textToBytes(text) {
  return new TextEncoder().encode(text);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildExportBaseName(ratioLabel) {
  const ratioSlug = sanitizeExportSlug(ratioLabel);
  return `hiro-${ratioSlug}-${Date.now()}`;
}

function buildReadme(config) {
  const { ratioLabel, width, height, activeShader, activePreset, pngFilename, htmlFilename } = config;
  const hasShader = activeShader && activeShader !== 'none';

  const lines = [
    'Hiro Export',
    '===========',
    '',
    `Aspect ratio: ${ratioLabel} (${width}×${height})`,
    '',
    'Files:',
    `- ${pngFilename} — rendered background at export resolution`,
    `- ${htmlFilename} — open in a browser to use the background on the web`,
  ];

  if (hasShader) {
    lines.push(
      '- gradientRenderer.js — canvas gradient generator (base layer)',
      '- GradientBackground.jsx — React component with live shader overlay',
      '',
      `Shader: ${activeShader}${activePreset ? ` (${activePreset})` : ''}`,
      '',
      'The HTML file references the PNG (same folder) to show the shader effect.',
      'Shaders require React and @paper-design/shaders-react — see GradientBackground.jsx.',
    );
  } else {
    lines.push(
      '',
      'The HTML file renders the gradient parametrically in a canvas (no dependencies).',
    );
  }

  return lines.join('\n');
}

export function exportBackground({
  colors,
  seed,
  width,
  height,
  ratioLabel,
  isBlurred,
  blurStrength,
  blendMode,
  showRing,
  frameThickness,
  activeShader,
  activePreset,
  presetParams,
  getDisplayedDataUrl,
  gradientDataUrl,
}) {
  try {
    assertExportDimensions({ width, height });

    const baseName = buildExportBaseName(ratioLabel);
    const pngFilename = `${baseName}.png`;
    const htmlFilename = `${baseName}.html`;
    const hasShader = activeShader && activeShader !== 'none';

    const displayedDataUrl = getDisplayedDataUrl?.() ?? null;
    let renderedDataUrl = null;

    if (!displayedDataUrl && !hasShader) {
      renderedDataUrl = renderGradientToDataUrl({
        colors,
        width,
        height,
        seed,
        isBlurred,
        blurStrength,
        blendMode,
        showRing,
        frameThickness,
      });
    }

    const pngDataUrl = selectExportImageDataUrl({
      hasShader,
      displayedDataUrl,
      renderedDataUrl,
      fallbackDataUrl: gradientDataUrl,
    });

    if (!pngDataUrl) {
      throw new ExportError('export_unavailable', 'No exportable image data was produced.');
    }

    const html = generateReplicationHtml({
      colors,
      seed,
      width,
      height,
      ratioLabel,
      isBlurred,
      blurStrength,
      blendMode,
      showRing,
      frameThickness,
      activeShader,
      activePreset,
      pngFilename,
      pngDataUrl,
    }, { rendererSource: gradientRendererSource });

    const zipEntries = {
      [pngFilename]: dataUrlToBytes(pngDataUrl),
      [htmlFilename]: textToBytes(html),
      'README.txt': textToBytes(buildReadme({
        ratioLabel,
        width,
        height,
        activeShader,
        activePreset,
        pngFilename,
        htmlFilename,
      })),
    };

    if (hasShader) {
      zipEntries['gradientRenderer.js'] = textToBytes(gradientRendererSource);
      zipEntries['GradientBackground.jsx'] = textToBytes(
        buildReactShaderSnippet({
          colors,
          seed,
          width,
          height,
          isBlurred,
          blurStrength,
          blendMode,
          showRing,
          frameThickness,
          activeShader,
          activePreset,
          presetParams: presetParams || {},
        })
      );
    }

    const zipped = zipSync(zipEntries);
    downloadBlob(new Blob([zipped], { type: 'application/zip' }), `${baseName}.zip`);

    return { ok: true, filename: `${baseName}.zip` };
  } catch (error) {
    const exportError = error instanceof Error
      ? error
      : new ExportError('export_failed', 'Export failed.');

    return {
      ok: false,
      error: exportError,
    };
  }
}
