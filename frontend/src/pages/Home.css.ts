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
  maxWidth: '48rem',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
});

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

export const statusCard = style({
  padding: '2rem',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  borderRadius: '1rem',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
});

export const statusTitle = style({
  marginBottom: '1rem',
  fontSize: '1.25rem',
  fontWeight: '600',
  color: 'white',
});

export const statusLoading = style({
  color: '#94a3b8',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
});

export const statusError = style({
  color: '#f87171',
  padding: '1rem',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  borderRadius: '0.5rem',
  border: '1px solid rgba(239, 68, 68, 0.2)',
});

export const statusSuccess = style({
  color: '#34d399',
  padding: '1rem',
  backgroundColor: 'rgba(52, 211, 153, 0.1)',
  borderRadius: '0.5rem',
  border: '1px solid rgba(52, 211, 153, 0.2)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
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
