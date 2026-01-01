import { style } from '@vanilla-extract/css';

export const header = style({
  textAlign: 'center',
  marginBottom: '2rem',
});

export const title = style({
  fontSize: '3rem',
  fontWeight: 'bold',
  color: 'white',
  marginBottom: '1rem',
  background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
});

export const subtitle = style({
  fontSize: '1.25rem',
  color: '#94a3b8',
});
