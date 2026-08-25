import { useEffect, useMemo, useRef, useState } from 'react';
import type { Product } from '../types';
import { siteConfig } from '../config/site.config';
import { RunnerGame } from './RunnerGame';

interface CatalogProps {
  products: Product[];
  active: boolean;
  onSelect: (product: Product) => void;
  onHover: () => void;
  onClick: () => void;
}

const { brand: BRAND, game: GAME_CONFIG } = siteConfig;
const ITEMS_PER_PAGE = 9;
const SWIPE_THRESHOLD = 40;

export function Catalog({ products, active, onSelect, onHover, onClick }: CatalogProps) {
  const [page, setPage] = useState(0);
  const [showGame, setShowGame] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

  const visibleProducts = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return products.slice(start, start + ITEMS_PER_PAGE);
  }, [page, products]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!active || showGame) return;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setPage((p) => Math.min(p + 1, totalPages - 1));
        onClick();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setPage((p) => Math.max(p - 1, 0));
        onClick();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [active, showGame, totalPages, onClick]);

  useEffect(() => {
    const el = document.getElementById('catalog-grid');
    if (!el || !active || showGame) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0 || e.deltaX > 0) {
        setPage((p) => Math.min(p + 1, totalPages - 1));
      } else {
        setPage((p) => Math.max(p - 1, 0));
      }
      onClick();
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [active, totalPages, onClick]);

  const formatPrice = (price: number) =>
    `₽${price.toLocaleString('ru-RU')}`;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      if (delta > 0) {
        setPage((p) => Math.min(p + 1, totalPages - 1));
      } else {
        setPage((p) => Math.max(p - 1, 0));
      }
      onClick();
    }
    touchStartX.current = null;
  };

  return (
    <div
      id="catalog-ui"
      className={`fixed inset-0 z-40 flex items-center justify-center transition-opacity duration-500 ${
        active ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className="catalog-screen relative w-[70vw] md:w-[22vw] aspect-[3/4] min-w-[280px] min-h-[360px] max-w-[420px] flex flex-col p-3 md:p-4 touch-pan-y select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex justify-between items-center mb-1 md:mb-2 border-b-2 border-sludge pb-2">
          <span className="font-pixel text-sludge text-xs md:text-base">
            [ {BRAND} ]
          </span>
          {GAME_CONFIG.enabled && (
            <button
              onClick={() => {
                onClick();
                setShowGame(true);
              }}
              onMouseEnter={onHover}
              className="font-pixel text-warning text-[10px] md:text-sm animate-blink arcade-btn px-2 py-1"
            >
              PLAY A GAME
            </button>
          )}
        </div>

        <div
          id="catalog-grid"
          className="flex-1 grid grid-cols-3 grid-rows-3 gap-1 md:gap-2 overflow-hidden"
        >
          {visibleProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => {
                onClick();
                onSelect(product);
              }}
              onMouseEnter={onHover}
              className="product-card flex flex-col items-center justify-between text-left w-full h-full"
            >
              <div className="flex-1 w-full flex items-center justify-center bg-concrete/30 mb-1 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain mix-blend-lighten"
                  loading="eager"
                />
              </div>
              <div className="w-full text-center">
                <div className="text-[8px] md:text-[10px] leading-none break-words line-clamp-2">{product.name}</div>
                <div className="text-warning text-[9px] md:text-xs mt-1">{formatPrice(product.price)}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mt-2 md:mt-3 pt-2 border-t-2 border-sludge">
          <button
            onClick={() => {
              setPage((p) => Math.max(p - 1, 0));
              onClick();
            }}
            disabled={page === 0}
            className="arcade-btn text-[10px] md:text-xs px-3 py-3 md:py-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            [ &lt; SELECT ]
          </button>
          <span className="font-pixel text-sludge text-[10px] md:text-xs">
            PAGE {page + 1}/{totalPages}
          </span>
          <button
            onClick={() => {
              setPage((p) => Math.min(p + 1, totalPages - 1));
              onClick();
            }}
            disabled={page >= totalPages - 1}
            className="arcade-btn text-[10px] md:text-xs px-3 py-3 md:py-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            [ SELECT &gt; ]
          </button>
        </div>
      </div>

      {showGame && (
        <RunnerGame
          onClose={() => setShowGame(false)}
          onHover={onHover}
          onClick={onClick}
        />
      )}
    </div>
  );
}
