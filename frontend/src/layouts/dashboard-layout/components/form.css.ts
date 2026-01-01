import { style } from '@vanilla-extract/css';

export const formGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  marginBottom: '1.5rem',
});

export const label = style({
  fontSize: '0.875rem',
  fontWeight: '500',
  color: '#e2e8f0',
  marginBottom: '0.5rem',
});

export const input = style({
  padding: '0.75rem 1rem',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  color: 'white',
  borderRadius: '0.5rem',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  fontSize: '1rem',
  fontFamily: 'monospace',
  transition: 'all 0.2s',
  ':focus': {
    outline: 'none',
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  },
  '::placeholder': {
    color: '#64748b',
  },
});

export const button = style({
  padding: '0.75rem 1.5rem',
  backgroundColor: '#8b5cf6',
  color: 'white',
  borderRadius: '0.5rem',
  border: 'none',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.39)',
  ':hover': {
    backgroundColor: '#7c3aed',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(139, 92, 246, 0.5)',
  },
  ':active': {
    transform: 'translateY(0)',
  },
  ':disabled': {
    backgroundColor: '#4b5563',
    cursor: 'not-allowed',
    boxShadow: 'none',
    transform: 'none',
  },
});
