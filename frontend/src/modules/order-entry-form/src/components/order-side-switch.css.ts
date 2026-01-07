import { style } from '@vanilla-extract/css';

export const tabsList = style({
  display: 'flex',
  gap: '8px',
  marginBottom: '0.5rem',
});

export const tabsTrigger = style({
  flex: 1,
  padding: '12px 16px',
  backgroundColor: 'transparent',
  color: '#999',
  border: '1px solid #333',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: '600',
  transition: 'all 0.2s',
  ':hover': {
    borderColor: '#555',
  },
  selectors: {
    '&[data-state="active"][data-side="buy"]': {
      backgroundColor: '#22c55e',
      color: '#fff',
      borderColor: '#22c55e',
    },
    '&[data-state="active"][data-side="sell"]': {
      backgroundColor: '#ef4444',
      color: '#fff',
      borderColor: '#ef4444',
    },
  },
});
