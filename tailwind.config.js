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

      'white-faded': 'var(--color-white-faded)',

      'layer-0': 'var(--color-layer-0)',
      'layer-1': 'var(--color-layer-1)',
      'layer-2': 'var(--color-layer-2)',
      'layer-3': 'var(--color-layer-3)',
      'layer-4': 'var(--color-layer-4)',
      'layer-5': 'var(--color-layer-5)',
      'layer-6': 'var(--color-layer-6)',
      'layer-7': 'var(--color-layer-7)',

      border: 'var(--color-border)',
      'border-white': 'var(--color-border-white)',
      'border-red': 'var(--color-border-red)',

      'text-0': 'var(--color-text-0)',
      'text-1': 'var(--color-text-1)',
      'text-2': 'var(--color-text-2)',
      'text-button': 'var(--color-text-button)',

      'gradient-base-0': 'var(--color-gradient-base-0)',
      'gradient-base-1': 'var(--color-gradient-base-1)',

      accent: 'var(--color-accent)',
      'accent-faded': 'var(--color-accent-faded)',
      favorite: 'var(--color-favorite)',

      success: 'var(--color-success)',
      warning: 'var(--color-warning)',
      error: 'var(--color-error)',
      'gradient-success': 'var(--color-gradient-success)',
      'gradient-warning': 'var(--color-gradient-warning)',
      'gradient-error': 'var(--color-gradient-error)',

      positive: 'var(--color-positive)',
      negative: 'var(--color-negative)',
      'positive-dark': 'var(--color-positive-dark)',
      'negative-dark': 'var(--color-negative-dark)',
      'gradient-positive': 'var(--color-gradient-positive)',
      'gradient-negative': 'var(--color-gradient-negative)',

      'risk-low': 'var(--color-risk-low)',
      'risk-medium': 'var(--color-risk-medium)',
      'risk-high': 'var(--color-risk-high)',
    },
    fontFamily: {
      base: 'var(--fontFamily-base)',
      monospace: 'var(--fontFamily-monospace',
    },
    fontSize: {
      tiny: 'var(--fontSize-tiny)',
      mini: 'var(--fontSize-mini)',
      small: 'var(--fontSize-small)',
      base: 'var(--fontSize-base)',
      medium: 'var(--fontSize-medium)',
      large: 'var(--fontSize-large)',
      extra: 'var(--fontSize-extra)',
    },
    fontWeight: {
      regular: 'var(--fontWeight-regular)',
      book: 'var(--fontWeight-book)',
      medium: 'var(--fontWeight-medium)',
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
    extend: {},
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.font-tiny-regular': { font: 'var(--font-tiny-regular)' },
        '.font-tiny-book': { font: 'var(--font-tiny-book)' },
        '.font-tiny-medium': { font: 'var(--font-tiny-medium)' },

        '.font-mini-regular': { font: 'var(--font-mini-regular)' },
        '.font-mini-book': { font: 'var(--font-mini-book)' },
        '.font-mini-medium': { font: 'var(--font-mini-medium)' },

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

        '.font-large-regular': { font: 'var(--font-large-regular)' },
        '.font-large-book': { font: 'var(--font-large-book)' },
        '.font-large-medium': { font: 'var(--font-large-medium)' },

        '.font-extra-regular': { font: 'var(--font-extra-regular)' },
        '.font-extra-book': { font: 'var(--font-extra-book)' },
        '.font-extra-medium': { font: 'var(--font-extra-medium)' },
        '.font-extra-bold': { font: 'var(--font-extra-bold)' },
      });
    }),
  ],
};
