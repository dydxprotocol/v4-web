import { style } from '@vanilla-extract/css';

export const dashboardButton = style({
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
