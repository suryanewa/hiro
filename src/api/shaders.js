import { randomChoice } from './random.js';
import { SHADER_PRESETS } from './shaderPresets.js';

export const SHADER_OPTIONS = Object.freeze([
  { label: 'None', value: 'none' },
  { label: 'Paper Texture', value: 'paper-texture' },
  { label: 'Fluted Glass', value: 'fluted-glass' },
  { label: 'Water', value: 'water' },
  { label: 'Image Dithering', value: 'image-dithering' },
  { label: 'Halftone Dots', value: 'halftone-dots' },
  { label: 'Halftone CMYK', value: 'halftone-cmyk' },
]);

export const SHADER_VALUES = Object.freeze(SHADER_OPTIONS.map((option) => option.value));

export function getShaderPreset(shaderType, presetName) {
  const presets = SHADER_PRESETS[shaderType] ?? [];
  if (!presets.length) return null;
  return presets.find((preset) => preset.name === presetName) ?? presets[0];
}

export function listShaderPresetMetadata() {
  return Object.fromEntries(
    Object.entries(SHADER_PRESETS).map(([shaderType, presets]) => [
      shaderType,
      presets.map((preset) => ({
        name: preset.name,
        params: preset.params ?? {},
      })),
    ]),
  );
}

export function pickRandomShaderSelection(random = Math.random, { includeNone = true } = {}) {
  const options = includeNone
    ? SHADER_OPTIONS
    : SHADER_OPTIONS.filter((option) => option.value !== 'none');
  const selected = randomChoice(options, random)?.value ?? 'none';

  if (selected === 'none') {
    return { shader: 'none', preset: '', presetParams: {} };
  }

  const preset = randomChoice(SHADER_PRESETS[selected] ?? [], random);
  return {
    shader: selected,
    preset: preset?.name ?? '',
    presetParams: preset?.params ?? {},
  };
}

export { SHADER_PRESETS };
