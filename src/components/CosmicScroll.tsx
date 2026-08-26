import { useEffect, useRef, useState, useCallback } from 'react';
import { CoreSite } from './CoreSite';
import { siteConfig } from '../config/site.config';

const {
  totalFrames: TOTAL_FRAMES,
  scrollHeight: SCROLL_HEIGHT,
  coreLoopVideo,
  phases,
  brand: BRAND,
} = siteConfig;

const BASE_URL = import.meta.env.BASE_URL || '/';

const PHASE_APPROACH_END = phases.approach[1];
const PHASE_UNFOLD_END = phases.unfold[1];

export function CosmicScroll() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const stateRef = useRef({ frame: 0, phase: 'approach' as 'approach' | 'unfold' | 'core' });
  const [loaded, setLoaded] = useState(0);
  const [started, setStarted] = useState(false);
  const [coreActive, setCoreActive] = useState(false);
  const [coreProgress, setCoreProgress] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);

  // Load approach frames
  useEffect(() => {
    let cancelled = false;

    async function loadFrames() {
      const images: HTMLImageElement[] = [];
      let completed = 0;

      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const img = new Image();
        const src = `${BASE_URL}frames/frame_${String(i).padStart(4, '0')}.jpg`;
        img.src = src;
        images.push(img);

        img.onload = () => {
          if (cancelled) return;
          completed++;
          setLoaded(completed);
        };
        img.onerror = () => {
          if (cancelled) return;
          completed++;
          setLoaded(completed);
        };
      }

      imagesRef.current = images;
    }

    loadFrames();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-start once frames are loaded
  useEffect(() => {
    if (loaded >= TOTAL_FRAMES && TOTAL_FRAMES > 0 && !started) {
      setStarted(true);
      requestAnimationFrame(() => setFadeIn(true));
    }
  }, [loaded, started]);

  const renderFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imagesRef.current[Math.round(index)];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    } else {
      ctx.fillStyle = '#03050F';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderFrame(stateRef.current.frame);
  }, [renderFrame]);

  const getPhase = useCallback((progress: number) => {
    if (progress < PHASE_APPROACH_END) return 'approach';
    if (progress < PHASE_UNFOLD_END) return 'unfold';
    return 'core';
  }, []);

  // Scroll-driven frame animation
  useEffect(() => {
    if (!started || imagesRef.current.length === 0) return;

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const container = containerRef.current;
    if (!container) return;

    stateRef.current.frame = 0;
    renderFrame(0);

    let rafId = 0;
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      const phase = getPhase(progress);
      stateRef.current.phase = phase;

      if (phase === 'core') {
        setCoreActive(true);
        const coreLocal = (progress - PHASE_UNFOLD_END) / (1 - PHASE_UNFOLD_END);
        setCoreProgress(coreLocal);
        // Hold last frame on canvas
        stateRef.current.frame = TOTAL_FRAMES - 1;
        renderFrame(TOTAL_FRAMES - 1);
      } else {
        setCoreActive(false);
        const approachEndFrame = Math.floor(PHASE_APPROACH_END * TOTAL_FRAMES);
        const unfoldStartFrame = approachEndFrame;
        const unfoldEndFrame = Math.floor(PHASE_UNFOLD_END * TOTAL_FRAMES);

        let frame: number;
        if (phase === 'approach') {
          frame = Math.min(approachEndFrame, Math.floor(progress * TOTAL_FRAMES));
        } else {
          const local = (progress - PHASE_APPROACH_END) / (PHASE_UNFOLD_END - PHASE_APPROACH_END);
          frame = Math.min(TOTAL_FRAMES - 1, unfoldStartFrame + Math.floor(local * (unfoldEndFrame - unfoldStartFrame)));
        }

        if (frame !== stateRef.current.frame) {
          stateRef.current.frame = frame;
          renderFrame(frame);
        }
      }

      window.dispatchEvent(new CustomEvent('cosmic-frame', { detail: { progress, phase } }));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    rafId = requestAnimationFrame(handleScroll);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [started, resizeCanvas, renderFrame, getPhase]);

  // Manage loop video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (coreActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [coreActive]);

  return (
    <>
      <div ref={containerRef} className="relative w-full" style={{ height: SCROLL_HEIGHT }}>
        <canvas
          ref={canvasRef}
          className={`fixed inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000 ${
            fadeIn ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ background: '#03050F' }}
        />

        {/* Core loop video (phase 3) */}
        <video
          ref={videoRef}
          src={`${BASE_URL}${coreLoopVideo}`}
          loop
          muted
          playsInline
          className={`fixed inset-0 w-full h-full object-cover z-[1] transition-opacity duration-1000 ${
            coreActive ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ background: '#03050F' }}
        />

        {/* Phase 1 & 2 overlay */}
        <div
          className={`fixed inset-0 z-30 flex flex-col justify-between p-6 md:p-12 transition-opacity duration-700 ${
            started && !coreActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-cyan-400/50 flex items-center justify-center bg-cyan-500/10">
              <span className="text-cyan-300 text-lg">✦</span>
            </div>
            <div className="text-2xl md:text-4xl font-bold text-white tracking-tight">
              {BRAND}
            </div>
          </div>

          <div className="w-full max-w-md self-center">
            <div className="h-px w-full bg-white/10 rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-100"
                style={{ width: `${(stateRef.current.frame / (TOTAL_FRAMES - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Core site UI */}
        <CoreSite active={coreActive} progress={coreProgress} />
      </div>
    </>
  );
}
