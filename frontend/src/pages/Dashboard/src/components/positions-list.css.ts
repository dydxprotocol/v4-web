import { style } from '@vanilla-extract/css';

export const positionsContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  flex: '0 0 auto',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '0.5rem',
  padding: '0.75rem',
});

export const totalExposure = style({
  fontSize: '0.875rem',
  fontWeight: '600',
  color: '#e2e8f0',
  padding: '0.5rem 0.75rem',
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  borderRadius: '0.375rem',
  border: '1px solid rgba(59, 130, 246, 0.2)',
  marginBottom: '0.5rem',
  flexShrink: 0,
});
