import { style } from '@vanilla-extract/css';

export const page = style({
  minHeight: '100vh',
  background: '#0a0e1a',
  display: 'flex',
  flexDirection: 'column',
});

export const header = style({
  backgroundColor: '#111827',
  borderBottom: '1px solid #1f2937',
  padding: '0 2rem',
  height: '4rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'sticky',
  top: 0,
  zIndex: 100,
});

export const headerLeft = style({
  display: 'flex',
  alignItems: 'center',
  gap: '2rem',
});

export const logo = style({
  fontSize: '1.5rem',
  fontWeight: '700',
  color: 'white',
  letterSpacing: '-0.025em',
});

export const nav = style({
  display: 'flex',
  gap: '0.25rem',
});

export const navLink = style({
  color: '#9ca3af',
  fontSize: '0.875rem',
  fontWeight: '500',
  padding: '0.5rem 1rem',
  borderRadius: '0.375rem',
  textDecoration: 'none',
  transition: 'all 0.15s',
  ':hover': {
    color: 'white',
    backgroundColor: '#1f2937',
  },
});

export const navLinkActive = style({
  color: 'white',
  backgroundColor: '#1f2937',
});

export const networkSection = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
});

export const networkLabel = style({
  fontSize: '0.75rem',
  color: '#6b7280',
  textTransform: 'uppercase',
  fontWeight: '600',
  letterSpacing: '0.05em',
});

export const networkSelector = style({
  display: 'flex',
  gap: '0.5rem',
  backgroundColor: '#1f2937',
  padding: '0.25rem',
  borderRadius: '0.375rem',
});

export const button = style({
  padding: '0.375rem 0.875rem',
  backgroundColor: 'transparent',
  color: '#9ca3af',
  borderRadius: '0.25rem',
  border: 'none',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.15s',
  minWidth: '6rem',
  ':hover': {
    color: 'white',
    backgroundColor: '#374151',
  },
});

export const buttonActive = style({
  backgroundColor: '#3b82f6',
  color: 'white',
  minWidth: '6rem',
  ':hover': {
    backgroundColor: '#2563eb',
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

export const container = style({
  flex: 1,
  maxWidth: '90rem',
  width: '100%',
  margin: '0 auto',
  padding: '1.5rem',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
});

export const statusTitle = style({
  marginBottom: '1rem',
  fontSize: '1.25rem',
  fontWeight: '600',
  color: 'white',
});
