import { style } from '@vanilla-extract/css';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  width: '100%',
});

export const connectWalletButton = style({
  marginTop: 15,
  width: '100%',
});

export const connectWalletMessage = style({
  marginTop: '0.75rem',
  display: 'block',
});
