import { style } from '@vanilla-extract/css';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

export const title = style({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#e2e8f0',
  marginBottom: '1rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
});

export const tableContainer = style({
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  paddingRight: '0.25rem',
  marginRight: '-0.25rem',
  '::-webkit-scrollbar': {
    width: '4px',
  },
  '::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '2px',
  },
});

export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.875rem',
});

export const headerCell = style({
  padding: '0.5rem 0.75rem',
  textAlign: 'left',
  fontWeight: 500,
  color: '#94a3b8',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
});

export const row = style({
  ':hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

export const cell = style({
  padding: '0.5rem 0.75rem',
  color: '#e2e8f0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
});

export const buyPrice = style({
  color: '#26a69a',
});

export const sellPrice = style({
  color: '#ef5350',
});

