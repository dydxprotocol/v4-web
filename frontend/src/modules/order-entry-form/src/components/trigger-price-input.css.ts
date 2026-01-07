import { style } from '@vanilla-extract/css';

export const container = style({
  marginBottom: '0.5rem',
});

export const label = style({
  fontSize: '0.875rem',
  color: '#ccc',
  marginBottom: '4px',
  display: 'block',
});

export const inputWrapper = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
});

export const input = style({
  width: '100%',
  padding: '8px 50px 8px 12px',
  backgroundColor: '#1a1a1a',
  color: '#fff',
  border: '1px solid #333',
  borderRadius: '4px',
  fontSize: '0.875rem',
  fontFamily: 'monospace',
  transition: 'all 0.2s',
  ':focus': {
    outline: 'none',
    borderColor: '#666',
  },
  '::placeholder': {
    color: '#666',
  },
});

export const suffix = style({
  position: 'absolute',
  right: '12px',
  color: '#999',
  fontSize: '0.875rem',
  pointerEvents: 'none',
});

export const error = style({
  fontSize: '0.75rem',
  color: '#ef4444',
  marginTop: '4px',
  display: 'block',
});
