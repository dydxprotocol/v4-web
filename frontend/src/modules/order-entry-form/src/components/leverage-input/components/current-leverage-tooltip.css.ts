import { style } from '@vanilla-extract/css';

export const tooltipContent = style({
  color: '#fff',
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '0.75rem',
  fontWeight: 700,
  lineHeight: 1,
  userSelect: 'none',
  zIndex: 1000,
});

export const tooltipArrow = style({
  fill: '#1a1a1a',
});
