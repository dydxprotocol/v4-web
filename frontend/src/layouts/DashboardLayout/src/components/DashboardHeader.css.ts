import { style } from '@vanilla-extract/css';
import { colors } from '../../../../styles/colors';

export const header = style({
  textAlign: 'center',
  marginBottom: '2rem',
});

export const title = style({
  fontSize: '3rem',
  fontWeight: 'bold',
  color: colors.snow,
  marginBottom: '1rem',
  background: `linear-gradient(to right, ${colors.liquidLava}, #FF8C42)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
});

export const subtitle = style({
  fontSize: '1.25rem',
  color: colors.dustyGrey,
});
