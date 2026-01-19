import { style } from '@vanilla-extract/css';
import { colors } from '@/styles/colors';

export const buttonGroup = style({
  display: 'flex',
  gap: '0.75rem',
});

export const decreaseButton = style({
  flex: 1,
  padding: '0.75rem 1rem',
  backgroundColor: colors.liquidLava,
  color: colors.snow,
  border: 'none',
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
  ':hover': {
    backgroundColor: '#e06510',
  },
  ':disabled': {
    backgroundColor: colors.slateGrey,
    color: colors.dustyGrey,
    cursor: 'not-allowed',
  },
});

export const cancelButton = style({
  flex: 1,
  padding: '0.75rem 1rem',
  backgroundColor: 'transparent',
  color: colors.dustyGrey,
  border: `1px solid ${colors.whiteAlpha[20]}`,
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s',
  ':hover': {
    color: colors.snow,
    borderColor: colors.whiteAlpha[30],
    backgroundColor: colors.whiteAlpha[5],
  },
});
