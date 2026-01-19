import { style } from '@vanilla-extract/css';
import { colors } from '@/styles/colors';

export const inputLabel = style({
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: colors.dustyGrey,
  marginBottom: '0.5rem',
});

export const inputWrapper = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem',
  backgroundColor: colors.slateGrey,
  borderRadius: '0.5rem',
  border: `1px solid ${colors.whiteAlpha[10]}`,
  transition: 'border-color 0.15s',
  ':focus-within': {
    borderColor: colors.liquidLava,
  },
});

export const input = style({
  flex: 1,
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: '1rem',
  fontWeight: 500,
  color: colors.snow,
  fontFamily: 'monospace',
  '::placeholder': {
    color: colors.dustyGrey,
  },
});

export const inputSuffix = style({
  fontSize: '0.75rem',
  color: colors.dustyGrey,
  fontWeight: 500,
});
