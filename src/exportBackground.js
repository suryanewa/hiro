import { zipSync } from 'fflate';
import { renderGradient } from './gradientRenderer';
import gradientRendererSource from './gradientRenderer.js?raw';

const SHADER_REACT_COMPONENTS = {
  'paper-texture': 'PaperTexture',
  'fluted-glass': 'FlutedGlass',
  'water': 'Water',
  'image-dithering': 'ImageDithering',
  'halftone-dots': 'HalftoneDots',
  'halftone-cmyk': 'HalftoneCmyk',
};

const SHADER_IMPORTS = {
  'paper-texture': 'paperTexturePresets',
  'fluted-glass': 'flutedGlassPresets',
  'water': 'waterPresets',
  'image-dithering': 'imageDitheringPresets',
  'halftone-dots': 'halftoneDotsPresets',
  'halftone-cmyk': 'halftoneCmykPresets',
};

export function renderGradientToDataUrl(options) {
  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  renderGradient(ctx, options);
  return canvas.toDataURL('image/png');
}

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

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
  const ratioSlug = ratioLabel.replace(':', 'x').toLowerCase();
  return `hiro-${ratioSlug}-${Date.now()}`;
}

function getShaderScale(shaderType) {
  if (shaderType === 'water' || shaderType === 'fluted-glass') return 1.25;
  if (shaderType === 'paper-texture') return 1.15;
  return 1;
}

function getShaderExtraProps(shaderType, presetName, presetParams) {
  const shaderScale = getShaderScale(shaderType);
  const props = {
    fit: 'cover',
    scale: shaderScale,
    ...presetParams,
  };

  if (shaderType === 'fluted-glass' && (presetName === 'Default' || !presetName)) {
    props.size = 0.92;
    props.shift = -0.18;
    props.scale = shaderScale * 1.1;
  }

  if (shaderType === 'paper-texture' && (presetName === 'Default' || !presetName)) {
    Object.assign(props, {
      colorBack: '#ffffff',
      colorFront: '#ffffff',
      contrast: 0.18,
      roughness: 0,
      fiber: 0.16,
      fiberSize: 0.15,
      crumples: 0.10,
      crumpleSize: 0.1,
      folds: 0,
      foldCount: 1,
      drops: 0,
      fade: 0.4,
      seed: 0,
    });
  }

  return props;
}

function buildReactShaderSnippet(config) {
  const { activeShader, activePreset, presetParams, width, height } = config;
  const componentName = SHADER_REACT_COMPONENTS[activeShader];
  const presetsImport = SHADER_IMPORTS[activeShader];
  const shaderProps = getShaderExtraProps(activeShader, activePreset, presetParams);
  const paperTextureFilter = activeShader === 'paper-texture'
    ? "filter: 'contrast(1.25) saturate(1.25) brightness(1.05)',"
    : '';

  return `import { useEffect, useRef, useState } from 'react';
import { ${componentName} } from '@paper-design/shaders-react';
import { renderGradient } from './gradientRenderer';

const CONFIG = ${JSON.stringify({
    colors: config.colors,
    seed: config.seed,
    isBlurred: config.isBlurred,
    blurStrength: config.blurStrength,
    blendMode: config.blendMode,
    showRing: config.showRing,
    width,
    height,
  }, null, 2)};

const SHADER_PROPS = ${JSON.stringify(shaderProps, null, 2)};

export default function GradientBackground() {
  const canvasRef = useRef(null);
  const [gradientUrl, setGradientUrl] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CONFIG.width;
    canvas.height = CONFIG.height;
    renderGradient(canvas.getContext('2d'), CONFIG);
    setGradientUrl(canvas.toDataURL('image/png'));
  }, []);

  if (!gradientUrl) {
    return <canvas ref={canvasRef} width={CONFIG.width} height={CONFIG.height} style={{ display: 'none' }} />;
  }

  return (
    <${componentName}
      image={gradientUrl}
      width={CONFIG.width}
      height={CONFIG.height}
      {...SHADER_PROPS}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'block',
        objectFit: 'cover',
        ${paperTextureFilter}
      }}
    />
  );
}`;
}

function buildStandaloneRendererScript() {
  return gradientRendererSource
    .replace(/^export function renderGradient/m, 'function renderGradient');
}

export function generateReplicationHtml(config) {
  const {
    colors,
    seed,
    width,
    height,
    isBlurred,
    blurStrength,
    blendMode,
    showRing,
    activeShader,
    activePreset,
    pngFilename,
    ratioLabel,
    pngDataUrl,
  } = config;

  const gradientConfig = {
    colors,
    seed,
    isBlurred,
    blurStrength,
    blendMode,
    showRing,
  };

  const rendererScript = buildStandaloneRendererScript();
  const hasShader = activeShader && activeShader !== 'none';
  const shaderLabel = hasShader
    ? `${activeShader}${activePreset ? ` (${activePreset})` : ''}`
    : null;

  if (hasShader) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Hiro Background — ${ratioLabel} (${width}×${height})</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    .background {
      position: fixed;
      inset: 0;
      background: center / cover no-repeat url('${pngFilename}');
    }
  </style>
</head>
<body>
  <!--
    Shader: ${shaderLabel}
    This page uses the exported PNG (${width}×${height}) which includes the shader effect.
    For a live, parametric version with the same shader, use GradientBackground.jsx
    and gradientRenderer.js from this export bundle.
  -->
  <div class="background" role="img" aria-label="Hiro background with ${shaderLabel} shader"></div>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Hiro Background — ${ratioLabel} (${width}×${height})</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    canvas {
      display: block;
      width: 100vw;
      height: 100vh;
      object-fit: cover;
    }
  </style>
</head>
<body>
  <canvas id="background" aria-hidden="true"></canvas>
  <script>
${rendererScript}

    const CONFIG = ${JSON.stringify(gradientConfig, null, 4)};

    function drawBackground() {
      const canvas = document.getElementById('background');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      renderGradient(canvas.getContext('2d'), {
        ...CONFIG,
        width: canvas.width,
        height: canvas.height,
      });
    }

    drawBackground();
    window.addEventListener('resize', drawBackground);
  </script>
</body>
</html>`;
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
  activeShader,
  activePreset,
  presetParams,
  getDisplayedDataUrl,
  gradientDataUrl,
}) {
  const baseName = buildExportBaseName(ratioLabel);
  const pngFilename = `${baseName}.png`;
  const htmlFilename = `${baseName}.html`;
  const hasShader = activeShader && activeShader !== 'none';

  let pngDataUrl = getDisplayedDataUrl?.() ?? null;

  if (!pngDataUrl) {
    pngDataUrl = renderGradientToDataUrl({
      colors,
      width,
      height,
      seed,
      isBlurred,
      blurStrength,
      blendMode,
      showRing,
    });
  }

  if (!pngDataUrl && gradientDataUrl) {
    pngDataUrl = gradientDataUrl;
  }

  if (!pngDataUrl) return false;

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
    activeShader,
    activePreset,
    presetParams,
    pngFilename,
    pngDataUrl,
  });

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
        activeShader,
        activePreset,
        presetParams: presetParams || {},
      })
    );
  }

  const zipped = zipSync(zipEntries);
  downloadBlob(new Blob([zipped], { type: 'application/zip' }), `${baseName}.zip`);

  return true;
}
