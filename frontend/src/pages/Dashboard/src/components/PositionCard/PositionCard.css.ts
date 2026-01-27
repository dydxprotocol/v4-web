import { style } from '@vanilla-extract/css';
import { colors } from '@/styles/colors';

export const positionCard = style({
  backgroundColor: colors.gluonGrey,
  borderRadius: '0.5rem',
  padding: '0.75rem',
  border: `1px solid ${colors.whiteAlpha[10]}`,
  transition: 'all 0.2s',
  flexShrink: 0,
  ':hover': {
    backgroundColor: colors.slateGrey,
    borderColor: colors.whiteAlpha[20],
  },
});

export const statsRow = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '0.5rem',
  padding: '0.625rem',
  backgroundColor: colors.whiteAlpha[5],
  borderRadius: '0.375rem',
  marginBottom: '0.5rem',
});
