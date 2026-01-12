import { style } from '@vanilla-extract/css';
import { colors } from '../../../../styles/colors';

export const positionsContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  flex: '0 0 auto',
  backgroundColor: colors.gluonGrey,
  borderRadius: '0.5rem',
  padding: '0.75rem',
});

export const totalExposure = style({
  fontSize: '0.875rem',
  fontWeight: '600',
  color: colors.snow,
  padding: '0.5rem 0.75rem',
  backgroundColor: colors.liquidLavaAlpha[10],
  borderRadius: '0.375rem',
  border: `1px solid ${colors.liquidLavaAlpha[20]}`,
  marginBottom: '0.5rem',
  flexShrink: 0,
});
