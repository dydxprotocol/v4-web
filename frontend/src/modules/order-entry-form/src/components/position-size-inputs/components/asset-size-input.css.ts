import { style } from '@vanilla-extract/css';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '6px',
  padding: '10px 14px',
  gap: '2px',
  transition: 'all 0.2s',
  ':focus-within': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ':hover': {
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});

export const label = style({
  fontSize: '0.688rem',
  color: 'rgba(255, 255, 255, 0.4)',
  marginBottom: '2px',
  fontWeight: '400',
  letterSpacing: '0.01em',
  textTransform: 'capitalize',
});

export const inputWrapper = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '2px',
});

export const input = style({
  flex: 1,
  backgroundColor: 'transparent',
  border: 'none',
  color: '#fff',
  fontSize: '1rem',
  fontFamily: 'monospace',
  fontWeight: '400',
  outline: 'none',
  padding: 0,
  '::placeholder': {
    color: 'rgba(255, 255, 255, 0.15)',
  },
});

export const assetBadge = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '2px 6px',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  borderRadius: '4px',
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '0.813rem',
  fontWeight: '500',
  whiteSpace: 'nowrap',
});

export const footer = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.688rem',
  color: 'rgba(255, 255, 255, 0.35)',
  marginTop: '2px',
});

export const usdValue = style({
  fontFamily: 'monospace',
  fontWeight: '400',
});

export const leverage = style({
  fontFamily: 'monospace',
  fontWeight: '400',
});
