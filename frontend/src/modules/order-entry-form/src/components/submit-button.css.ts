import { style } from '@vanilla-extract/css';

export const button = style({
  width: '100%',
  padding: '12px 16px',
  border: 'none',
  borderRadius: '4px',
  fontSize: '0.875rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
  marginTop: '0.5rem',
  textTransform: 'uppercase',
});

export const disabledButton = style({
  opacity: 0.5,
  cursor: 'not-allowed',
});

export const buyButton = style({
  backgroundColor: '#22c55e',
  color: '#fff',
  ':hover': {
    backgroundColor: '#16a34a',
  },
  ':active': {
    backgroundColor: '#15803d',
  },
});

export const sellButton = style({
  backgroundColor: '#ef4444',
  color: '#fff',
  ':hover': {
    backgroundColor: '#dc2626',
  },
  ':active': {
    backgroundColor: '#b91c1c',
  },
});
