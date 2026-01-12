import { style } from '@vanilla-extract/css';
import { colors } from '../../../../styles/colors';

export const dashboardButton = style({
  padding: '0.375rem 0.875rem',
  backgroundColor: 'transparent',
  color: colors.dustyGrey,
  borderRadius: '0.25rem',
  border: 'none',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.15s',
  minWidth: '6rem',
  ':hover': {
    color: colors.snow,
    backgroundColor: colors.slateGrey,
  },
});
