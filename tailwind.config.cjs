/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0e0e4f', // Closer College blue
          50: '#eeeeff',
          100: '#d8d8ff',
          200: '#b1b1ff',
          300: '#8a8aff',
          400: '#6363ff',
          500: '#3c3cff',
          600: '#1515ff',
          700: '#0000ee',
          800: '#0000c4',
          900: '#00009a',
        },
        secondary: {
          DEFAULT: '#8a0200', // Closer College red
          50: '#ffeded',
          100: '#ffd6d6',
          200: '#ffadad',
          300: '#ff8585',
          400: '#ff5c5c',
          500: '#ff3333',
          600: '#ff0a0a',
          700: '#e10000',
          800: '#b70000',
          900: '#8d0000',
        },
        tertiary: {
          DEFAULT: '#4338ca', // Indigo for accents
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        success: {
          DEFAULT: '#10b981', // Green
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        warning: {
          DEFAULT: '#f59e0b', // Amber
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'card': '0 10px 30px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 15px rgba(99, 102, 241, 0.5)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.5)',
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(99, 102, 241, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #0e0e4f 0%, #1a1a6c 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #8a0200 0%, #b30300 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'gradient-light': 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        'mesh-primary': 'radial-gradient(at 100% 0%, rgba(14, 14, 79, 0.1) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(14, 14, 79, 0.1) 0px, transparent 50%)',
        'mesh-secondary': 'radial-gradient(at 100% 0%, rgba(138, 2, 0, 0.1) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(138, 2, 0, 0.1) 0px, transparent 50%)',
        'mesh-dark': 'radial-gradient(at 100% 0%, rgba(30, 41, 59, 0.2) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(15, 23, 42, 0.2) 0px, transparent 50%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 15s ease infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'fade-in-down': 'fadeInDown 0.5s ease-out',
        'fade-in-left': 'fadeInLeft 0.5s ease-out',
        'fade-in-right': 'fadeInRight 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': {transform: 'translateY(0)'},
          '50%': {transform: 'translateY(-20px)'},
        },
        gradient: {
          '0%': {backgroundPosition: '0% 50%'},
          '50%': {backgroundPosition: '100% 50%'},
          '100%': {backgroundPosition: '0% 50%'},
        },
        wiggle: {
          '0%, 100%': {transform: 'rotate(-3deg)'},
          '50%': {transform: 'rotate(3deg)'},
        },
        fadeIn: {
          '0%': {opacity: '0'},
          '100%': {opacity: '1'},
        },
        fadeInUp: {
          '0%': {opacity: '0', transform: 'translateY(20px)'},
          '100%': {opacity: '1', transform: 'translateY(0)'},
        },
        fadeInDown: {
          '0%': {opacity: '0', transform: 'translateY(-20px)'},
          '100%': {opacity: '1', transform: 'translateY(0)'},
        },
        fadeInLeft: {
          '0%': {opacity: '0', transform: 'translateX(-20px)'},
          '100%': {opacity: '1', transform: 'translateX(0)'},
        },
        fadeInRight: {
          '0%': {opacity: '0', transform: 'translateX(20px)'},
          '100%': {opacity: '1', transform: 'translateX(0)'},
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '65ch',
            color: 'var(--tw-prose-body)',
            '[class~="lead"]': {
              color: 'var(--tw-prose-lead)',
            },
            strong: {
              color: 'var(--tw-prose-bold)',
              fontWeight: '600',
            },
            a: {
              color: 'var(--tw-prose-links)',
              textDecoration: 'underline',
              fontWeight: '500',
            },
          },
        },
      },
    },
  },
  plugins: [typography],
}
