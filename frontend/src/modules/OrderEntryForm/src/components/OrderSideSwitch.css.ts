import { style } from '@vanilla-extract/css';
import { colors } from '../../../../styles/colors';

export const tabsList = style({
  display: 'flex',
  borderBottom: `1px solid ${colors.slateGrey}`,
});

export const tabsTrigger = style({
  flex: 1,
  padding: '12px 16px',
  backgroundColor: 'transparent',
  color: colors.dustyGrey,
  border: 'none',
  borderBottom: '2px solid transparent',
  marginBottom: '-1px',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: '500',
  transition: 'all 0.15s ease',
  ':hover': {
    color: colors.snow,
  },
  selectors: {
    '&[data-state="active"][data-side="long"]': {
      color: colors.success,
      borderBottomColor: colors.success,
      fontWeight: '600',
    },
    '&[data-state="active"][data-side="short"]': {
      color: colors.error,
      borderBottomColor: colors.error,
      fontWeight: '600',
    },
  },
});
