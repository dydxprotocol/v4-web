import { style } from '@vanilla-extract/css';
import { colors } from '@/styles/colors';

export const container = style({
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
});

export const assetSection = style({
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
});

export const separator = style({
  width: '1px',
  height: '1.5rem',
  backgroundColor: colors.slateGrey,
});

export const statsSection = style({
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
});
