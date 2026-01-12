import { style } from '@vanilla-extract/css';
import { colors } from '../../../../styles/colors';

export const button = style({
  width: '100%',
  padding: '12px 16px',
  border: 'none',
  borderRadius: '4px',
  fontSize: '0.875rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
  marginTop: '0.5rem',
  textTransform: 'capitalize',
  letterSpacing: '0.01em',
});

export const disabledButton = style({
  opacity: 0.5,
  cursor: 'not-allowed',
});

export const buyButton = style({
  backgroundColor: colors.liquidLava,
  color: colors.snow,
  ':hover': {
    backgroundColor: '#E05D0A', // Slightly darker Liquid Lava
  },
  ':active': {
    backgroundColor: '#CC5209', // Even darker for active state
  },
});

export const sellButton = style({
  backgroundColor: colors.liquidLava,
  color: colors.snow,
  ':hover': {
    backgroundColor: '#E05D0A', // Slightly darker Liquid Lava
  },
  ':active': {
    backgroundColor: '#CC5209', // Even darker for active state
  },
});
