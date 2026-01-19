import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { colors } from '@/styles/colors';

export const selectTrigger = recipe({
  base: {
    all: 'unset',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.625rem',
    backgroundColor: colors.gluonGrey,
    color: colors.snow,
    padding: '0.5rem 0.75rem',
    paddingRight: '0.625rem',
    minHeight: '2.75rem',
    lineHeight: 1,
    borderRadius: '0.5rem',
    border: `1px solid ${colors.slateGrey}`,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontWeight: 500,
    fontSize: '0.9375rem',
    ':hover': {
      borderColor: colors.dustyGrey,
      backgroundColor: colors.slateGrey,
    },
    ':focus': {
      borderColor: colors.liquidLava,
      outline: 'none',
    },
    selectors: {
      '&[data-placeholder]': { color: colors.dustyGrey },
      '&[data-state="open"]': {
        borderColor: colors.liquidLava,
      },
    },
  },
  variants: {
    active: {
      true: {
        backgroundColor: colors.liquidLava,
        borderColor: colors.liquidLava,
      },
    },
  },
});

export const triggerContent = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
});

export const triggerIcon = style({
  color: colors.dustyGrey,
  transition: 'transform 0.2s ease',
  selectors: {
    '[data-state="open"] &': {
      transform: 'rotate(180deg)',
    },
  },
});

export const selectContent = style({
  backgroundColor: colors.gluonGrey,
  border: `1px solid ${colors.slateGrey}`,
  borderRadius: '0.625rem',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  maxHeight: 'var(--radix-select-content-available-height)',
  minWidth: '200px',
  overflow: 'hidden',
  padding: '0.5rem',
  zIndex: 50,
});

export const selectItem = recipe({
  base: {
    all: 'unset',
    fontSize: '0.9375rem',
    fontWeight: 500,
    lineHeight: 1,
    color: colors.dustyGrey,
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    height: '3rem',
    padding: '0 0.75rem',
    paddingRight: '2.25rem',
    position: 'relative',
    cursor: 'pointer',
    userSelect: 'none',
    outline: 'none',
    transition: 'all 0.15s ease',
    ':hover': {
      backgroundColor: colors.slateGrey,
      color: colors.snow,
    },
    ':focus': {
      backgroundColor: colors.slateGrey,
      color: colors.snow,
    },
    selectors: {
      '&[data-highlighted]': {
        backgroundColor: colors.slateGrey,
        color: colors.snow,
      },
      '&[data-state="checked"]': {
        color: colors.snow,
      },
      '[data-disabled] &': {
        color: colors.dustyGrey,
        cursor: 'not-allowed',
        opacity: 0.5,
      },
    },
  },
});

export const selectItemIndicator = style({
  position: 'absolute',
  right: '0.75rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: colors.liquidLava,
});

export const assetIconWrapper = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2rem',
  height: '2rem',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  flexShrink: 0,
  overflow: 'hidden',
});

export const assetIcon = style({
  width: '1.25rem',
  height: '1.25rem',
  objectFit: 'contain',
});

export const statusTitle = style({
  marginBottom: '1rem',
  fontSize: '1.25rem',
  fontWeight: '600',
  color: colors.snow,
});
