import { style } from '@vanilla-extract/css';

export const container = style({
  padding: '16px 0',
  borderTop: '1px solid #333',
  marginTop: '16px',
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
  fontSize: '1.25rem',
  color: '#fff',
  fontWeight: '600',
});

export const fees = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '12px',
  marginBottom: '8px',
});

export const feesLabel = style({
  fontSize: '0.875rem',
  color: '#999',
});

export const feesLink = style({
  fontSize: '0.75rem',
  color: '#8b5cf6',
  cursor: 'pointer',
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
  ':hover': {
    textDecoration: 'underline',
  },
});

export const separator = style({
  fontSize: '0.75rem',
  color: '#666',
});
