import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'node_modules/@ffmpeg/core/dist/esm');
const destDir = join(root, 'public/ffmpeg');

if (!existsSync(srcDir)) {
  console.warn('[copy-ffmpeg-core] @ffmpeg/core not installed — skip');
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });
cpSync(join(srcDir, 'ffmpeg-core.js'), join(destDir, 'ffmpeg-core.js'));
cpSync(join(srcDir, 'ffmpeg-core.wasm'), join(destDir, 'ffmpeg-core.wasm'));
console.log('[copy-ffmpeg-core] copied ffmpeg core to public/ffmpeg/');
