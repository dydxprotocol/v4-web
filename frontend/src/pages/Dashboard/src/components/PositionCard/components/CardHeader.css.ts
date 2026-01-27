import { style } from '@vanilla-extract/css';
import { colors } from '@/styles/colors';

export const positionHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginBottom: '0.75rem',
});

export const headerActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginLeft: 'auto',
});

export const assetId = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginBottom: '0.75rem',
});

export const side = style({
  padding: '0.25rem 0.5rem',
  borderRadius: '0.25rem',
  fontSize: '0.625rem',
  fontWeight: '700',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
});

export const sideLong = style({
  backgroundColor: 'rgba(34, 197, 94, 0.15)',
  color: colors.success,
});

export const sideShort = style({
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
