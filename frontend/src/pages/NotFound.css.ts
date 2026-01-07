import { style } from '@vanilla-extract/css';

export const page = style({
  width: '100%',
  height: '100vh',
  backgroundColor: '#0f172a',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
});

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1.5rem',
  maxWidth: '600px',
  textAlign: 'center',
});

export const errorCode = style({
  fontSize: '8rem',
  fontWeight: 'bold',
  color: '#60a5fa',
  lineHeight: 1,
  textShadow: '0 0 40px rgba(96, 165, 250, 0.3)',
});

export const title = style({
  fontSize: '2rem',
  fontWeight: '600',
  color: '#e2e8f0',
  marginTop: '1rem',
});

export const text = style({
  fontSize: '1.125rem',
  color: '#94a3b8',
  lineHeight: 1.6,
});

export const homeLink = style({
  marginTop: '2rem',
  padding: '0.75rem 2rem',
  backgroundColor: 'rgba(59, 130, 246, 0.2)',
  border: '1px solid rgba(59, 130, 246, 0.4)',
  borderRadius: '0.5rem',
  color: '#60a5fa',
  fontSize: '1rem',
  fontWeight: '500',
  textDecoration: 'none',
  transition: 'all 0.2s',
  ':hover': {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderColor: 'rgba(59, 130, 246, 0.6)',
    transform: 'translateY(-2px)',
  },
});

export const ghost = style({
  fontSize: '6rem',
  opacity: 0.3,
  marginBottom: '1rem',
});
