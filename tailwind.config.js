/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Legacy fallback colors
        tunnel: '#0D0D0D',
        sludge: '#39FF14',
        warning: '#FFE600',
        // Cosmic palette
        cosmic: {
          bg: '#02030a',
          surface: '#0a1029',
          cyan: '#22d3ee',
          violet: '#8b5cf6',
          blue: '#2e5bff',
          'blue-glow': '#6e8cff',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
};
