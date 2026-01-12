import { style } from '@vanilla-extract/css';
import { colors } from '../../../../../styles/colors';

export const sliderContainer = style({
  marginTop: '0.5rem',
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'visible',
});

export const sliderLabel = style({
  display: 'block',
  marginBottom: '8px',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: colors.snow,
});

export const sliderRoot = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  height: '20px',
  marginBottom: '8px',
  boxSizing: 'border-box',
  overflow: 'visible',
});

export const sliderTrack = style({
  position: 'relative',
  flexGrow: 1,
  height: '4px',
  backgroundColor: colors.slateGrey,
  borderRadius: '2px',
});

export const sliderRange = style({
  position: 'absolute',
  height: '100%',
  backgroundColor: colors.liquidLava,
  borderRadius: '2px',
});

export const sliderThumb = style({
  display: 'block',
  width: '16px',
  height: '16px',
  backgroundColor: colors.snow,
  borderRadius: '50%',
  cursor: 'pointer',
  ':hover': {
    backgroundColor: colors.dustyGrey,
  },
  ':focus': {
    outline: 'none',
    boxShadow: `0 0 0 4px ${colors.liquidLavaAlpha[30]}`,
  },
});

export const percentageMarks = style({
  position: 'relative',
  display: 'block',
  marginTop: '2px',
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  paddingLeft: '0',
  paddingRight: '0',
  overflow: 'visible',
});

export const percentageMark = style({
  position: 'absolute',
  padding: 0,
  backgroundColor: 'transparent',
  color: colors.dustyGrey,
  border: 'none',
  fontSize: '0.625rem',
  cursor: 'pointer',
  transition: 'color 0.15s',
  whiteSpace: 'nowrap',
  transform: 'translateX(-50%)',
  ':hover': {
    color: colors.snow,
  },
  ':active': {
    color: colors.liquidLava,
  },
});

export const percentageMarkFirst = style({
  transform: 'translateX(0) !important',
});

export const percentageMarkLast = style({
  transform: 'translateX(-100%) !important',
});
