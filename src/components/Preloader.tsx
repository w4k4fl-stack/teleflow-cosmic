import { useEffect, useState } from 'react';
import { siteConfig } from '../config/site.config';

interface PreloaderProps {
  total: number;
  loaded: number;
  onStart: () => void;
}

const { brand: BRAND } = siteConfig;

export function Preloader({ total, loaded, onStart }: PreloaderProps) {
  const [ready, setReady] = useState(false);
  const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;

  useEffect(() => {
    if (loaded >= total && total > 0) {
      const t = setTimeout(() => setReady(true), 100);
      return () => clearTimeout(t);
    }
  }, [loaded, total]);

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at center, #0a1029 0%, #02030a 100%)',
      }}
    >
      <div className="relative mb-10">
        <div className="absolute inset-0 blur-2xl bg-cyan-500/20 rounded-full" />
        <h1 className="relative text-5xl md:text-7xl font-bold text-white tracking-tight text-center px-4">
          {BRAND}
        </h1>
      </div>

      <div className="text-cyan-300/80 text-sm md:text-base tracking-[0.25em] uppercase mb-6">
        [ Загрузка координат ]
      </div>

      <div className="w-64 md:w-96 h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="text-blue-200/40 text-xs font-mono">
        {String(loaded).padStart(4, '0')} / {String(total).padStart(4, '0')} кадров
      </div>

      {ready && (
        <button
          data-testid="enter-core"
          onClick={onStart}
          className="mt-10 px-8 py-3 border border-cyan-400/50 text-cyan-300 font-semibold tracking-widest uppercase rounded hover:bg-cyan-400/10 transition-all animate-pulse"
          autoFocus
        >
          [ Войти в ядро ]
        </button>
      )}
    </div>
  );
}
