// Regenerates src/glyphs.ts from every character used in src/*.tsx.
import {readFileSync, writeFileSync, readdirSync} from 'node:fs';
const text = readdirSync('src')
  .filter((f) => f.endsWith('.tsx'))
  .map((f) => readFileSync(`src/${f}`, 'utf8'))
  .join('');
const chars = [...new Set([...text])].filter((c) => c.trim()).sort().join('');
writeFileSync('src/glyphs.ts', `export const GLYPHS = ${JSON.stringify(chars)};\n`);
console.log(`glyphs: ${chars.length}`);
