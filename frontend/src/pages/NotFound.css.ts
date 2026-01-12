import { style } from '@vanilla-extract/css';
import { colors } from '../styles/colors';

export const page = style({
  width: '100%',
  height: '100vh',
  backgroundColor: colors.darkVoid,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
});

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1.5rem',
  maxWidth: '600px',
  textAlign: 'center',
});

export const errorCode = style({
  fontSize: '8rem',
  fontWeight: 'bold',
  color: colors.liquidLava,
  lineHeight: 1,
  textShadow: `0 0 40px ${colors.liquidLavaAlpha[30]}`,
});

export const title = style({
  fontSize: '2rem',
  fontWeight: '600',
  color: colors.snow,
  marginTop: '1rem',
});

export const text = style({
  fontSize: '1.125rem',
  color: colors.dustyGrey,
  lineHeight: 1.6,
});

export const homeLink = style({
  marginTop: '2rem',
  padding: '0.75rem 2rem',
  backgroundColor: colors.liquidLavaAlpha[20],
  border: `1px solid ${colors.liquidLavaAlpha[30]}`,
  borderRadius: '0.5rem',
  color: colors.liquidLava,
  fontSize: '1rem',
  fontWeight: '500',
  textDecoration: 'none',
  transition: 'all 0.2s',
  ':hover': {
    backgroundColor: colors.liquidLavaAlpha[30],
    borderColor: colors.liquidLava,
    transform: 'translateY(-2px)',
  },
});

export const ghost = style({
  fontSize: '6rem',
  opacity: 0.3,
  marginBottom: '1rem',
});
