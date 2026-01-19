import { globalStyle } from '@vanilla-extract/css';
import { colors } from './colors';

// Toast container positioning
globalStyle('.Toastify__toast-container', {
  padding: '1rem',
});

// Base toast styling
globalStyle('.Toastify__toast', {
  backgroundColor: colors.gluonGrey,
  backdropFilter: 'blur(10px)',
  borderRadius: '0.75rem',
  border: `1px solid ${colors.whiteAlpha[10]}`,
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  color: colors.snow,
  fontFamily: 'inherit',
  fontSize: '0.875rem',
  padding: '0.75rem 1rem',
});

// Toast body
globalStyle('.Toastify__toast-body', {
  padding: 0,
  margin: 0,
  color: colors.snow,
});

// Progress bar
globalStyle('.Toastify__progress-bar', {
  background: colors.liquidLava,
  height: '3px',
});

// Success toast
globalStyle('.Toastify__toast--success', {
  borderColor: colors.success,
});

globalStyle('.Toastify__toast--success .Toastify__progress-bar', {
  background: colors.success,
});

// Error toast
globalStyle('.Toastify__toast--error', {
  borderColor: colors.error,
});

globalStyle('.Toastify__toast--error .Toastify__progress-bar', {
  background: colors.error,
});

// Info toast
globalStyle('.Toastify__toast--info', {
  borderColor: colors.liquidLava,
});

// Warning toast
globalStyle('.Toastify__toast--warning', {
  borderColor: '#f59e0b',
});

globalStyle('.Toastify__toast--warning .Toastify__progress-bar', {
  background: '#f59e0b',
});

// Close button
globalStyle('.Toastify__close-button', {
  color: colors.dustyGrey,
  opacity: 1,
  alignSelf: 'center',
});

globalStyle('.Toastify__close-button:hover', {
  color: colors.snow,
});

// Toast icon
globalStyle('.Toastify__toast-icon', {
  marginRight: '0.75rem',
});