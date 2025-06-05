// tailwind.config.js
module.exports = {
  mode: 'jit',
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx,html}',
    './components/**/*.{ts,tsx,html}',
    './app/**/*.{ts,tsx,html}',
    './src/**/*.{ts,tsx,html}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['HelveticaNowDisplay', 'sans-serif'],
      },
      scale: {
        102: '1.02',
      },
      colors: {
        border: 'rgb(var(--border))',
        input: 'rgb(var(--input))',
        ring: 'rgb(var(--ring))',
        background: 'rgb(var(--background))',
        foreground: 'rgb(var(--foreground))',
        'chart-1': 'rgb(var(--chart-1))',
        'chart-2': 'rgb(var(--chart-2))',
        'chart-3': 'rgb(var(--chart-3))',
        'chart-4': 'rgb(var(--chart-4))',
        'chart-5': 'rgb(var(--chart-5))',
        primary: {
          DEFAULT: 'rgb(var(--primary))',
          foreground: 'rgb(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary))',
          foreground: 'rgb(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive))',
          foreground: 'rgb(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted))',
          foreground: 'rgb(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent))',
          foreground: 'rgb(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover))',
          foreground: 'rgb(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'rgb(var(--card))',
          foreground: 'rgb(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'rgb(var(--sidebar-background))',
          foreground: 'rgb(var(--sidebar-foreground))',
          primary: 'rgb(var(--sidebar-primary))',
          'primary-foreground': 'rgb(var(--sidebar-primary-foreground))',
          accent: 'rgb(var(--sidebar-accent))',
          'accent-foreground': 'rgb(var(--sidebar-accent-foreground))',
          border: 'rgb(var(--sidebar-border))',
          ring: 'rgb(var(--sidebar-ring))',
        },
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'collapsible-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-collapsible-content-height)' },
        },
        'collapsible-up': {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: '0' },
        },
        'color-burst': {
          '0%': {
            boxShadow: '0 0 8px 2px rgba(var(--color), 0.7)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 0 35px 10px rgba(var(--color), 0.9)',
            transform: 'scale(1.2)',
          },
          '100%': {
            boxShadow: '0 0 8px 2px rgba(var(--color), 0.7)',
            transform: 'scale(1)',
          },
        },
        pulse: {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.70',
          },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'shiny-text': {
          '0%, 90%, 100%': {
            'background-position': 'calc(-100% - var(--shiny-width)) 0',
          },
          '30%, 60%': {
            'background-position': 'calc(100% + var(--shiny-width)) 0',
          },
        },
        'caret-blink': {
          '0%,70%,100%': { opacity: '1' },
          '20%,50%': { opacity: '0' },
        },
        'pulse-shadow': {
          '0%, 12.5%, 37.5%, 100%': {
            boxShadow:
              '0 0 var(--pulse-shadow-start, 8px) rgb(var(--secondary))',
          },
          '25%': {
            boxShadow:
              '0 0 var(--pulse-shadow-end, 24px) rgb(var(--secondary))',
          },
        },
        'border-pulse': {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.2',
          },
        },
      },
      animation: {
        'spin-extra-slow': 'spin 25s linear infinite',
        'fade-in': 'fade-in 0.5s ease-in-out',
        'fade-in-down': 'fade-in-down 0.4s ease-out forwards',
        fadeInUp: 'fadeInUp 0.5s ease-out forwards',
        'collapsible-down': 'collapsible-down 0.2s ease-out',
        'collapsible-up': 'collapsible-up 0.2s ease-out',
        blink: 'blink 1s step-end infinite',
        'shiny-text': 'shiny-text 8s infinite',
        'color-burst': 'color-burst 0.5s ease-in-out',
        pulse: 'pulse 2s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'pulse-fast': 'pulse 1.5s ease-in-out infinite',
        'caret-blink': 'caret-blink 1.25s ease-out infinite',
        'pulse-shadow':
          'pulse-shadow var(--pulse-shadow-duration, 3s) ease-in-out var(--pulse-shadow-delay, 0s) infinite',
        'border-pulse': 'border-pulse 2s ease-in-out infinite',
      },
      '--pulse-shadow-duration': {
        '2s': '2s',
        '3s': '3s',
        '4s': '4s',
        '5s': '5s',
      },
      '--pulse-shadow-delay': {
        0: '0s',
        500: '500ms',
        1000: '1000ms',
        2000: '2000ms',
      },
      '--pulse-shadow-start': {
        4: '4px',
        8: '8px',
        12: '12px',
        16: '16px',
      },
      '--pulse-shadow-end': {
        16: '16px',
        24: '24px',
        32: '32px',
        40: '40px',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
  // this gets all the possible classes to build ahead of time, so we can do dynamic classes
  safelist: [
    {
      pattern:
        /bg-(background|muted|popover|card|border|input|ring|primary|secondary|accent|destructive|chart-1|chart-2|chart-3|chart-4|chart-5)/,
    },
    {
      pattern:
        /text-(foreground|muted-foreground|popover-foreground|card-foreground|border-foreground|input-foreground|ring-foreground|primary-foreground|secondary-foreground|accent-foreground|destructive-foreground|chart-1-foreground|chart-2-foreground|chart-3-foreground|chart-4-foreground|chart-5-foreground)/,
    },
  ],
};
