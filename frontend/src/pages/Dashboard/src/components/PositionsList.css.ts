import { style } from '@vanilla-extract/css';
import { colors } from '../../../../styles/colors';

export const positionsContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  flex: '0 0 auto',
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 0.25rem',
});

export const headerTitle = style({
  fontSize: '0.8125rem',
  fontWeight: '600',
  color: colors.snow,
  letterSpacing: '-0.01em',
});

export const headerStats = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
});

export const statItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
});

export const statLabel = style({
  fontSize: '0.6875rem',
  color: colors.dustyGrey,
});

export const statValue = style({
  fontSize: '0.6875rem',
  fontWeight: '600',
  color: colors.snow,
  fontFamily: 'monospace',
});

export const positionCards = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
});
