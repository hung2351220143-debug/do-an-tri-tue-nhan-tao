/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        eco: {
          green:  '#4CAF50',
          blue:   '#2196F3',
          red:    '#F44336',
          yellow: '#FFC107',
          purple: '#9C27B0',
          cyan:   '#00BCD4',
          teal:   '#009688',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'sky-sm':  '0 2px 8px rgba(14,165,233,0.2)',
        'sky-md':  '0 4px 20px rgba(14,165,233,0.3)',
        'sky-lg':  '0 8px 40px rgba(14,165,233,0.4)',
        'sky-xl':  '0 16px 60px rgba(14,165,233,0.5)',
        'glass':   '0 8px 32px rgba(0,0,0,0.1)',
        'lift':    '0 20px 60px rgba(0,0,0,0.15)',
        'card':    '0 1px 6px rgba(0,0,0,0.06), 0 0 0 1px rgba(14,165,233,0.04)',
        'glow':    '0 0 20px rgba(14,165,233,0.4), 0 0 60px rgba(14,165,233,0.2)',
        'inner-sky': 'inset 0 2px 8px rgba(14,165,233,0.15)',
      },
      backgroundImage: {
        'gradient-sky':   'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 50%, #0284c7 100%)',
        'gradient-hero':  'linear-gradient(135deg, #0c4a6e 0%, #075985 40%, #0e7490 100%)',
        'gradient-card':  'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        'gradient-mesh':  'radial-gradient(at 40% 20%, #0ea5e9 0px, transparent 50%), radial-gradient(at 80% 0%, #38bdf8 0px, transparent 50%)',
        'shine':          'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
      },
      animation: {
        'float':           'floatUp 3s ease-in-out infinite',
        'shimmer':         'shimmer 2s linear infinite',
        'gradient-shift':  'gradientShift 4s ease infinite',
        'morph-blob':      'morphBlob 8s ease-in-out infinite',
        'pulse-glow':      'pulseGlow 2s ease-in-out infinite',
        'text-shimmer':    'textShimmer 3s linear infinite',
        'fade-in-up':      'fadeInUp 0.5s ease-out',
        'scale-in':        'scaleIn 0.35s ease-out',
        'rotate-in':       'rotateIn 0.4s ease-out',
        'count-up':        'countUp 0.6s ease-out',
        'bounce-dot':      'bounce 1.4s infinite ease-in-out',
        'slide-left':      'slideInLeft 0.5s ease-out',
        'slide-right':     'slideInRight 0.5s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        floatUp: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-14px)' },
        },
        morphBlob: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '25%':      { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
          '50%':      { borderRadius: '50% 60% 30% 60% / 40% 50% 60% 50%' },
          '75%':      { borderRadius: '60% 40% 60% 40% / 70% 30% 50% 60%' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(14,165,233,0.5)' },
          '50%':      { boxShadow: '0 0 0 14px rgba(14,165,233,0)' },
        },
        textShimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.88)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        rotateIn: {
          from: { opacity: '0', transform: 'rotate(-10deg) scale(0.9)' },
          to:   { opacity: '1', transform: 'rotate(0) scale(1)' },
        },
        countUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-30px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(30px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
