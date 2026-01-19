import { style } from '@vanilla-extract/css';
import { colors } from '@/styles/colors';

export const dialogContent = style({
  backgroundColor: colors.gluonGrey,
  borderRadius: '0.75rem',
  padding: '1.5rem',
  border: `1px solid ${colors.whiteAlpha[10]}`,
  maxWidth: '420px',
  width: '100%',
});

export const dialogTitle = style({
  fontSize: '1.125rem',
  fontWeight: 600,
  color: colors.snow,
  marginBottom: '0.5rem',
});

export const inputSection = style({
  marginBottom: '1.5rem',
});

export const sliderSection = style({
  marginBottom: '1.5rem',
});

export const summarySection = style({
  padding: '0.75rem',
  backgroundColor: colors.slateGrey,
  borderRadius: '0.5rem',
  marginBottom: '1.5rem',
});
