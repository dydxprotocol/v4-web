import { style } from '@vanilla-extract/css';

export const page = style({
  width: '100%',
  height: 'calc(100vh - 4rem)', // Account for header height
  backgroundColor: '#0f172a',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  padding: '1rem',
  '@media': {
    '(max-width: 1024px)': {
      paddingBottom: '1rem',
      overflowY: 'auto',
      overflowX: 'hidden',
    },
  },
});

export const container = style({
  display: 'flex',
  flex: 1,
  gap: '1rem',
  overflow: 'hidden',
  minHeight: 0,
  width: '100%',
  maxWidth: '100%',
  '::-webkit-scrollbar': {
    width: '4px',
    height: '4px',
  },
  '::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '2px',
  },
  '@media': {
    '(max-width: 1024px)': {
      flexDirection: 'column',
      height: 'auto',
      overflowX: 'auto',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
    },
  },
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
  '@media': {
    '(max-width: 1024px)': {
      flex: '0 0 55vh',
      height: '55vh',
      minWidth: '640px',
    },
  },
});

export const rightSection = style({
  flex: '0 0 400px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  overflow: 'hidden',
  '@media': {
    '(max-width: 1024px)': {
      display: 'flex',
      flex: '0 0 auto',
      width: '100%',
    },
  },
});

export const orderEntryContainer = style({
  flex: '1 1 60%',
  minHeight: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '0.5rem',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  minWidth: 0,
  '@media': {
    '(max-width: 1024px)': {
      // Ensure width doesn't squish; allow horizontal scroll if needed
      minWidth: '640px',
    },
  },
});

export const orderEntryFormWrapper = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  height: '100%',
  overflow: 'auto',
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

export const orderEntryTitle = style({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#e2e8f0',
  marginBottom: '1rem',
  textTransform: 'none',
  letterSpacing: '0.01em',
});

export const bottomMenu = style({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 40,
  display: 'none',
  backgroundColor: 'rgba(30, 41, 59, 0.95)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  padding: 0,
  paddingBottom: 'env(safe-area-inset-bottom)',
  boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
  '@media': {
    '(max-width: 1024px)': {
      display: 'flex',
      gap: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
  },
});

export const menuButton = style({
  flex: '1 1 50%',
  width: '50%',
  padding: '0.875rem 1rem',
  backgroundColor: 'transparent',
  border: 'none',
  color: 'rgba(226, 232, 240, 0.7)',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.25rem',
  position: 'relative',
  ':hover': {
    color: 'rgba(226, 232, 240, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  ':active': {
    transform: 'scale(0.95)',
  },
  selectors: {
    '&[data-active="true"]': {
      color: '#60a5fa',
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      fontWeight: 600,
    },
  },
});

export const menuSeparator = style({
  width: '1px',
  height: '2rem',
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  flexShrink: 0,
  alignSelf: 'center',
});

export const sheetContentWrapper = style({
  padding: '1rem',
  flex: 1,
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  position: 'relative', // Create positioning context for dropdowns
});

export const sheetMenuSelector = style({
  display: 'flex',
  gap: 0,
  marginBottom: '1rem',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '0.5rem',
  padding: '0.25rem',
});

export const sheetMenuButton = style({
  flex: '1 1 50%',
  width: '50%',
  padding: '0.625rem 1rem',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '0.375rem',
  color: 'rgba(226, 232, 240, 0.7)',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  textAlign: 'center',
  ':hover': {
    color: 'rgba(226, 232, 240, 0.9)',
  },
  ':active': {
    transform: 'scale(0.98)',
  },
  selectors: {
    '&[data-active="true"]': {
      color: '#60a5fa',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      fontWeight: 600,
    },
  },
});
