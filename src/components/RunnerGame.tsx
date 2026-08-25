import { useEffect, useRef, useState } from 'react';

interface RunnerGameProps {
  onClose: () => void;
  onHover: () => void;
  onClick: () => void;
}

// Game viewport — low-res pixel-art canvas scaled by CSS
const GAME_W = 480;
const GAME_H = 270;
const GROUND_Y = 220;
const PLAYER_Y_OFFSET = -6; // lift sprite so feet sit on the platform

// Sprite scales relative to the 480x270 canvas
const PLAYER_SCALE = 0.125;
const BARREL_SCALE = 0.105;
const CAN_SCALE = 0.065;
const GROUND_SCALE = 0.13;

// Hitbox definitions as fractions of the on-screen sprite dimensions
// (these mirror the original PDF ratios)
const PLAYER_HITBOX_RUN = { xRel: 10 / 64, yRel: 4 / 64, wRel: 28 / 64, hRel: 56 / 64 };
const PLAYER_HITBOX_JUMP = { xRel: 10 / 64, yRel: 6 / 64, wRel: 24 / 64, hRel: 40 / 64 };
const PLAYER_HITBOX_DUCK = { xRel: 8 / 64, yRel: 16 / 64, wRel: 40 / 64, hRel: 22 / 64 };
const BARREL_HITBOX = { xRel: 5 / 32, yRel: 16 / 48, wRel: 22 / 32, hRel: 28 / 48 };
const CAN_HITBOX = { xRel: 4 / 24, yRel: 4 / 18, wRel: 16 / 24, hRel: 12 / 18 };

// Physics
const GRAVITY = 0.6;
const JUMP_VY = -14.0;
const BASE_SPEED = 3.4;
const MAX_SPEED_ADD = 3.2;

interface Obstacle {
  x: number;
  type: 'barrel' | 'can';
  born: number;
}

const SPRITES = {
  run: '/game-run-sprite.png',
  jump: '/game-jump-sprite.png',
  duck: '/game-duck-sprite.png',
  barrel: '/game-barrel-sprite.png',
  can: '/game-can-sprite.png',
  ground: '/game-ground-sprite.png',
};

export function RunnerGame({ onClose, onHover, onClick }: RunnerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const keysRef = useRef<Record<string, boolean>>({});
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = GAME_W;
    canvas.height = GAME_H;
    ctx.imageSmoothingEnabled = false;

    // Load sprites
    const images: Record<string, HTMLImageElement> = {};
    let loaded = 0;
    const total = Object.keys(SPRITES).length;

    const onLoad = () => {
      loaded++;
      if (loaded === total) setReady(true);
    };

    for (const [key, src] of Object.entries(SPRITES)) {
      const img = new Image();
      img.src = src;
      img.onload = onLoad;
      img.onerror = onLoad;
      images[key] = img;
    }

    // State
    let playerY = GROUND_Y - images.run.height * PLAYER_SCALE + PLAYER_Y_OFFSET;
    let playerVY = 0;
    let isJumping = false;
    let isDucking = false;
    let runFrame = 0;
    let frameCount = 0;
    let speed = BASE_SPEED;
    let obstacles: Obstacle[] = [];
    let spawnTimer = 0;
    let nextSpawn = 70;
    let score = 0;
    let alive = true;

    const reset = () => {
      playerY = GROUND_Y - images.run.height * PLAYER_SCALE + PLAYER_Y_OFFSET;
      playerVY = 0;
      isJumping = false;
      isDucking = false;
      obstacles = [];
      spawnTimer = 0;
      nextSpawn = 70;
      speed = BASE_SPEED;
      score = 0;
      alive = true;
      frameCount = 0;
    };

    const standHeight = () => (isDucking ? images.duck.height * PLAYER_SCALE : images.run.height * PLAYER_SCALE);

    const applyDuck = (active: boolean) => {
      if (active === isDucking) return;
      isDucking = active;
      if (!isJumping) {
        // Instant stance switch, no falling through floor
        playerY = GROUND_Y - standHeight() + PLAYER_Y_OFFSET;
      }
    };

    const jump = () => {
      if (isJumping) return;
      if (isDucking) {
        isDucking = false;
        playerY = GROUND_Y - images.run.height * PLAYER_SCALE + PLAYER_Y_OFFSET;
      }
      playerVY = JUMP_VY;
      isJumping = true;
    };

    const closeGame = () => {
      onClick();
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ([' ', 'arrowup', 'arrowdown', 'control', 'escape'].includes(key)) {
        e.preventDefault();
      }
      keysRef.current[key] = true;

      if (key === 'escape') {
        closeGame();
        return;
      }

      if (!ready) return;

      if (!started) {
        if (key === ' ' || key === 'arrowup' || key === 'arrowdown' || key === 'control') {
          setStarted(true);
          reset();
        }
        return;
      }

      if (!alive) {
        if (key === ' ' || key === 'arrowup') {
          onClick();
          reset();
        }
        return;
      }

      if (key === ' ' || key === 'arrowup') jump();
      if (key === 'arrowdown' || key === 'control') applyDuck(true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current[key] = false;
      if (key === 'arrowdown' || key === 'control') applyDuck(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // --- Drawing helpers ---
    const rect = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    };

    const drawSprite = (
      img: HTMLImageElement,
      x: number,
      y: number,
      scale: number,
      flip = false
    ) => {
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.save();
      if (flip) {
        ctx.translate(x + w / 2, y + h / 2);
        ctx.scale(-1, 1);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } else {
        ctx.drawImage(img, x, y, w, h);
      }
      ctx.restore();
    };

    // --- Background ---
    const drawBackground = () => {
      rect(0, 0, GAME_W, GAME_H, '#0c0c0c');

      // Scrolling ground tiles
      const tileW = images.ground.width * GROUND_SCALE;
      const tileH = images.ground.height * GROUND_SCALE;
      const tileScroll = (frameCount * speed) % tileW;
      for (let x = -tileScroll; x < GAME_W; x += tileW) {
        drawSprite(images.ground, x, GROUND_Y - tileH, GROUND_SCALE);
      }
    };

    // --- Player ---
    const drawPlayer = () => {
      const x = 36;
      const y = playerY;
      if (!isJumping && !isDucking) runFrame += 0.15;

      // Tiny bobbing when running
      const bob = !isJumping && !isDucking ? Math.sin(runFrame * 2) * 2 : 0;

      if (isDucking) {
        drawSprite(images.duck, x, y + bob, PLAYER_SCALE);
      } else if (isJumping) {
        drawSprite(images.jump, x, y, PLAYER_SCALE);
      } else {
        drawSprite(images.run, x, y + bob, PLAYER_SCALE);
      }
    };

    // --- Obstacles ---
    const drawBarrel = (obs: Obstacle) => {
      const w = images.barrel.width * BARREL_SCALE;
      const h = images.barrel.height * BARREL_SCALE;
      const x = obs.x - w / 2;
      const y = GROUND_Y - h;
      drawSprite(images.barrel, x, y, BARREL_SCALE);
    };

    const drawCan = (obs: Obstacle) => {
      const age = frameCount - obs.born;
      const w = images.can.width * CAN_SCALE;
      const h = images.can.height * CAN_SCALE;
      const x = obs.x - w / 2;
      const y = GROUND_Y - 88 + Math.sin(age * 0.12) * 5;
      const rot = Math.sin(age * 0.18) * 0.15;

      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(rot);
      ctx.drawImage(images.can, -w / 2, -h / 2, w, h);
      ctx.restore();
    };

    // --- UI ---
    const drawScore = () => {
      ctx.fillStyle = '#39FF14';
      ctx.font = '20px VT323, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE ${String(score).padStart(5, '0')}`, 12, 24);
    };

    const drawGameOver = () => {
      rect(0, 0, GAME_W, GAME_H, 'rgba(0,0,0,0.75)');
      ctx.strokeStyle = '#FF0055';
      ctx.lineWidth = 1;
      ctx.strokeRect(GAME_W / 2 - 110 + 0.5, GAME_H / 2 - 46 + 0.5, 220, 92);
      rect(GAME_W / 2 - 108, GAME_H / 2 - 44, 216, 88, 'rgba(13,13,13,0.9)');

      ctx.fillStyle = '#FF0055';
      ctx.font = 'bold 34px Rubik Glitch, Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', GAME_W / 2, GAME_H / 2 - 16);
      ctx.fillStyle = '#39FF14';
      ctx.font = '22px VT323, monospace';
      ctx.fillText(`SCORE ${score}`, GAME_W / 2, GAME_H / 2 + 14);
      ctx.font = '14px VT323, monospace';
      ctx.fillText('[ SPACE / UP ] RESTART    [ ESC ] EXIT', GAME_W / 2, GAME_H / 2 + 40);
    };

    const drawStartHint = () => {
      rect(0, 0, GAME_W, GAME_H, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = '#39FF14';
      ctx.font = 'bold 26px Rubik Glitch, Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PRESS SPACE TO PLAY', GAME_W / 2, GAME_H / 2 - 12);
      ctx.font = '14px VT323, monospace';
      ctx.fillText('SPACE / UP = JUMP    DOWN / CTRL = DUCK    ESC = EXIT', GAME_W / 2, GAME_H / 2 + 18);
    };

    const drawLoading = () => {
      rect(0, 0, GAME_W, GAME_H, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = '#39FF14';
      ctx.font = 'bold 22px Rubik Glitch, Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LOADING SPRITES...', GAME_W / 2, GAME_H / 2);
    };

    // --- CRT scanline overlay ---
    const drawCRT = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      for (let y = 0; y < GAME_H; y += 4) {
        ctx.fillRect(0, y, GAME_W, 2);
      }
      const grad = ctx.createRadialGradient(GAME_W / 2, GAME_H / 2, 60, GAME_W / 2, GAME_H / 2, GAME_H * 0.9);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, GAME_W, GAME_H);
    };

    // --- Collision ---
    const getPlayerHitbox = () => {
      const x = 36;
      const h = standHeight();
      const ratios = isDucking ? PLAYER_HITBOX_DUCK : isJumping ? PLAYER_HITBOX_JUMP : PLAYER_HITBOX_RUN;
      return {
        x: x + h * ratios.xRel,
        y: playerY + h * ratios.yRel,
        w: h * ratios.wRel,
        h: h * ratios.hRel,
      };
    };

    const checkCollision = () => {
      const p = getPlayerHitbox();
      for (const obs of obstacles) {
        if (obs.type === 'barrel') {
          const w = images.barrel.width * BARREL_SCALE;
          const h = images.barrel.height * BARREL_SCALE;
          const bx = obs.x - w / 2 + h * BARREL_HITBOX.xRel;
          const by = GROUND_Y - h + h * BARREL_HITBOX.yRel;
          const bw = h * BARREL_HITBOX.wRel;
          const bh = h * BARREL_HITBOX.hRel;
          if (p.x < bx + bw && p.x + p.w > bx && p.y < by + bh && p.y + p.h > by) return true;
        } else {
          const age = frameCount - obs.born;
          const w = images.can.width * CAN_SCALE;
          const h = images.can.height * CAN_SCALE;
          const cx = obs.x - w / 2 + h * CAN_HITBOX.xRel;
          const cy = GROUND_Y - 88 + Math.sin(age * 0.12) * 5 - h / 2 + h * CAN_HITBOX.yRel;
          const cw = h * CAN_HITBOX.wRel;
          const ch = h * CAN_HITBOX.hRel;
          if (p.x < cx + cw && p.x + p.w > cx && p.y < cy + ch && p.y + p.h > cy) return true;
        }
      }
      return false;
    };

    const loop = () => {
      drawBackground();

      if (!ready) {
        drawLoading();
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (!started) {
        drawStartHint();
        drawCRT();
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (alive) {
        frameCount++;
        if (frameCount % 10 === 0) score++;
        speed = BASE_SPEED + Math.min(score / 300, MAX_SPEED_ADD);

        // Physics
        if (isJumping) {
          playerVY += GRAVITY;
          playerY += playerVY;
          const landY = GROUND_Y - (isDucking ? images.duck.height * PLAYER_SCALE : images.run.height * PLAYER_SCALE) + PLAYER_Y_OFFSET;
          if (playerY >= landY) {
            playerY = landY;
            playerVY = 0;
            isJumping = false;
          }
        } else if (!isDucking && playerY !== GROUND_Y - images.run.height * PLAYER_SCALE + PLAYER_Y_OFFSET) {
          playerY = GROUND_Y - images.run.height * PLAYER_SCALE + PLAYER_Y_OFFSET;
        } else if (isDucking && playerY !== GROUND_Y - images.duck.height * PLAYER_SCALE) {
          playerY = GROUND_Y - images.duck.height * PLAYER_SCALE + PLAYER_Y_OFFSET;
        }

        // Spawn obstacles
        spawnTimer++;
        if (spawnTimer >= nextSpawn) {
          const type = Math.random() > 0.45 ? 'barrel' : 'can';
          obstacles.push({ x: GAME_W + 50, type, born: frameCount });
          spawnTimer = 0;
          nextSpawn = Math.max(36, 90 - Math.floor(score / 15));
        }

        obstacles = obstacles.filter((obs) => obs.x > -80);
        for (const obs of obstacles) obs.x -= speed;

        if (checkCollision()) alive = false;
      }

      for (const obs of obstacles) {
        if (obs.type === 'barrel') drawBarrel(obs);
        else drawCan(obs);
      }

      drawPlayer();
      drawScore();
      if (!alive) drawGameOver();
      drawCRT();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, [onClick, onClose, started, ready]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-5xl aspect-video border-4 border-sludge shadow-[0_0_40px_rgba(57,255,20,0.4)] bg-tunnel overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => {
              onClick();
              onClose();
            }}
            onMouseEnter={onHover}
            className="arcade-btn text-xs px-4 py-2"
          >
            [ EXIT ]
          </button>
        </div>
      </div>
      <div className="mt-3 font-pixel text-sludge text-xs md:text-sm text-center">
        [ SPACE / ↑ ] JUMP &nbsp; [ CTRL / ↓ ] DUCK &nbsp; [ ESC ] EXIT
      </div>
    </div>
  );
}
