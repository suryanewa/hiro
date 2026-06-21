import { renderGradient } from '../gradientRenderer.js';
import { createGradientConfig } from './validation.js';

const BLEND_MODE_MAP = {
  'source-over': 'normal',
  screen: 'screen',
  overlay: 'overlay',
  'color-dodge': 'color-dodge',
  exclusion: 'exclusion',
  multiply: 'multiply',
  'soft-light': 'soft-light',
};

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return '0';
  return Number(value.toFixed(3)).toString();
}

function parseBlur(filter) {
  if (typeof filter !== 'string' || filter === 'none') return 0;
  const match = /blur\(([\d.]+)px\)/.exec(filter);
  return match ? Number(match[1]) : 0;
}

class SvgCanvasContext {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.globalAlpha = 1;
    this.globalCompositeOperation = 'source-over';
    this.filter = 'none';
    this.elements = [];
    this.path = [];
    this.filters = new Map();
  }

  setTransform() {}

  clearRect() {}

  beginPath() {
    this.path = [];
  }

  moveTo(x, y) {
    this.path.push(`M ${formatNumber(x)} ${formatNumber(y)}`);
  }

  lineTo(x, y) {
    this.path.push(`L ${formatNumber(x)} ${formatNumber(y)}`);
  }

  bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
    this.path.push([
      'C',
      formatNumber(cp1x),
      formatNumber(cp1y),
      formatNumber(cp2x),
      formatNumber(cp2y),
      formatNumber(x),
      formatNumber(y),
    ].join(' '));
  }

  quadraticCurveTo(cpx, cpy, x, y) {
    this.path.push([
      'Q',
      formatNumber(cpx),
      formatNumber(cpy),
      formatNumber(x),
      formatNumber(y),
    ].join(' '));
  }

  fill() {
    if (!this.path.length) return;
    this.elements.push({
      type: 'path',
      d: `${this.path.join(' ')} Z`,
      fill: this.fillStyle,
      ...this.currentPaint(),
    });
  }

  fillRect(x, y, width, height) {
    this.elements.push({
      type: 'rect',
      x,
      y,
      width,
      height,
      fill: this.fillStyle,
      ...this.currentPaint(),
    });
  }

  strokeRect(x, y, width, height) {
    this.elements.push({
      type: 'rect',
      x,
      y,
      width,
      height,
      fill: 'none',
      stroke: this.strokeStyle,
      strokeWidth: this.lineWidth,
      ...this.currentPaint(),
    });
  }

  currentPaint() {
    const blur = parseBlur(this.filter);
    const filterId = blur > 0 ? this.filterIdFor(blur) : null;
    return {
      opacity: this.globalAlpha,
      blendMode: BLEND_MODE_MAP[this.globalCompositeOperation] ?? 'normal',
      filterId,
    };
  }

  filterIdFor(blur) {
    const key = formatNumber(blur);
    if (!this.filters.has(key)) {
      this.filters.set(key, `hiro-blur-${this.filters.size + 1}`);
    }
    return this.filters.get(key);
  }

  elementToSvg(element) {
    const common = [
      element.opacity !== 1 ? `opacity="${formatNumber(element.opacity)}"` : '',
      element.filterId ? `filter="url(#${element.filterId})"` : '',
      element.blendMode !== 'normal' ? `style="mix-blend-mode:${element.blendMode}"` : '',
    ].filter(Boolean).join(' ');
    const suffix = common ? ` ${common}` : '';

    if (element.type === 'path') {
      return `<path d="${escapeXml(element.d)}" fill="${escapeXml(element.fill)}"${suffix} />`;
    }

    const stroke = element.stroke
      ? ` stroke="${escapeXml(element.stroke)}" stroke-width="${formatNumber(element.strokeWidth)}"`
      : '';

    return `<rect x="${formatNumber(element.x)}" y="${formatNumber(element.y)}" width="${formatNumber(element.width)}" height="${formatNumber(element.height)}" fill="${escapeXml(element.fill)}"${stroke}${suffix} />`;
  }

  filtersToSvg() {
    if (!this.filters.size) return '';

    const filters = [...this.filters.entries()].map(([blur, id]) => (
      `<filter id="${id}" x="${formatNumber(-this.width)}" y="${formatNumber(-this.height)}" width="${formatNumber(this.width * 3)}" height="${formatNumber(this.height * 3)}" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="${escapeXml(blur)}" /></filter>`
    ));

    return `<defs>${filters.join('')}</defs>`;
  }

  toSvg({ title = 'Hiro gradient', description = 'Generated gradient background' } = {}) {
    const defs = this.filtersToSvg();
    const body = this.elements.map((element) => this.elementToSvg(element)).join('');

    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}" role="img" aria-labelledby="title desc">`,
      `<title id="title">${escapeXml(title)}</title>`,
      `<desc id="desc">${escapeXml(description)}</desc>`,
      defs,
      body,
      '</svg>',
    ].join('');
  }
}

export function renderGradientToSvg(options = {}) {
  const config = createGradientConfig(options);
  const ctx = new SvgCanvasContext(config.width, config.height);
  renderGradient(ctx, config);
  return ctx.toSvg({
    title: `Hiro gradient ${config.ratioLabel}`,
    description: `${config.colors.length} color gradient rendered from seed ${config.seed}.`,
  });
}
