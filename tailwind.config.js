/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Intermediate shades used by the operations surfaces. Declaring them
        // here keeps existing utility classes deterministic instead of relying
        // on browser fallbacks for unsupported Tailwind shades.
        slate: {
          350: '#b0bfce',
          450: '#7c8fa6',
          550: '#556a80',
          605: '#485e75',
          650: '#3d4a61',
          850: '#172033',
          855: '#162033',
        },
        blue: {
          105: '#d5e7fe',
          150: '#cde3fe',
          450: '#4f8df5',
          650: '#1d57d8',
          655: '#1b55d2',
          755: '#1f4db3',
        },
        emerald: {
          105: '#d0fae5',
          250: '#a0efcd',
          650: '#07835f',
          655: '#077d5a',
          755: '#075f46',
        },
        indigo: {
          105: '#e0e7ff',
          150: '#d2dafe',
          650: '#4b46c7',
          655: '#4944c1',
          750: '#3730a3',
        },
        purple: {
          650: '#7e22ce',
        },
        red: {
          650: '#c92a2a',
        },
        rose: {
          105: '#ffe2e8',
          250: '#fec5d1',
          550: '#e11d61',
          655: '#bf123f',
        },
        amber: {
          250: '#fde68a',
        },
        sky: {
          650: '#0875b9',
          755: '#075b93',
        },
        border: 'hsl(var(--app-border) / <alpha-value>)',
        input: 'hsl(var(--app-input) / <alpha-value>)',
        ring: 'hsl(var(--app-ring) / <alpha-value>)',
        background: 'hsl(var(--app-background) / <alpha-value>)',
        foreground: 'hsl(var(--app-foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--app-primary) / <alpha-value>)',
          foreground: 'hsl(var(--app-primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--app-secondary) / <alpha-value>)',
          foreground: 'hsl(var(--app-secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--app-muted) / <alpha-value>)',
          foreground: 'hsl(var(--app-muted-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--app-card) / <alpha-value>)',
          foreground: 'hsl(var(--app-card-foreground) / <alpha-value>)',
        },
        // Semantic tokens (globals.css) — dùng thay emerald/amber/rose/sky hardcode.
        success: {
          DEFAULT: 'hsl(var(--app-success) / <alpha-value>)',
          foreground: 'hsl(var(--app-success-foreground) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'hsl(var(--app-warning) / <alpha-value>)',
          foreground: 'hsl(var(--app-warning-foreground) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'hsl(var(--app-danger) / <alpha-value>)',
          foreground: 'hsl(var(--app-danger-foreground) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'hsl(var(--app-info) / <alpha-value>)',
          foreground: 'hsl(var(--app-info-foreground) / <alpha-value>)',
        },
        // Tile tối trong pattern "thẻ sáng + tile tối" (thay bg-slate-950/40).
        tile: {
          DEFAULT: 'hsl(var(--app-tile) / <alpha-value>)',
          foreground: 'hsl(var(--app-tile-foreground) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: '0.85rem',
        md: '0.65rem',
        sm: '0.45rem',
      },
      boxShadow: {
        glass: '0 16px 40px rgba(0, 0, 0, 0.32)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
