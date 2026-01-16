import { keyframes, style } from '@vanilla-extract/css';
import { colors } from '@/styles/colors';

const slideIn = keyframes({
  '0%': {
    opacity: 0,
    transform: 'translateX(8px)',
  },
  '100%': {
    opacity: 1,
    transform: 'translateX(0)',
  },
});

const shimmer = keyframes({
  '0%': {
    backgroundPosition: '-200% 0',
  },
  '100%': {
    backgroundPosition: '200% 0',
  },
});

export const collateralContainer = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.5rem 1rem',
  backgroundColor: colors.slateGrey,
  borderRadius: '0.5rem',
  border: `1px solid ${colors.whiteAlpha[10]}`,
  transition: 'background-color 0.15s ease, border-color 0.15s ease',
  width: '160px',
  minWidth: '160px',
  animation: `${slideIn} 0.25s ease-out`,
  cursor: 'default',
  ':hover': {
    backgroundColor: colors.whiteAlpha[10],
    borderColor: colors.whiteAlpha[20],
  },
});

export const collateralContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
  minWidth: 0,
  flex: 1,
});

export const collateralLabel = style({
  fontSize: '0.625rem',
  fontWeight: '600',
  color: colors.dustyGrey,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  lineHeight: 1,
});

export const collateralValue = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: '0.375rem',
  minWidth: 0,
});

export const collateralAmount = style({
  fontSize: '0.9375rem',
  fontWeight: '600',
  color: colors.snow,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.01em',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const collateralSymbol = style({
  fontSize: '0.75rem',
  fontWeight: '500',
  color: colors.dustyGrey,
  flexShrink: 0,
});

// Loading state styles
export const skeleton = style({
  height: '0.9375rem',
  width: '80px',
  borderRadius: '0.25rem',
  background: `linear-gradient(
    90deg,
    ${colors.whiteAlpha[5]} 25%,
    ${colors.whiteAlpha[10]} 50%,
    ${colors.whiteAlpha[5]} 75%
  )`,
  backgroundSize: '200% 100%',
  animation: `${shimmer} 1.5s ease-in-out infinite`,
});

export const skeletonSymbol = style({
  height: '0.75rem',
  width: '32px',
  borderRadius: '0.25rem',
  background: `linear-gradient(
    90deg,
    ${colors.whiteAlpha[5]} 25%,
    ${colors.whiteAlpha[10]} 50%,
    ${colors.whiteAlpha[5]} 75%
  )`,
  backgroundSize: '200% 100%',
  animation: `${shimmer} 1.5s ease-in-out infinite`,
});
