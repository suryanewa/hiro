import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { renderGradient } from './gradientRenderer';

const GradientCanvas = forwardRef(({ colors, width, height, seed, glassIntensity = 0.1, isBlurred = true, blurStrength = 100, blendMode = 'dynamic', onRender, zoom = 1, containerHeight, showRing }, ref) => {
  const canvasRef = useRef(null);

  useImperativeHandle(ref, () => ({
    exportToDataURL: () => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL('image/png');
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderGradient(ctx, {
      colors,
      width,
      height,
      seed,
      isBlurred,
      blurStrength,
      blendMode,
      showRing,
    });

    if (onRender) {
      onRender(canvas.toDataURL('image/png'));
    }
  }, [colors, width, height, seed, glassIntensity, isBlurred, blurStrength, blendMode, onRender, showRing]);

  const activeContainerHeight = containerHeight || 600;
  const renderScale = (activeContainerHeight / height) * zoom;

  return (
    <div 
      className="canvas-wrapper"
      style={{
        width: `${width * renderScale}px`,
        height: `${height * renderScale}px`
      }}
    >
      <canvas 
        ref={canvasRef} 
        style={{
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
});

export default GradientCanvas;
