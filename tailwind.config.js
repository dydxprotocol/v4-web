/** @type {import('tailwindcss').Config} */
const { BREAKPOINT_REM } = require('./src/constants/page');
const plugin = require('tailwindcss/plugin');

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      mobile: { max: BREAKPOINT_REM.mobile },
      notMobile: { min: BREAKPOINT_REM.mobile },
      tablet: { max: BREAKPOINT_REM.tablet },
      notTablet: { min: BREAKPOINT_REM.tablet },
      desktopSmall: { max: BREAKPOINT_REM.desktopSmall },
      desktopMedium: { min: BREAKPOINT_REM.desktopMedium },
      desktopLarge: { min: BREAKPOINT_REM.desktopLarge },
    },
    colors: {
      white: 'var(--color-white)',
      black: 'var(--color-black)',
      green: 'var(--color-green)',
      red: 'var(--color-red)',
      'red-faded': 'var(--color-red-faded)',
      'green-faded': 'var(--color-green-faded)',
      'white-faded': 'var(--color-white-faded)',

      'color-layer-0': 'var(--color-layer-0)',
      'color-layer-1': 'var(--color-layer-1)',
      'color-layer-2': 'var(--color-layer-2)',
      'color-layer-3': 'var(--color-layer-3)',
      'color-layer-4': 'var(--color-layer-4)',
      'color-layer-5': 'var(--color-layer-5)',
      'color-layer-6': 'var(--color-layer-6)',
      'color-layer-7': 'var(--color-layer-7)',

      'color-border': 'var(--color-border)',
      'color-border-faded': 'var(--color-border-faded)',
      'color-border-white': 'var(--color-border-white)',
      'color-border-red': 'var(--color-border-red)',

      'color-text-0': 'var(--color-text-0)',
      'color-text-1': 'var(--color-text-1)',
      'color-text-2': 'var(--color-text-2)',
      'color-text-button': 'var(--color-text-button)',

      'color-gradient-base-0': 'var(--color-gradient-base-0)',
      'color-gradient-base-1': 'var(--color-gradient-base-1)',

      'color-accent': 'var(--color-accent)',
      'color-accent-faded': 'var(--color-accent-faded)',
      'color-accent-more-faded': 'var(--color-accent-more-faded)',
      'color-favorite': 'var(--color-favorite)',

      'color-success': 'var(--color-success)',
      'color-warning': 'var(--color-warning)',
      'color-error': 'var(--color-error)',
      'color-gradient-success': 'var(--color-gradient-success)',
      'color-gradient-warning': 'var(--color-gradient-warning)',
      'color-gradient-error': 'var(--color-gradient-error)',

      'color-positive': 'var(--color-positive)',
      'color-negative': 'var(--color-negative)',
      'color-positive-dark': 'var(--color-positive-dark)',
      'color-negative-dark': 'var(--color-negative-dark)',
      'color-positive-20': 'var(--color-positive-20)',
      'color-negative-20': 'var(--color-negative-20)',
      'color-positive-50': 'var(--color-positive-50)',
      'color-negative-50': 'var(--color-negative-50)',
      'color-gradient-positive': 'var(--color-gradient-positive)',
      'color-gradient-negative': 'var(--color-gradient-negative)',

      'color-risk-low': 'var(--color-risk-low)',
      'color-risk-medium': 'var(--color-risk-medium)',
      'color-risk-high': 'var(--color-risk-high)',
    },
    fontFamily: {
      base: 'var(--fontFamily-base)',
      monospace: 'var(--fontFamily-monospace)',
    },
    fontSize: {
      tiny: 'var(--fontSize-tiny)',
      mini: 'var(--fontSize-mini)',
      small: 'var(--fontSize-small)',
      base: 'var(--fontSize-base)',
      medium: 'var(--fontSize-medium)',
      large: 'var(--fontSize-large)',
      extra: 'var(--fontSize-extra)',
      'extra-large': 'var(--fontSize-extra-large)',
    },
    fontWeight: {
      regular: 'var(--fontWeight-regular)',
      book: 'var(--fontWeight-book)',
      medium: 'var(--fontWeight-medium)',
      semibold: 'var(--fontWeight-semibold)',
      bold: 'var(--fontWeight-bold)',
    },
    spacing: {
      px: '1px',
      0: '0px',
      0.125: '0.125rem',
      0.25: '0.25rem',
      0.375: '0.375rem',
      0.5: '0.5rem',
      0.625: '0.625rem',
      0.75: '0.75rem',
      0.875: '0.875rem',
      1: '1rem',
      1.25: '1.25rem',
      1.5: '1.5rem',
      1.75: '1.75rem',
      2: '2rem',
      2.25: '2.25rem',
      2.5: '2.5rem',
      2.75: '2.75rem',
      3: '3rem',
      3.5: '3.5rem',
      4: '4rem',
      5: '5rem',
      6: '6rem',
      7: '7rem',
      8: '8rem',
      9: '9rem',
      10: '10rem',
      11: '11rem',
      12: '12rem',
      13: '13rem',
      14: '14rem',
      15: '15rem',
      16: '16rem',
      18: '18rem',
      20: '20rem',
      24: '24rem',
    },
    borderRadius: ({ theme }) => ({
      ...theme('spacing'),
      full: '9999px',
    }),
    extend: {
      animation: {
        shake: 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        shake: {
          '10%, 90%': {
            transform: 'translate3d(-1px, 0, 0)',
          },
          '20%, 80%': {
            transform: 'translate3d(2px, 0, 0)',
          },
          '30%, 50%, 70%': {
            transform: 'translate3d(-4px, 0, 0)',
          },
          '40%, 60%': {
            transform: 'translate3d(4px, 0, 0)',
          },
        },
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities, addComponents }) {
      addUtilities({
        '.font-tiny-regular': { font: 'var(--font-tiny-regular)' },
        '.font-tiny-book': { font: 'var(--font-tiny-book)' },
        '.font-tiny-medium': { font: 'var(--font-tiny-medium)' },
        '.font-tiny-bold': { font: 'var(--font-tiny-bold)' },

        '.font-mini-regular': { font: 'var(--font-mini-regular)' },
        '.font-mini-book': { font: 'var(--font-mini-book)' },
        '.font-mini-medium': { font: 'var(--font-mini-medium)' },
        '.font-mini-bold': { font: 'var(--font-mini-bold)' },

        '.font-small-regular': { font: 'var(--font-small-regular)' },
        '.font-small-book': { font: 'var(--font-small-book)' },
        '.font-small-medium': { font: 'var(--font-small-medium)' },
        '.font-small-bold': { font: 'var(--font-small-bold)' },

        '.font-base-regular': { font: 'var(--font-base-regular)' },
        '.font-base-book': { font: 'var(--font-base-book)' },
        '.font-base-medium': { font: 'var(--font-base-medium)' },
        '.font-base-bold': { font: 'var(--font-base-bold)' },

        '.font-medium-regular': { font: 'var(--font-medium-regular)' },
        '.font-medium-book': { font: 'var(--font-medium-book)' },
        '.font-medium-medium': { font: 'var(--font-medium-medium)' },
        '.font-medium-bold': { font: 'var(--font-medium-bold)' },

        '.font-large-regular': { font: 'var(--font-large-regular)' },
        '.font-large-book': { font: 'var(--font-large-book)' },
        '.font-large-medium': { font: 'var(--font-large-medium)' },
        '.font-large-bold': { font: 'var(--font-large-bold)' },

        '.font-extra-regular': { font: 'var(--font-extra-regular)' },
        '.font-extra-book': { font: 'var(--font-extra-book)' },
        '.font-extra-medium': { font: 'var(--font-extra-medium)' },
        '.font-extra-bold': { font: 'var(--font-extra-bold)' },

        '.font-extra-large-regular': { font: 'var(--font-extra-large-regular)' },
        '.font-extra-large-book': { font: 'var(--font-extra-large-book)' },
        '.font-extra-large-medium': { font: 'var(--font-extra-large-medium)' },
        '.font-extra-large-bold': { font: 'var(--font-extra-large-bold)' },

        '.font-mono': { fontFamily: 'var(--fontFamily-monospace)' },
      });
      addComponents({
        '.row': {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        },
        '.column': {
          display: 'grid',
          gridAutoFlow: 'row',
          gridTemplateColumns: 'minmax(0, 1fr)',
        },
        '.inlineRow': {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5ch',
          minWidth: 'max-content',
        },
        '.spacedRow': {
          display: 'grid',
          gridAutoFlow: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        '.flexColumn': {
          display: 'flex',
          flexDirection: 'column',
          minWidth: '0',
        },
        '.stack ': {
          display: 'grid',
          gridTemplateAreas: `'stack'`,
          '> *, &:before, &:after': {
            gridArea: 'stack',
          },
        },
      });
    }),
  ],
};
