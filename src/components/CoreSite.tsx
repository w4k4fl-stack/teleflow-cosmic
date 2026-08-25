import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import content from '../data/content.json';
import { siteConfig } from '../config/site.config';

gsap.registerPlugin(ScrollTrigger);

interface CoreSiteProps {
  active: boolean;
  progress?: number;
}

const ICONS: Record<string, string> = {
  monitor: '🖥️',
  bot: '🤖',
  database: '🧠',
  link: '🔗',
  megaphone: '📡',
  target: '🎯',
  'check-circle': '✓',
  ruble: '₽',
  zap: '⚡',
  'life-buoy': '🛸',
  smile: '✨',
  compass: '🧭',
  layers: '📊',
  send: '🚀',
};

export function CoreSite({ active, progress = 0 }: CoreSiteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggersRef = useRef<ScrollTrigger[]>([]);

  // Parallax shift driven by scroll progress inside core phase
  const parallaxY = progress * 100;

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const ctx = gsap.context(() => {
      const sections = containerRef.current?.querySelectorAll('.core-section');
      sections?.forEach((section) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'top 40%',
            scrub: 1,
            toggleActions: 'play none none reverse',
          },
        });
        tl.fromTo(
          section,
          { opacity: 0, y: 60, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 1 }
        );
        if (section instanceof HTMLElement) {
          triggersRef.current.push(tl.scrollTrigger as ScrollTrigger);
        }
      });
    }, containerRef);

    return () => {
      triggersRef.current.forEach((st) => st.kill());
      triggersRef.current = [];
      ctx.revert();
    };
  }, [active]);

  const handleCta = () => {
    const tg = content.contact.telegram;
    if (tg) {
      window.open(`https://t.me/${tg.replace('@', '')}`, '_blank');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-40 overflow-y-auto transition-opacity duration-1000 ${
        active ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        background: 'radial-gradient(ellipse at center, rgba(10,15,40,0.85) 0%, rgba(3,5,15,0.95) 100%)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Ambient core glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-transform duration-100"
        style={{
          transform: `translateY(${parallaxY}px)`,
          background: `radial-gradient(circle at 50% 40%, rgba(46,91,255,0.15) 0%, transparent 50%),
                       radial-gradient(circle at 50% 60%, rgba(139,92,246,0.12) 0%, transparent 45%)`,
        }}
      />

      <div className="relative z-10 min-h-[300vh] px-6 py-24 md:px-16">
        {/* Hero */}
        <section className="core-section min-h-screen flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs tracking-widest uppercase mb-8">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            {siteConfig.tagline}
          </div>
          <h1 className="text-4xl md:text-7xl font-bold text-white mb-8 leading-tight tracking-tight">
            {content.hero.title}
          </h1>
          <p className="text-lg md:text-xl text-blue-200/70 max-w-2xl mb-12 leading-relaxed">
            {content.hero.subtitle}
          </p>
          <button
            onClick={handleCta}
            className="group relative px-8 py-4 bg-transparent border border-cyan-400/50 text-cyan-300 font-semibold tracking-wider uppercase rounded hover:bg-cyan-400/10 transition-all"
          >
            <span className="absolute inset-0 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_30px_rgba(34,211,238,0.4)]" />
            {content.hero.cta}
          </button>
        </section>

        {/* Services */}
        <section className="core-section py-24 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-cyan-400 text-xs tracking-widest uppercase">Услуги</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-4">Что мы запускаем</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.services.map((service, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-cyan-400/40 hover:bg-white/10 transition-all group"
              >
                <div className="text-4xl mb-4">{ICONS[service.icon] || '✦'}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{service.title}</h3>
                <p className="text-blue-200/60 text-sm leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why */}
        <section className="core-section py-24 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-violet-400 text-xs tracking-widest uppercase">Преимущества</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-4">Почему TeleFlow</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {content.why.map((item, idx) => (
              <div
                key={idx}
                className="flex gap-5 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
              >
                <div className="text-3xl">{ICONS[item.icon] || '✦'}</div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-blue-200/60 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="core-section py-24 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-cyan-400 text-xs tracking-widest uppercase">Как работаем</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-4">Траектория запуска</h2>
          </div>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-violet-500/50 to-transparent" />
            <div className="space-y-12">
              {content.steps.map((step, idx) => (
                <div key={idx} className="relative flex gap-8 pl-16">
                  <div className="absolute left-6 top-0 w-5 h-5 rounded-full bg-cyan-500 border-4 border-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.6)]" />
                  <div>
                    <div className="text-cyan-400 text-xs tracking-widest uppercase mb-2">
                      Шаг {idx + 1}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-blue-200/60 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="core-section py-24 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-violet-400 text-xs tracking-widest uppercase">Тарифы</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-4">Выбери модуль</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {content.pricing.map((plan, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl border ${
                  idx === 1
                    ? 'border-cyan-400/50 bg-cyan-950/20'
                    : 'border-white/10 bg-white/5'
                } backdrop-blur-sm`}
              >
                <h3 className="text-xl font-semibold text-white mb-2">{plan.title}</h3>
                <div className="text-3xl font-bold text-cyan-300 mb-6">{plan.price}</div>
                <ul className="space-y-3">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-3 text-sm text-blue-200/70">
                      <span className="text-cyan-400 mt-0.5">✦</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Contact / CTA */}
        <section className="core-section py-32 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Готовы к запуску?</h2>
          <p className="text-blue-200/70 mb-10">
            Напишите нам в Telegram — обсудим задачу и бесплатно разберём вашу орбиту.
          </p>
          <button
            onClick={handleCta}
            className="inline-flex items-center gap-3 px-8 py-4 bg-cyan-500/10 border border-cyan-400 text-cyan-300 font-semibold tracking-wider uppercase rounded hover:bg-cyan-400/20 transition-all"
          >
            <span>🚀</span>
            Написать в Telegram
          </button>
          <div className="mt-8 text-sm text-blue-200/40">
            {siteConfig.brand} © {new Date().getFullYear()}
          </div>
        </section>
      </div>
    </div>
  );
}
