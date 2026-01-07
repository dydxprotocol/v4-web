import { style } from '@vanilla-extract/css';

export const container = style({
  padding: '0.75rem 0',
  borderTop: '1px solid #333',
  marginTop: '0.5rem',
  backgroundColor: 'transparent',
});

export const row = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '4px',
});

export const label = style({
  fontSize: '0.875rem',
  color: '#ccc',
});

export const buyLabel = style({
  color: '#22c55e',
  fontWeight: '600',
});

export const sellLabel = style({
  color: '#ef4444',
  fontWeight: '600',
});

export const value = style({
  fontSize: '1rem',
  color: '#fff',
  fontWeight: '600',
});

export const fees = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '0.5rem',
  marginBottom: '0.25rem',
});

export const feesLabel = style({
  fontSize: '0.75rem',
  color: '#999',
});

export const feesLink = style({
  fontSize: '0.75rem',
  color: '#8b5cf6',
  cursor: 'pointer',
  textTransform: 'none',
  ':hover': {
    textDecoration: 'underline',
  },
});

export const links = style({
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  marginTop: '4px',
});

export const link = style({
  fontSize: '0.75rem',
  color: '#8b5cf6',
  cursor: 'pointer',
  textTransform: 'none',
  ':hover': {
    textDecoration: 'underline',
  },
});

export const separator = style({
  fontSize: '0.75rem',
  color: '#666',
});
