import { style } from '@vanilla-extract/css';
import { colors } from '../../../../../styles/colors';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  width: '100%',
});

export const connectWalletButton = style({
  marginTop: 15,
  width: '100%',
  backgroundColor: `${colors.liquidLava} !important`,
  color: `${colors.snow} !important`,
  border: 'none !important',
  boxShadow: 'none !important',
  ':hover': {
    backgroundColor: '#E05D0A !important', // Slightly darker Liquid Lava
  },
  ':active': {
    backgroundColor: '#CC5209 !important', // Even darker for active state
  },
});

export const connectWalletMessage = style({
  marginTop: '0.75rem',
  display: 'block',
});
