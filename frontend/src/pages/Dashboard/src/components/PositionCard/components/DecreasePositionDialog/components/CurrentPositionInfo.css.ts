import { style } from '@vanilla-extract/css';
import { colors } from '@/styles/colors';

export const positionInfo = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem',
  backgroundColor: colors.slateGrey,
  borderRadius: '0.5rem',
  marginBottom: '1.5rem',
});

export const positionInfoLabel = style({
  fontSize: '0.75rem',
  color: colors.dustyGrey,
  marginBottom: '0.25rem',
});

export const positionInfoValue = style({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: colors.snow,
  fontFamily: 'monospace',
});
