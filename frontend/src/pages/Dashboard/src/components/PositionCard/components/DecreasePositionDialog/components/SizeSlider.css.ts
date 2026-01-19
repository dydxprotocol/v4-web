import { style } from '@vanilla-extract/css';
import { colors } from '@/styles/colors';

export const sliderHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.75rem',
});

export const sliderLabel = style({
  fontSize: '0.75rem',
  fontWeight: 500,
  color: colors.dustyGrey,
});

export const sliderValue = style({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: colors.liquidLava,
});

export const sliderRoot = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: '20px',
  marginBottom: '0.5rem',
  touchAction: 'none',
  userSelect: 'none',
});

export const sliderTrack = style({
  position: 'relative',
  flexGrow: 1,
  height: '6px',
  backgroundColor: colors.slateGrey,
  borderRadius: '3px',
});

export const sliderRange = style({
  position: 'absolute',
  height: '100%',
  backgroundColor: colors.liquidLava,
  borderRadius: '3px',
});

export const sliderThumb = style({
  display: 'block',
  width: '18px',
  height: '18px',
  backgroundColor: colors.snow,
  borderRadius: '50%',
  cursor: 'pointer',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
  transition: 'transform 0.1s, box-shadow 0.15s',
  ':hover': {
    transform: 'scale(1.1)',
  },
  ':focus': {
    outline: 'none',
    boxShadow: `0 0 0 4px ${colors.liquidLavaAlpha[30]}`,
  },
});

export const percentageMarks = style({
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '0.25rem',
});

export const percentageMark = style({
  padding: '0.25rem 0.5rem',
  backgroundColor: 'transparent',
  color: colors.dustyGrey,
  border: `1px solid ${colors.whiteAlpha[10]}`,
  borderRadius: '0.25rem',
  fontSize: '0.625rem',
  cursor: 'pointer',
  transition: 'all 0.15s',
  ':hover': {
    color: colors.snow,
    borderColor: colors.whiteAlpha[20],
    backgroundColor: colors.whiteAlpha[5],
  },
  ':active': {
    color: colors.liquidLava,
    borderColor: colors.liquidLava,
  },
});

export const percentageMarkActive = style({
  color: colors.liquidLava,
  borderColor: colors.liquidLava,
  backgroundColor: colors.liquidLavaAlpha[10],
});
