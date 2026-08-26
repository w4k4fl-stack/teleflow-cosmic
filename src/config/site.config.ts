import type { Product } from '../types';

export interface SiteConfig {
  brand: string;
  tagline: string;
  scrollHeight: string;
  totalFrames: number;
  coreLoopVideo: string;
  phases: {
    approach: [number, number];
    unfold: [number, number];
    core: [number, number];
  };
  video: {
    fps: number;
    width: number;
    quality: number;
  };
  products: Product[];
  game: {
    enabled: boolean;
  };
}

export const siteConfig: SiteConfig = {
  brand: 'TeleFlow',
  tagline: 'Цифровые вселенные под ключ',
  scrollHeight: '700vh',
  totalFrames: 151,
  coreLoopVideo: 'core-loop.mp4',
  phases: {
    approach: [0, 0.55],
    unfold: [0.55, 0.82],
    core: [0.82, 1],
  },
  video: {
    fps: 30,
    width: 1280,
    quality: 3,
  },
  products: [],
  game: {
    enabled: false,
  },
};
