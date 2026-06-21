import { generateRandomColorRamp } from 'fettepalette';
import { generateColorRampWithCurve } from 'rampensau';
import { Poline, positionFunctions, randomHSLPair } from 'poline';
import { rybHsl2rgb } from 'rybitten';
import { randomChoice, shuffleArray, withMathRandom } from './random.js';

export const rgbToHex = (r, g, b) => {
  const f = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${f(r)}${f(g)}${f(b)}`;
};

export const hexToRgbVals = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 };
};

export const generateHarmonicPalette = (count, vibrancy = 'vibrant', random = Math.random) => {
  const baseHue = Math.floor(random() * 360);
  const baseSat = 65 + Math.floor(random() * 25);
  const baseLight = 40 + Math.floor(random() * 25);
  const newColors = [];

  let scheme;
  if (vibrancy === 'subtle') {
    scheme = random() > 0.5 ? 'mono' : 'close-analogous';
  } else if (vibrancy === 'normal') {
    scheme = randomChoice(['analogous', 'triadic', 'split', 'mono'], random);
  } else {
    scheme = randomChoice(['triadic', 'split', 'complementary'], random);
  }

  for (let i = 0; i < count; i++) {
    let h;
    let s;
    let l;

    if (vibrancy === 'subtle') {
      if (scheme === 'mono') {
        h = (baseHue + (random() * 6 - 3)) % 360;
        s = Math.max(30, Math.min(100, baseSat + (random() * 8 - 4)));
        l = Math.max(20, Math.min(90, baseLight + (i * 6 - (count * 3))));
      } else {
        h = (baseHue + (i * (6 + random() * 6))) % 360;
        s = Math.max(30, Math.min(100, baseSat + (random() * 8 - 4)));
        l = Math.max(20, Math.min(90, baseLight + (random() * 8 - 4)));
      }
    } else if (vibrancy === 'normal') {
      s = 50 + random() * 35;
      l = 40 + random() * 30;

      if (scheme === 'mono') {
        h = (baseHue + (random() * 12 - 6)) % 360;
        s = Math.max(30, s - (i * 4));
        l = Math.max(25, Math.min(85, l + (i * 8) - 12));
      } else if (scheme === 'analogous') {
        h = (baseHue + (i * 25) + (random() * 10 - 5)) % 360;
      } else if (scheme === 'triadic') {
        h = (baseHue + (i * 120)) % 360;
        if (i >= 3) h = (h + 30) % 360;
      } else {
        if (i === 0) h = baseHue;
        else if (i % 2 === 1) h = (baseHue + 150) % 360;
        else h = (baseHue + 210) % 360;
      }

      if (i === count - 1 && random() > 0.5) {
        l = random() > 0.5 ? 20 + random() * 10 : 80 + random() * 10;
      }
    } else {
      s = 85 + random() * 15;
      l = 35 + random() * 25;

      if (scheme === 'complementary') {
        h = (i % 2 === 0) ? baseHue : (baseHue + 180) % 360;
        h = (h + (random() * 16 - 8)) % 360;
      } else if (scheme === 'triadic') {
        h = (baseHue + (i * 120) + (random() * 10 - 5)) % 360;
      } else {
        if (i === 0) h = baseHue;
        else if (i % 2 === 1) h = (baseHue + 140) % 360;
        else h = (baseHue + 220) % 360;
        h = (h + (random() * 20 - 10)) % 360;
      }

      if (i % 2 === 1) {
        l = Math.max(15, l - 15);
      } else {
        l = Math.min(85, l + 15);
      }

      if (i === count - 1) {
        l = random() > 0.5 ? 10 + random() * 10 : 90 + random() * 8;
        s = 90 + random() * 10;
      }
    }

    if (h < 0) h += 360;
    const rgb = rybHsl2rgb([h, s / 100, l / 100]);
    newColors.push(rgbToHex(rgb[0], rgb[1], rgb[2]));
  }

  return newColors;
};

export const generateFarbveloPalette = (count, vibrancy = 'vibrant', random = Math.random) => {
  const baseHue = Math.floor(random() * 360);
  const minHueDiffAngle = Math.floor(random() * (360 / count)) + 10;
  const numHues = Math.max(count, Math.round(360 / minHueDiffAngle));
  const hues = Array.from({ length: numHues }, (_, i) => (baseHue + i * minHueDiffAngle) % 360);

  let minSat;
  let maxSat;
  let baseSaturation;

  if (vibrancy === 'subtle') {
    baseSaturation = 10 + random() * 20;
    minSat = 20 + random() * 20;
    maxSat = minSat + 20;
  } else if (vibrancy === 'normal') {
    baseSaturation = 20 + random() * 30;
    minSat = 40 + random() * 20;
    maxSat = minSat + 30;
  } else {
    baseSaturation = 30 + random() * 40;
    minSat = 60 + random() * 20;
    maxSat = Math.min(100, minSat + 30);
  }

  const baseLightness = random() * (vibrancy === 'subtle' ? 40 : 20);
  const rangeLightness = 90 - baseLightness;
  const colorHues = [hues[0]];
  const colorSaturations = [baseSaturation];
  const colorLightnesses = [baseLightness + random() * 10];
  const remainingHues = [...hues];
  remainingHues.splice(0, 1);

  for (let i = 0; i < count - 2; i++) {
    const hueIdx = Math.floor(random() * remainingHues.length);
    const hue = remainingHues.splice(hueIdx, 1)[0] ?? hues[Math.floor(random() * hues.length)];
    const saturation = minSat + random() * (maxSat - minSat);
    const light = baseLightness + 15 + ((rangeLightness - 15) / Math.max(1, count - 2)) * i + random() * 10;

    colorHues.push(hue);
    colorSaturations.push(saturation);
    colorLightnesses.push(Math.min(95, light));
  }

  if (count > 1) {
    colorHues.push(remainingHues[0] ?? hues[0]);
    colorSaturations.push(baseSaturation);
    colorLightnesses.push(rangeLightness + random() * 10);
  }

  if (random() > 0.5 && count > 2) {
    const sortedLightnesses = [...colorLightnesses].sort((a, b) => a - b);
    const centerIndex = Math.floor(sortedLightnesses.length / 2);
    const reordered = new Array(sortedLightnesses.length);
    reordered[centerIndex] = sortedLightnesses[sortedLightnesses.length - 1];
    let leftIndex = centerIndex - 1;
    let rightIndex = centerIndex + 1;

    for (let i = sortedLightnesses.length - 2; i >= 0; i--) {
      if (leftIndex >= 0) {
        reordered[leftIndex] = sortedLightnesses[i];
        leftIndex--;
        i--;
      }
      if (i >= 0 && rightIndex < sortedLightnesses.length) {
        reordered[rightIndex] = sortedLightnesses[i];
        rightIndex++;
      }
    }

    colorLightnesses.splice(0, colorLightnesses.length, ...reordered);
  }

  const newColors = [];
  for (let i = 0; i < count; i++) {
    const rgb = rybHsl2rgb([colorHues[i], colorSaturations[i] / 100, colorLightnesses[i] / 100]);
    newColors.push(rgbToHex(rgb[0], rgb[1], rgb[2]));
  }

  return shuffleArray(newColors, random);
};

export const generateFettePalette = (count, vibrancy = 'vibrant', random = Math.random) => {
  const centerHue = random() * 360;
  const hueCycle = vibrancy === 'subtle' ? 0.05 + random() * 0.1 :
    vibrancy === 'normal' ? 0.3 + random() * 0.4 :
      0.6 + random() * 0.8;

  const curveAccent = vibrancy === 'subtle' ? 0 :
    vibrancy === 'normal' ? random() * 0.15 :
      random() * 0.3;

  const minSaturationLight = vibrancy === 'subtle'
    ? [0.1, 0.4]
    : vibrancy === 'normal'
      ? [0.4, 0.2]
      : [0.7, 0.05];

  const maxSaturationLight = vibrancy === 'subtle'
    ? [0.4, 0.8]
    : vibrancy === 'normal'
      ? [0.8, 0.85]
      : [1.0, 0.95];

  const curveMethod = randomChoice(['lamé', 'arc', 'pow', 'powY', 'powX'], random);
  const ramp = withMathRandom(random, () => generateRandomColorRamp({
    total: count,
    centerHue,
    hueCycle,
    curveAccent,
    curveMethod,
    minSaturationLight,
    maxSaturationLight,
    colorModel: 'hsl',
  }));

  return shuffleArray(ramp.base.slice(0, count), random).map(([h, s, l]) => {
    const rgb = rybHsl2rgb([h, s, l]);
    return rgbToHex(rgb[0], rgb[1], rgb[2]);
  });
};

export const generateRampensauPalette = (count, vibrancy = 'vibrant', random = Math.random) => {
  const hStart = random() * 360;
  const hCycles = vibrancy === 'subtle' ? (random() * 0.3) - 0.15 :
    vibrancy === 'normal' ? (random() * 0.8) - 0.4 :
      (random() * 1.5) + 0.5;

  const sRange = vibrancy === 'subtle'
    ? [0.15 + random() * 0.15, 0.3 + random() * 0.15]
    : vibrancy === 'normal'
      ? [0.4 + random() * 0.2, 0.7 + random() * 0.2]
      : [0.7 + random() * 0.2, 0.95 + random() * 0.05];

  const lRange = vibrancy === 'subtle'
    ? [0.35 + random() * 0.15, 0.7 + random() * 0.15]
    : vibrancy === 'normal'
      ? [0.15 + random() * 0.2, 0.8 + random() * 0.15]
      : [0.05 + random() * 0.1, 0.95 + random() * 0.05];

  const ramp = generateColorRampWithCurve({
    total: count,
    hStart,
    hCycles,
    sRange,
    lRange,
    curveMethod: randomChoice(['lamé', 'arc', 'pow', 'powY', 'powX'], random),
    curveAccent: 0.1 + random() * 1.5,
  });

  return shuffleArray(ramp, random).map(([h, s, l]) => {
    const rgb = rybHsl2rgb([h, s, l]);
    return rgbToHex(rgb[0], rgb[1], rgb[2]);
  });
};

export const generatePolinePalette = (count, vibrancy = 'vibrant', random = Math.random) => {
  let saturations;
  let lightnesses;

  if (vibrancy === 'subtle') {
    saturations = [0.15 + random() * 0.15, 0.3 + random() * 0.15];
    lightnesses = [0.35 + random() * 0.15, 0.7 + random() * 0.15];
  } else if (vibrancy === 'normal') {
    saturations = [0.3 + random() * 0.2, 0.55 + random() * 0.2];
    lightnesses = [0.15 + random() * 0.2, 0.8 + random() * 0.15];
  } else {
    saturations = [0.55 + random() * 0.2, 0.85 + random() * 0.15];
    lightnesses = [0.05 + random() * 0.15, 0.9 + random() * 0.08];
  }

  const startHue = random() * 360;
  let anchorColors;

  if (vibrancy === 'vibrant') {
    const h1 = startHue;
    const h2 = (startHue + 120 + random() * 120) % 360;
    anchorColors = [
      [h1, saturations[0] + random() * (saturations[1] - saturations[0]), lightnesses[0] + random() * (lightnesses[1] - lightnesses[0])],
      [h2, saturations[0] + random() * (saturations[1] - saturations[0]), lightnesses[0] + random() * (lightnesses[1] - lightnesses[0])],
    ];
  } else {
    anchorColors = withMathRandom(random, () => randomHSLPair(startHue, saturations, lightnesses));
  }

  const poline = withMathRandom(random, () => new Poline({
    anchorColors,
    numPoints: Math.max(0, count - 2),
    positionFunction: randomChoice(Object.values(positionFunctions), random),
  }));

  return shuffleArray(poline.colors.slice(0, count), random).map(([h, s, l]) => {
    const rgb = rybHsl2rgb([h, s, l]);
    return rgbToHex(rgb[0], rgb[1], rgb[2]);
  });
};

export const generateRandomPalette = (count, vibrancy = 'vibrant', random = Math.random) => {
  const r = random();
  if (r < 0.2) return generateHarmonicPalette(count, vibrancy, random);
  if (r < 0.4) return generateFarbveloPalette(count, vibrancy, random);
  if (r < 0.6) return generateFettePalette(count, vibrancy, random);
  if (r < 0.8) return generateRampensauPalette(count, vibrancy, random);
  return generatePolinePalette(count, vibrancy, random);
};

export const calculatePaletteDistance = (pal1, pal2) => {
  const rgb1 = pal1.map(hexToRgbVals);
  const rgb2 = pal2.map(hexToRgbVals);

  const distDirection = (a, b) => {
    let totalDist = 0;
    a.forEach((c1) => {
      let minDist = Infinity;
      b.forEach((c2) => {
        const d = Math.sqrt(
          Math.pow(c1.r - c2.r, 2) +
          Math.pow(c1.g - c2.g, 2) +
          Math.pow(c1.b - c2.b, 2),
        );
        if (d < minDist) minDist = d;
      });
      totalDist += minDist;
    });
    return totalDist / a.length;
  };

  return (distDirection(rgb1, rgb2) + distDirection(rgb2, rgb1)) / 2;
};

export const generateDifferentPalette = (count, vibrancy, previousColors, maxAttempts = 6, random = Math.random) => {
  if (!previousColors || previousColors.length === 0) return generateRandomPalette(count, vibrancy, random);

  let bestPalette = generateRandomPalette(count, vibrancy, random);
  let maxDistance = -1;

  for (let i = 0; i < maxAttempts; i++) {
    const candidate = generateRandomPalette(count, vibrancy, random);
    const distance = calculatePaletteDistance(candidate, previousColors);

    if (distance > 130) {
      return candidate;
    }
    if (distance > maxDistance) {
      maxDistance = distance;
      bestPalette = candidate;
    }
  }

  return bestPalette;
};
