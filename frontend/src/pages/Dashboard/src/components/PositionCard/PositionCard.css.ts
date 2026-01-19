import { style } from '@vanilla-extract/css';
import { colors } from '@/styles/colors';

export const positionGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '0.5rem',
  rowGap: '0.375rem',
});

export const positionCard = style({
  backgroundColor: colors.gluonGrey,
  borderRadius: '0.5rem',
  padding: '0.625rem',
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
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.5rem',
  paddingBottom: '0.5rem',
  borderBottom: `1px solid ${colors.whiteAlpha[10]}`,
});

export const positionSide = style({
  padding: '0.125rem 0.5rem',
  borderRadius: '0.25rem',
  fontSize: '0.6875rem',
  fontWeight: '600',
  letterSpacing: '0.025em',
});

export const longPosition = style({
  backgroundColor: 'rgba(34, 197, 94, 0.2)',
  color: colors.success,
});

export const shortPosition = style({
  backgroundColor: 'rgba(239, 68, 68, 0.2)',
  color: colors.error,
});

export const fieldValue = style({
  fontSize: '0.6875rem',
  color: colors.snow,
  fontWeight: '500',
  fontFamily: 'monospace',
});

export const iconButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.75rem',
  height: '1.75rem',
  padding: 0,
  border: `1px solid ${colors.whiteAlpha[20]}`,
  borderRadius: '0.375rem',
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
