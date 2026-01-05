import { style } from '@vanilla-extract/css';

export const sliderContainer = style({
  marginTop: '12px',
});

export const sliderRoot = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: '20px',
  marginBottom: '8px',
});

export const sliderTrack = style({
  position: 'relative',
  flexGrow: 1,
  height: '4px',
  backgroundColor: '#333',
  borderRadius: '2px',
});

export const sliderRange = style({
  position: 'absolute',
  height: '100%',
  backgroundColor: '#8b5cf6',
  borderRadius: '2px',
});

export const sliderThumb = style({
  display: 'block',
  width: '16px',
  height: '16px',
  backgroundColor: '#fff',
  borderRadius: '50%',
  cursor: 'pointer',
  ':hover': {
    backgroundColor: '#e0e0e0',
  },
  ':focus': {
    outline: 'none',
    boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.3)',
  },
});

export const percentageMarks = style({
  position: 'relative',
  display: 'flex',
  marginTop: '2px',
  paddingLeft: '8px',
  paddingRight: '8px',
});

export const percentageMark = style({
  position: 'absolute',
  padding: 0,
  backgroundColor: 'transparent',
  color: '#666',
  border: 'none',
  fontSize: '0.625rem',
  cursor: 'pointer',
  transition: 'color 0.15s',
  transform: 'translateX(-50%)',
  ':hover': {
    color: '#999',
  },
  ':active': {
    color: '#ccc',
  },
});
