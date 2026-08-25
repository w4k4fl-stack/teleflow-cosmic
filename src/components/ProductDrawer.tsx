import { useState } from 'react';
import type { Product } from '../types';

interface ProductDrawerProps {
  product: Product | null;
  onClose: () => void;
  onAdd: (product: Product, size: string) => void;
  onHover: () => void;
  onClick: () => void;
}

export function ProductDrawer({ product, onClose, onAdd, onHover, onClick }: ProductDrawerProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');

  if (!product) return null;

  const handleAdd = () => {
    if (!selectedSize) return;
    onClick();
    onAdd(product, selectedSize);
    onClose();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 ${
          product ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <aside
        className={`product-drawer fixed top-0 right-0 z-50 h-full w-full max-w-full md:max-w-md bg-tunnel border-l-4 border-sludge shadow-[0_0_40px_rgba(57,255,20,0.4)] flex flex-col p-4 md:p-6 ${
          product ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <button
          onClick={onClose}
          onMouseEnter={onHover}
          className="self-end arcade-btn text-sm mb-4 px-4 py-3 md:py-2"
        >
          [ X ]
        </button>

        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="border-2 border-sludge bg-concrete/20 p-3 md:p-4 mb-4 flex items-center justify-center min-h-[180px] md:min-h-[240px]">
            <img
              src={product.image}
              alt={product.name}
              className="max-w-full max-h-[220px] md:max-h-[280px] object-contain mix-blend-lighten"
            />
          </div>

          <h2 className="font-glitch text-2xl md:text-3xl text-sludge mb-2">{product.name}</h2>
          <div className="font-pixel text-xl md:text-2xl text-warning mb-4">
            ₽{product.price.toLocaleString('ru-RU')}
          </div>

          <div className="font-mono text-sm text-fluorescent/80 mb-6 leading-relaxed">
            {product.description}
          </div>

          <div className="mb-6">
            <div className="font-pixel text-sludge mb-2 text-sm">[ SELECT SIZE ]</div>
            <div className="flex gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    onClick();
                    setSelectedSize(size);
                  }}
                  onMouseEnter={onHover}
                  className={`arcade-btn flex-1 text-sm py-3 md:py-2 ${
                    selectedSize === size ? 'bg-sludge text-tunnel' : ''
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAdd}
            onMouseEnter={onHover}
            disabled={!selectedSize}
            className="arcade-btn w-full text-base md:text-lg py-4 md:py-3 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            [ ADD TO BASKET ]
          </button>

          <div className="mt-4 flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span key={tag} className="font-pixel text-xs text-warning">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
