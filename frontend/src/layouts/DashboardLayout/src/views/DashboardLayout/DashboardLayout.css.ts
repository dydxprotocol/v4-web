import { style } from '@vanilla-extract/css';
import { colors } from '../../../../../styles/colors';

export const page = style({
  minHeight: '100vh',
  background: colors.darkVoid,
  display: 'flex',
  flexDirection: 'column',
});

export const header = style({
  backgroundColor: colors.gluonGrey,
  borderBottom: `1px solid ${colors.slateGrey}`,
  padding: '0 2rem',
  height: '4rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'sticky',
  top: 0,
  zIndex: 100,
});

export const headerLeft = style({
  display: 'flex',
  alignItems: 'center',
  gap: '2rem',
});

export const logo = style({
  height: '2rem',
  width: 'auto',
  objectFit: 'contain',
  display: 'block',
});

export const nav = style({
  display: 'flex',
  gap: '0.25rem',
});

export const navLink = style({
  color: colors.dustyGrey,
  fontSize: '0.875rem',
  fontWeight: '500',
  padding: '0.5rem 1rem',
  borderRadius: '0.375rem',
  textDecoration: 'none',
  transition: 'all 0.15s',
  ':hover': {
    color: colors.snow,
    backgroundColor: colors.slateGrey,
  },
});

export const navLinkActive = style({
  color: colors.snow,
  backgroundColor: colors.slateGrey,
});

export const headerRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
});

export const networkSection = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
});

export const networkLabel = style({
  fontSize: '0.75rem',
  color: colors.dustyGrey,
  textTransform: 'uppercase',
  fontWeight: '600',
  letterSpacing: '0.05em',
});

export const networkSelector = style({
  display: 'flex',
  gap: '0.5rem',
  backgroundColor: colors.slateGrey,
  padding: '0.25rem',
  borderRadius: '0.375rem',
});

export const buttonActive = style({
  backgroundColor: colors.liquidLava,
  color: colors.snow,
  minWidth: '6rem',
  ':hover': {
    backgroundColor: '#E05D0A', // Slightly darker Liquid Lava
  },
});

export const buttonSecondary = style({
  padding: '0.75rem 2rem',
  backgroundColor: 'transparent',
  color: colors.snow,
  borderRadius: '0.5rem',
  border: `1px solid ${colors.whiteAlpha[20]}`,
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
  ':hover': {
    backgroundColor: colors.whiteAlpha[10],
    borderColor: colors.whiteAlpha[30],
  },
});

export const walletButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '2.5rem',
  padding: '0 1.25rem',
  backgroundColor: colors.liquidLava,
  color: colors.snow,
  borderRadius: '0.5rem',
  border: 'none',
  fontSize: '0.875rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.15s',
  whiteSpace: 'nowrap',
  ':hover': {
    backgroundColor: '#E05D0A', // Slightly darker Liquid Lava
  },
});

export const walletConnected = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '2.5rem',
  padding: '0 1.25rem',
  backgroundColor: colors.liquidLava,
  color: colors.snow,
  borderRadius: '0.5rem',
  border: `1px solid ${colors.liquidLava}`,
  fontSize: '0.875rem',
  fontWeight: '600',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  position: 'relative',
  boxShadow: `0 0 0 2px ${colors.liquidLavaAlpha[20]}`,
  ':hover': {
    backgroundColor: '#E05D0A', // Slightly darker Liquid Lava
    borderColor: '#E05D0A',
  },
});

export const container = style({
  flex: 1,
  width: '100%',
  maxWidth: '100%',
  margin: 0,
  padding: 0,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
});

export const statusTitle = style({
  marginBottom: '1rem',
  fontSize: '1.25rem',
  fontWeight: '600',
  color: colors.snow,
});
