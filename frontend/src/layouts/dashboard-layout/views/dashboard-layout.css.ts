import { style } from '@vanilla-extract/css';

export const page = style({
  minHeight: '100vh',
  background: 'linear-gradient(to bottom right, #1e293b, #0f172a)',
  padding: '2rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
});

export const container = style({
  maxWidth: '80rem',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
});

export const buttonContainer = style({
  display: 'flex',
  justifyContent: 'center',
  gap: '1rem',
  marginTop: '2rem',
});

export const button = style({
  padding: '0.75rem 2rem',
  backgroundColor: '#3b82f6',
  color: 'white',
  borderRadius: '0.5rem',
  border: 'none',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
  ':hover': {
    backgroundColor: '#2563eb',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(59, 130, 246, 0.5)',
  },
  ':active': {
    transform: 'translateY(0)',
  },
});

export const buttonSecondary = style({
  padding: '0.75rem 2rem',
  backgroundColor: 'transparent',
  color: 'white',
  borderRadius: '0.5rem',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
  ':hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export const statusTitle = style({
  marginBottom: '1rem',
  fontSize: '1.25rem',
  fontWeight: '600',
  color: 'white',
});
