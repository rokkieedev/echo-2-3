import { PNG } from 'pngjs';
import { readFileSync } from 'fs';

const data = readFileSync('public/lovable-uploads/78b5e606-3ea4-4586-b0f6-8b8d624eba9b.png');
const png = PNG.sync.read(data);
const { width, height, data: pixels } = png;
const counts = new Map();

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (width * y + x) << 2;
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];
    const a = pixels[idx + 3];
    if (a < 128) continue;
    const key = r + ',' + g + ',' + b;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
}

const topColors = Array.from(counts.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 8)
  .map(([rgb, count]) => {
    const [r, g, b] = rgb.split(',').map(Number);
    return { r, g, b, count };
  });

console.log(topColors);
