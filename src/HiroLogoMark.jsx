import { useEffect, useRef, useState } from 'react';
import { renderGradient } from './gradientRenderer';

const LOGO_VIEWBOX = '0 0 350 260';
const LOGO_PATH = 'M350,110.64v-55.32h-54.69V0h-54.69v55.32H109.38V0h-54.69v55.33H0v55.32h54.69v38.73H0v55.32h54.69v55.32h54.68v-55.32h131.26v55.32h54.68v-55.32h54.69v-55.32h-54.69v-38.73h54.69ZM240.63,149.36H109.37v-38.72h131.26v38.72Z';
const LOGO_ASPECT = 350 / 260;
const LOGO_RENDER_MAX_DIMENSION = 480;
const LUMINANCE_FLOOR = 0.24;
const MAX_LIFT_OPACITY = 0.62;

function getSliceRegion(width, height, targetAspect) {
  const canvasAspect = width / height;

  if (canvasAspect > targetAspect) {
    const regionHeight = height;
    const regionWidth = height * targetAspect;
    return {
      x: (width - regionWidth) / 2,
      y: 0,
      width: regionWidth,
      height: regionHeight,
    };
  }

  const regionWidth = width;
  const regionHeight = width / targetAspect;
  return {
    x: 0,
    y: (height - regionHeight) / 2,
    width: regionWidth,
    height: regionHeight,
  };
}

function getRegionAverageLuminance(canvas, region) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return 1;

  const x = Math.max(0, Math.floor(region.x));
  const y = Math.max(0, Math.floor(region.y));
  const width = Math.max(1, Math.floor(region.width));
  const height = Math.max(1, Math.floor(region.height));
  const imageData = ctx.getImageData(x, y, width, height);
  const { data } = imageData;

  const stride = Math.max(1, Math.floor((width * height) / 4096));
  let sum = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += stride * 4) {
    const alpha = data[i + 3] / 255;
    if (alpha === 0) continue;

    const red = data[i] / 255;
    const green = data[i + 1] / 255;
    const blue = data[i + 2] / 255;
    sum += (0.2126 * red + 0.7152 * green + 0.0722 * blue) * alpha;
    count += alpha;
  }

  return count > 0 ? sum / count : 0;
}

function getLiftOpacity(luminance) {
  if (luminance >= LUMINANCE_FLOOR) return 0;
  const darkness = (LUMINANCE_FLOOR - luminance) / LUMINANCE_FLOOR;
  return Math.min(MAX_LIFT_OPACITY, darkness * MAX_LIFT_OPACITY);
}

export default function HiroLogoMark({
  colors,
  seed,
  isBlurred,
  blurStrength,
  blendMode,
  showRing,
  width,
  height,
}) {
  const [fillUrl, setFillUrl] = useState('');
  const [liftOpacity, setLiftOpacity] = useState(0);
  const frameRef = useRef(null);
  const paramsRef = useRef({});

  paramsRef.current = {
    colors,
    seed,
    isBlurred,
    blurStrength,
    blendMode,
    showRing,
    width,
    height,
  };

  useEffect(() => {
    const draw = () => {
      const params = paramsRef.current;
      const maxDim = Math.max(params.width, params.height);
      const scale = Math.min(1, LOGO_RENDER_MAX_DIMENSION / maxDim);
      const renderWidth = Math.max(1, Math.round(params.width * scale));
      const renderHeight = Math.max(1, Math.round(params.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = renderWidth;
      canvas.height = renderHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      renderGradient(ctx, {
        colors: params.colors,
        width: renderWidth,
        height: renderHeight,
        seed: params.seed,
        isBlurred: params.isBlurred,
        blurStrength: params.blurStrength,
        blendMode: params.blendMode,
        showRing: params.showRing,
      });

      const region = getSliceRegion(renderWidth, renderHeight, LOGO_ASPECT);
      const luminance = getRegionAverageLuminance(canvas, region);

      setFillUrl(canvas.toDataURL('image/png'));
      setLiftOpacity(getLiftOpacity(luminance));
    };

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      draw();
    });

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [colors, seed, isBlurred, blurStrength, blendMode, showRing, width, height]);

  return (
    <svg className="sidebar-logo" viewBox={LOGO_VIEWBOX} aria-hidden="true">
      <defs>
        <clipPath id="hiro-logo-clip">
          <path d={LOGO_PATH} />
        </clipPath>
      </defs>
      {fillUrl && (
        <image
          href={fillUrl}
          width="350"
          height="260"
          clipPath="url(#hiro-logo-clip)"
          preserveAspectRatio="xMidYMid slice"
        />
      )}
      {liftOpacity > 0 && (
        <path
          d={LOGO_PATH}
          fill="#ffffff"
          fillOpacity={liftOpacity}
          style={{ mixBlendMode: 'screen' }}
        />
      )}
    </svg>
  );
}
