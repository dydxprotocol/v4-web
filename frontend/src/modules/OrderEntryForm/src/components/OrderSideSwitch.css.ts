import { style } from '@vanilla-extract/css';
import { colors } from '../../../../styles/colors';

export const tabsList = style({
  display: 'flex',
  gap: '8px',
  marginBottom: '0.5rem',
});

export const tabsTrigger = style({
  flex: 1,
  padding: '12px 16px',
  backgroundColor: 'transparent',
  color: colors.dustyGrey,
  border: `1px solid ${colors.slateGrey}`,
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: '600',
  transition: 'all 0.2s',
  ':hover': {
    borderColor: colors.whiteAlpha[20],
  },
  selectors: {
    '&[data-state="active"][data-side="long"]': {
      backgroundColor: colors.liquidLava,
      color: colors.snow,
      borderColor: colors.liquidLava,
    },
    '&[data-state="active"][data-side="short"]': {
      backgroundColor: colors.liquidLava,
      color: colors.snow,
      borderColor: colors.liquidLava,
    },
  },
});
