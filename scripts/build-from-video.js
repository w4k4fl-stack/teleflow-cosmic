#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'src', 'config', 'site.config.ts');
const FRAMES_DIR = path.join(ROOT, 'public', 'frames');
const PUBLIC_DIR = path.join(ROOT, 'public');

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  return execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts });
}

function parseArg(name) {
  const idx = process.argv.indexOf(name);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : undefined;
}

function detectVideo(name, candidates) {
  const fromArg = parseArg(`--${name}`);
  if (fromArg) return path.resolve(fromArg);
  for (const c of candidates) {
    const p = path.join(ROOT, c);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function getVideoInfo(videoPath) {
  const fps = execSync(
    `ffprobe -v error -select_streams v:0 -of default=noprint_wrappers=1:nokey=1 -show_entries stream=r_frame_rate "${videoPath}"`,
    { encoding: 'utf-8' }
  ).trim();
  const duration = execSync(
    `ffprobe -v error -select_streams v:0 -of default=noprint_wrappers=1:nokey=1 -show_entries stream=duration "${videoPath}"`,
    { encoding: 'utf-8' }
  ).trim();
  return { fps, duration: parseFloat(duration) || 0 };
}

function parseFps(fpsStr) {
  if (fpsStr.includes('/')) {
    const [a, b] = fpsStr.split('/').map(Number);
    return a / b;
  }
  return Number(fpsStr);
}

function updateConfig(totalFrames) {
  let content = fs.readFileSync(CONFIG_PATH, 'utf-8');
  content = content.replace(/totalFrames:\s*\d+/, `totalFrames: ${totalFrames}`);
  fs.writeFileSync(CONFIG_PATH, content);
  console.log(`Updated site.config.ts: totalFrames=${totalFrames}`);
}

function copyLoopVideo(loopPath) {
  const dest = path.join(PUBLIC_DIR, 'core-loop.mp4');
  fs.copyFileSync(loopPath, dest);
  console.log(`Copied loop video to ${dest}`);
}

async function main() {
  // Check ffmpeg
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
  } catch {
    console.error('ffmpeg is not installed or not in PATH.');
    process.exit(1);
  }

  const approachPath = detectVideo('approach', [
    'approach.mp4',
    'assets/approach.mp4',
    'public/approach.mp4',
  ]);
  const loopPath = detectVideo('loop', [
    'core-loop.mp4',
    'assets/core-loop.mp4',
    'public/core-loop.mp4',
  ]);

  if (!approachPath) {
    console.error('No approach video found. Provide --approach ./approach.mp4 or place approach.mp4 in project root.');
    process.exit(1);
  }
  if (!loopPath) {
    console.error('No loop video found. Provide --loop ./core-loop.mp4 or place core-loop.mp4 in project root.');
    process.exit(1);
  }

  console.log(`Using approach video: ${approachPath}`);
  console.log(`Using loop video: ${loopPath}`);

  // Clean frames
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  // Slice approach frames
  const { fps, duration } = getVideoInfo(approachPath);
  const parsedFps = parseFps(fps);
  console.log(`Approach FPS: ${parsedFps.toFixed(2)}, Duration: ${duration.toFixed(2)}s`);

  const targetFps = Math.min(parsedFps, 30);
  run(
    `ffmpeg -i "${approachPath}" -vf "fps=${targetFps},scale=1280:-1:flags=lanczos" -q:v 2 "${path.join(FRAMES_DIR, 'frame_%04d.jpg')}"`
  );

  const files = fs.readdirSync(FRAMES_DIR).filter((f) => f.endsWith('.jpg')).sort();
  console.log(`Generated ${files.length} approach frames`);

  updateConfig(files.length);

  // Copy loop video to public
  copyLoopVideo(loopPath);

  console.log('\nDone. Run `npm run build` and `vercel --prod` to deploy.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
