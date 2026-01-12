import { style } from '@vanilla-extract/css';
import { colors } from '../../../../styles/colors';

export const formGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  marginBottom: '1.5rem',
});

export const label = style({
  fontSize: '0.875rem',
  fontWeight: '500',
  color: colors.snow,
  marginBottom: '0.5rem',
});

export const input = style({
  padding: '0.75rem 1rem',
  backgroundColor: colors.gluonGrey,
  color: colors.snow,
  borderRadius: '0.5rem',
  border: `1px solid ${colors.whiteAlpha[10]}`,
  fontSize: '1rem',
  fontFamily: 'monospace',
  transition: 'all 0.2s',
  ':focus': {
    outline: 'none',
    borderColor: colors.liquidLava,
    backgroundColor: colors.slateGrey,
    boxShadow: `0 0 0 3px ${colors.liquidLavaAlpha[10]}`,
  },
  '::placeholder': {
    color: colors.dustyGrey,
  },
});

export const button = style({
  padding: '0.75rem 1.5rem',
  backgroundColor: colors.liquidLava,
  color: colors.snow,
  borderRadius: '0.5rem',
  border: 'none',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: `0 4px 14px 0 ${colors.liquidLavaAlpha[30]}`,
  ':hover': {
    backgroundColor: '#E05D0A', // Slightly darker Liquid Lava
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 20px ${colors.liquidLavaAlpha[30]}`,
  },
  ':active': {
    transform: 'translateY(0)',
  },
  ':disabled': {
    backgroundColor: colors.slateGrey,
    cursor: 'not-allowed',
    boxShadow: 'none',
    transform: 'none',
  },
});
