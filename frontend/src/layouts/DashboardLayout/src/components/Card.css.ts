import { style } from '@vanilla-extract/css';
import { colors } from '../../../../styles/colors';

export const card = style({
  padding: '2rem',
  backgroundColor: colors.gluonGrey,
  backdropFilter: 'blur(10px)',
  borderRadius: '1rem',
  border: `1px solid ${colors.whiteAlpha[10]}`,
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
});
