# TeleFlow Cosmic Scroll

Космический скролл-лендинг для TeleFlow. Сайт состоит из трёх фаз:

1. **Approach** — приближение к сфере в космосе.
2. **Unfold** — сфера раскручивается и раскрывает ядро.
3. **Core** — внутри ядра отображается контент сайта TeleFlow на фоне зацикленного видео потоков данных.

## Структура

- `src/components/CosmicScroll.tsx` — Canvas-скролл и фазовая логика.
- `src/components/CoreSite.tsx` — UI контента внутри ядра.
- `src/components/Preloader.tsx` — прелоадер кадров.
- `src/data/content.json` — контент сайта.
- `src/config/site.config.ts` — настройки бренда и фаз.
- `scripts/build-from-video.js` — нарезка approach видео на кадры и копирование loop видео.

## Быстрый старт

```bash
cd /Users/admin/Desktop/teleflow-cosmic/code
npm install
npm run build:video -- --approach ../assets/approach.mp4 --loop ../assets/core-loop.mp4
npm run build
npm run preview
```

## Деплой

```bash
vercel --prod
```
