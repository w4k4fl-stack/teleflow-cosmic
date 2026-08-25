import { useEffect } from 'react';

const SPLATTERS = [
  '/assets/splatter_green.png',
  '/assets/splatter_magenta.png',
  '/assets/splatter_yellow.png',
];

export function SprayCursor() {
  useEffect(() => {
    // Skip on touch devices
    const isTouch = window.matchMedia('(hover: none)').matches;
    if (isTouch) return;

    const handleMouseDown = (e: MouseEvent) => {
      const count = 3 + Math.floor(Math.random() * 3); // 3–5 particles

      for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'splatter-particle';

        // Random offset around the click point
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 32;
        const x = e.clientX + Math.cos(angle) * distance;
        const y = e.clientY + Math.sin(angle) * distance;

        // Random visual params
        const scale = 0.6 + Math.random() * 1.2;
        const rotStart = Math.random() * 360;
        const rotEnd = rotStart + (Math.random() - 0.5) * 180;
        const texture = SPLATTERS[Math.floor(Math.random() * SPLATTERS.length)];

        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.backgroundImage = `url('${texture}')`;
        particle.style.setProperty('--scale', String(scale));
        particle.style.setProperty('--rot-start', `${rotStart}deg`);
        particle.style.setProperty('--rot-end', `${rotEnd}deg`);
        particle.style.width = `${36 + Math.random() * 32}px`;
        particle.style.height = particle.style.width;

        document.body.appendChild(particle);
        particle.addEventListener('animationend', () => particle.remove(), { once: true });
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  return null;
}
