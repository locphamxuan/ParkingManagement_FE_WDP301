/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
