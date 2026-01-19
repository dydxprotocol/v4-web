import { style } from '@vanilla-extract/css';
import { colors } from '@/styles/colors';

export const summaryRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  selectors: {
    '&:not(:last-child)': {
      marginBottom: '0.5rem',
    },
  },
});

export const summaryLabel = style({
  fontSize: '0.75rem',
  color: colors.dustyGrey,
});

export const summaryValue = style({
  fontSize: '0.75rem',
  fontWeight: 500,
  color: colors.snow,
  fontFamily: 'monospace',
});
