import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { colors } from '../../../../../../styles/colors';
import { dashboardButton } from '../../../styles/dashboard-button.css';

export const selectTrigger = recipe({
  base: [
    dashboardButton,
    {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.slateGrey,
      color: colors.snow,
      padding: '0.5rem 1rem',
      gap: '0.75rem',
      minHeight: '2.5rem',
      lineHeight: 1,
      borderRadius: '0.375rem',
      position: 'relative',
      selectors: {
        '&[data-placeholder]': { color: colors.dustyGrey },
      },
    },
  ],
  variants: {
    active: {
      true: {
        backgroundColor: colors.liquidLava,
      },
    },
  },
});

export const selectContent = style({
  backgroundColor: colors.gluonGrey,
  border: `1px solid ${colors.slateGrey}`,
  borderRadius: '0.375rem',
  boxShadow: '0 10px 15px -3px rgba(0, 0,0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  maxHeight: 'var(--radix-select-content-available-height)',
  width: 'var(--radix-select-trigger-width)',
  zIndex: 50,
});

export const selectItem = recipe({
  base: {
    all: 'unset',
    fontSize: '0.875rem',
    lineHeight: 1,
    color: colors.dustyGrey,
    borderRadius: '0.375rem',
    display: 'flex',
    alignItems: 'center',
    height: '2.25rem',
    padding: '0 0.75rem',
    position: 'relative',
    cursor: 'pointer',
    userSelect: 'none',
    outline: 'none',
    ':hover': {
      backgroundColor: colors.slateGrey,
      color: colors.snow,
    },
    ':focus': {
      backgroundColor: colors.slateGrey,
      color: colors.snow,
    },
    selectors: {
      '[data-disabled] &': {
        color: colors.dustyGrey,
        cursor: 'not-allowed',
      },
    },
  },
});

export const selectItemIndicator = style({
  position: 'absolute',
  right: '0.5rem',
  color: colors.liquidLava,
  width: '1.25rem',
  height: '1.25rem',
});

export const statusTitle = style({
  marginBottom: '1rem',
  fontSize: '1.25rem',
  fontWeight: '600',
  color: colors.snow,
});
