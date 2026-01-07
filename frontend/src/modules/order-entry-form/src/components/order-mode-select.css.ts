import { style } from '@vanilla-extract/css';

export const container = style({
  marginBottom: '0.5rem',
});

export const label = style({
  fontSize: '0.875rem',
  color: '#ccc',
  marginBottom: '4px',
  display: 'block',
});

export const selectTrigger = style({
  width: '100%',
  padding: '8px 12px',
  backgroundColor: '#1a1a1a',
  color: '#fff',
  border: '1px solid #333',
  borderRadius: '4px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  fontSize: '0.875rem',
  transition: 'all 0.2s',
  ':hover': {
    borderColor: '#555',
  },
  ':focus': {
    outline: 'none',
    borderColor: '#666',
  },
});

export const selectIcon = style({
  fontSize: '0.75rem',
  color: '#999',
});

export const selectContent = style({
  backgroundColor: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '4px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
});

export const selectItem = style({
  padding: '8px 12px',
  color: '#fff',
  cursor: 'pointer',
  outline: 'none',
  fontSize: '0.875rem',
  transition: 'background-color 0.15s',
  selectors: {
    '&[data-highlighted]': {
      backgroundColor: '#2a2a2a',
    },
  },
});
