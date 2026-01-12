/**
 * Design System Colors
 * Extracted from design palette
 */

export const colors = {
  // Primary colors
  darkVoid: '#151419', // Main dark background
  liquidLava: '#F56E0F', // Primary accent, buttons

  // Grey scale
  gluonGrey: '#1B1B1E', // Secondary dark backgrounds
  slateGrey: '#262626', // Tertiary dark backgrounds, hover states
  dustyGrey: '#878787', // Muted text, borders, secondary text
  snow: '#FBFBFB', // Primary text, light backgrounds

  // Semantic colors (for buy/sell, etc.)
  // Using Liquid Lava variants for consistency
  success: '#22c55e', // Keep green for long positions
  error: '#ef4444', // Keep red for short positions

  // Opacity variants
  darkVoidAlpha: {
    10: 'rgba(21, 20, 25, 0.1)',
    20: 'rgba(21, 20, 25, 0.2)',
    50: 'rgba(21, 20, 25, 0.5)',
    80: 'rgba(21, 20, 25, 0.8)',
  },
  liquidLavaAlpha: {
    10: 'rgba(245, 110, 15, 0.1)',
    15: 'rgba(245, 110, 15, 0.15)',
    20: 'rgba(245, 110, 15, 0.2)',
    30: 'rgba(245, 110, 15, 0.3)',
  },
  whiteAlpha: {
    5: 'rgba(251, 251, 251, 0.05)',
    8: 'rgba(251, 251, 251, 0.08)',
    10: 'rgba(251, 251, 251, 0.1)',
    15: 'rgba(251, 251, 251, 0.15)',
    20: 'rgba(251, 251, 251, 0.2)',
    30: 'rgba(251, 251, 251, 0.3)',
  },
  dustyGreyAlpha: {
    20: 'rgba(135, 135, 135, 0.2)',
    50: 'rgba(135, 135, 135, 0.5)',
  },
} as const;
