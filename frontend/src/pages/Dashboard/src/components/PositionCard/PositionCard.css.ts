import { style } from '@vanilla-extract/css';
import { colors } from '@/styles/colors';

export const positionCard = style({
  backgroundColor: colors.gluonGrey,
  borderRadius: '0.5rem',
  padding: '0.75rem',
  border: `1px solid ${colors.whiteAlpha[10]}`,
  transition: 'all 0.2s',
  flexShrink: 0,
  ':hover': {
    backgroundColor: colors.slateGrey,
    borderColor: colors.whiteAlpha[20],
  },
});

export const positionHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginBottom: '0.75rem',
});

export const positionSide = style({
  padding: '0.25rem 0.5rem',
  borderRadius: '0.25rem',
  fontSize: '0.625rem',
  fontWeight: '700',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
});

export const longPosition = style({
  backgroundColor: 'rgba(34, 197, 94, 0.15)',
  color: colors.success,
});

export const shortPosition = style({
  backgroundColor: 'rgba(239, 68, 68, 0.15)',
  color: colors.error,
});

export const assetInfo = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: '0.5rem',
  flex: 1,
});

export const assetSymbol = style({
  fontSize: '0.875rem',
  fontWeight: '600',
  color: colors.snow,
  letterSpacing: '-0.01em',
});

export const leverageBadge = style({
  fontSize: '0.625rem',
  fontWeight: '600',
  color: colors.dustyGrey,
  padding: '0.125rem 0.375rem',
  backgroundColor: colors.whiteAlpha[8],
  borderRadius: '0.25rem',
});

export const headerActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginLeft: 'auto',
});

export const pnlContainer = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: '0.25rem',
});

export const pnlDisplay = style({
  fontSize: '0.75rem',
  fontWeight: '600',
  fontFamily: 'monospace',
});

export const pnlPercent = style({
  fontSize: '0.625rem',
  fontWeight: '500',
  fontFamily: 'monospace',
});

export const pnlPositive = style({
  color: colors.success,
});

export const pnlNegative = style({
  color: colors.error,
});

export const iconButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.5rem',
  height: '1.5rem',
  padding: 0,
  border: `1px solid ${colors.whiteAlpha[15]}`,
  borderRadius: '0.25rem',
  backgroundColor: 'transparent',
  color: colors.dustyGrey,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  ':hover': {
    backgroundColor: colors.whiteAlpha[10],
    borderColor: colors.whiteAlpha[30],
    color: colors.snow,
  },
  ':active': {
    transform: 'scale(0.95)',
  },
});

export const statsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: '0.5rem',
  padding: '0.625rem',
  backgroundColor: colors.whiteAlpha[5],
  borderRadius: '0.375rem',
});

export const statCell = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
});

export const statLabel = style({
  fontSize: '0.5625rem',
  color: colors.dustyGrey,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  lineHeight: 1,
});

export const statValue = style({
  fontSize: '0.75rem',
  color: colors.snow,
  fontWeight: '500',
  fontFamily: 'monospace',
  lineHeight: 1.2,
});

export const statValueMuted = style({
  color: colors.dustyGrey,
});

export const statValuePositive = style({
  color: colors.success,
});

export const statValueNegative = style({
  color: colors.error,
});

export const priceRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.5rem',
  padding: '0.375rem 0.5rem',
  backgroundColor: colors.whiteAlpha[5],
  borderRadius: '0.25rem',
});

export const priceLabel = style({
  fontSize: '0.5625rem',
  color: colors.dustyGrey,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
});

export const priceValue = style({
  fontSize: '0.75rem',
  color: colors.snow,
  fontWeight: '500',
  fontFamily: 'monospace',
});

export const priceValueMuted = style({
  fontSize: '0.75rem',
  color: colors.dustyGrey,
  fontWeight: '500',
  fontFamily: 'monospace',
});

export const priceSeparator = style({
  width: '1px',
  height: '0.75rem',
  backgroundColor: colors.whiteAlpha[15],
  marginLeft: '0.25rem',
  marginRight: '0.25rem',
});
