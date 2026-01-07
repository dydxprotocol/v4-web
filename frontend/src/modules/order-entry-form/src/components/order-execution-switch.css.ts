import { style } from '@vanilla-extract/css';

export const tabsList = style({
  display: 'flex',
  borderBottom: '1px solid #333',
  marginBottom: '0.5rem',
});

export const tabsTrigger = style({
  flex: 1,
  padding: '12px 16px',
  backgroundColor: 'transparent',
  color: '#999',
  border: 'none',
  borderBottom: '2px solid transparent',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: '600',
  transition: 'all 0.2s',
  ':hover': {
    color: '#ccc',
  },
  selectors: {
    '&[data-state="active"]': {
      color: '#fff',
      borderBottomColor: '#fff',
    },
  },
});
