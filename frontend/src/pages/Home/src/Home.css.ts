import { style } from '@vanilla-extract/css';

export const page = style({
  minHeight: '100vh',
  background: 'linear-gradient(to bottom right, #1e293b, #0f172a)',
  padding: '2rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
});

export const container = style({
  maxWidth: '48rem',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
});

export const header = style({
  textAlign: 'center',
  marginBottom: '2rem',
});

export const title = style({
  fontSize: '3rem',
  fontWeight: 'bold',
  color: 'white',
  marginBottom: '1rem',
  background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
});

export const subtitle = style({
  fontSize: '1.25rem',
  color: '#94a3b8',
});

export const statusCard = style({
  padding: '2rem',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  borderRadius: '1rem',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
});

export const statusTitle = style({
  marginBottom: '1rem',
  fontSize: '1.25rem',
  fontWeight: '600',
  color: 'white',
});

export const statusLoading = style({
  color: '#94a3b8',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
});

export const statusError = style({
  color: '#f87171',
  padding: '1rem',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  borderRadius: '0.5rem',
  border: '1px solid rgba(239, 68, 68, 0.2)',
});

export const statusSuccess = style({
  color: '#34d399',
  padding: '1rem',
  backgroundColor: 'rgba(52, 211, 153, 0.1)',
  borderRadius: '0.5rem',
  border: '1px solid rgba(52, 211, 153, 0.2)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
});

export const buttonContainer = style({
  display: 'flex',
  justifyContent: 'center',
  gap: '1rem',
  marginTop: '2rem',
});

export const button = style({
  padding: '0.75rem 2rem',
  backgroundColor: '#3b82f6',
  color: 'white',
  borderRadius: '0.5rem',
  border: 'none',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
  ':hover': {
    backgroundColor: '#2563eb',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(59, 130, 246, 0.5)',
  },
  ':active': {
    transform: 'translateY(0)',
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

export const formGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  marginBottom: '1.5rem',
});

export const label = style({
  fontSize: '0.875rem',
  fontWeight: '500',
  color: '#e2e8f0',
  marginBottom: '0.5rem',
});

export const input = style({
  padding: '0.75rem 1rem',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  color: 'white',
  borderRadius: '0.5rem',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  fontSize: '1rem',
  fontFamily: 'monospace',
  transition: 'all 0.2s',
  ':focus': {
    outline: 'none',
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  },
  '::placeholder': {
    color: '#64748b',
  },
});

export const fetchButton = style({
  padding: '0.75rem 1.5rem',
  backgroundColor: '#8b5cf6',
  color: 'white',
  borderRadius: '0.5rem',
  border: 'none',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.39)',
  ':hover': {
    backgroundColor: '#7c3aed',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(139, 92, 246, 0.5)',
  },
  ':active': {
    transform: 'translateY(0)',
  },
  ':disabled': {
    backgroundColor: '#4b5563',
    cursor: 'not-allowed',
    boxShadow: 'none',
    transform: 'none',
  },
});

export const positionsContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  marginTop: '1.5rem',
});

export const totalCollateral = style({
  fontSize: '1.25rem',
  fontWeight: '600',
  color: '#e2e8f0',
  padding: '1rem',
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  borderRadius: '0.5rem',
  border: '1px solid rgba(59, 130, 246, 0.2)',
  marginBottom: '1rem',
});

export const positionCard = style({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '0.75rem',
  padding: '1.25rem',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'all 0.2s',
  ':hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export const positionHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
});

export const positionSide = style({
  padding: '0.25rem 0.75rem',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  fontWeight: '600',
});

export const longPosition = style({
  backgroundColor: 'rgba(34, 197, 94, 0.2)',
  color: '#22c55e',
});

export const shortPosition = style({
  backgroundColor: 'rgba(239, 68, 68, 0.2)',
  color: '#ef4444',
});

export const positionGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
});

export const positionField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
});

export const fieldLabel = style({
  fontSize: '0.75rem',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
});

export const fieldValue = style({
  fontSize: '1rem',
  color: '#e2e8f0',
  fontWeight: '500',
  fontFamily: 'monospace',
});

export const profitPositive = style({
  color: '#22c55e',
});

export const profitNegative = style({
  color: '#ef4444',
});
