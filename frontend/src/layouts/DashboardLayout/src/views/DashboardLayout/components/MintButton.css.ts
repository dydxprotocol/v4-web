import { style } from '@vanilla-extract/css';
import { colors } from '../../../../../../styles/colors';

export const mintButton = style({
  padding: '0.5rem 1rem',
  backgroundColor: 'transparent',
  color: colors.snow,
  borderRadius: '0.375rem',
  border: `1px solid ${colors.whiteAlpha[20]}`,
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.15s',
  whiteSpace: 'nowrap',
  ':hover': {
    backgroundColor: colors.whiteAlpha[10],
    borderColor: colors.whiteAlpha[30],
  },
  ':disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

export const minting = style({
  borderColor: colors.liquidLava,
  color: colors.liquidLava,
});
