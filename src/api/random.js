export function hashSeed(seed) {
  const text = String(seed ?? 'hiro');
  let hash = 2166136261;

  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createSeededRandom(seed) {
  let state = hashSeed(seed);

  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomChoice(items, random = Math.random) {
  if (!Array.isArray(items) || items.length === 0) return undefined;
  return items[Math.floor(random() * items.length)];
}

export function randomInt(min, max, random = Math.random) {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function shuffleArray(array, random = Math.random) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export function withMathRandom(random, fn) {
  const originalRandom = Math.random;
  Math.random = random;
  try {
    return fn();
  } finally {
    Math.random = originalRandom;
  }
}
