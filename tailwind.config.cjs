/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // shadcn 语义色
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // 多邻国配色
        duolingo: {
          green: '#58CC02',
          'green-dark': '#46A302',
          blue: '#1CB0F6',
          'blue-dark': '#0F9ADE',
          red: '#FF4B4B',
          gold: '#FFC800',
          purple: '#CE82FF',
          'gray-dark': '#3C3C3C',
          gray: '#777777',
          'gray-light': '#F4F4F4',
          'gray-bg': '#FFFFFF',
        },
        neon: {
          purple: '#7B5BFF',
          cyan: '#00E5FF',
          pink: '#FF3B6B',
          yellow: '#FFD23F',
          green: '#2EE6A8',
        },
        space: {
          900: '#0B0B1F',
          800: '#141433',
          700: '#1E1E47',
        },
        ink: '#E6E6F0',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        full: '9999px',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        sc: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        display: ['"Orbitron"', '"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0,0,0,0.04)',
        sm: '0 2px 8px rgba(0,0,0,0.06)',
        md: '0 4px 16px rgba(0,0,0,0.08)',
        lg: '0 8px 32px rgba(0,0,0,0.12)',
        pixel: '0 6px 0 0 rgba(0,0,0,0.45)',
        'pixel-sm': '0 3px 0 0 rgba(0,0,0,0.45)',
        neon: '0 0 18px rgba(123,91,255,0.55), 0 0 36px rgba(0,229,255,0.35)',
        'neon-pink': '0 0 18px rgba(255,59,107,0.65), 0 0 36px rgba(255,59,107,0.35)',
        'neon-yellow': '0 0 18px rgba(255,210,63,0.65), 0 0 36px rgba(255,210,63,0.35)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '400ms',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        'spin-slow': 'spin 18s linear infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'pop-in': 'popIn 0.45s cubic-bezier(.34,1.56,.64,1) forwards',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        popIn: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
