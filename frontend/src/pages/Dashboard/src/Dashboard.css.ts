import { style } from '@vanilla-extract/css';

export const page = style({
  width: '100%',
  height: 'calc(100vh - 4rem)', // Account for header height
  backgroundColor: '#0f172a',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  padding: '1rem',
});

export const container = style({
  display: 'flex',
  flex: 1,
  gap: '1rem',
  overflow: 'hidden',
  minHeight: 0,
  width: '100%',
  maxWidth: '100%',
});

export const chartSection = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '0.5rem',
  padding: '1rem',
  overflow: 'hidden',
  position: 'relative',
});

export const rightSection = style({
  flex: '0 0 400px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  overflow: 'hidden',
});

export const publicSalesContainer = style({
  flex: '1 1 50%',
  minHeight: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '0.5rem',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

export const orderEntryContainer = style({
  flex: '1 1 50%',
  minHeight: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '0.5rem',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
});

export const orderEntryTitle = style({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#e2e8f0',
  marginBottom: '1rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
});
