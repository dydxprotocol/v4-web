import { style } from '@vanilla-extract/css';
import { colors } from '../../../../../../styles/colors';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: colors.gluonGrey,
  border: `1px solid ${colors.whiteAlpha[10]}`,
  borderRadius: '6px',
  padding: '10px 14px',
  gap: '2px',
  transition: 'all 0.2s',
  ':focus-within': {
    backgroundColor: colors.slateGrey,
    borderColor: colors.liquidLava,
  },
  ':hover': {
    borderColor: colors.whiteAlpha[20],
  },
});

export const label = style({
  fontSize: '0.688rem',
  color: colors.dustyGrey,
  marginBottom: '2px',
  fontWeight: '400',
  letterSpacing: '0.01em',
  textTransform: 'capitalize',
});

export const inputWrapper = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '2px',
});

export const input = style({
  flex: 1,
  backgroundColor: 'transparent',
  border: 'none',
  color: colors.snow,
  fontSize: '1rem',
  fontFamily: 'monospace',
  fontWeight: '400',
  outline: 'none',
  padding: 0,
  '::placeholder': {
    color: colors.dustyGreyAlpha[50],
  },
});

export const assetBadge = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '2px 6px',
  backgroundColor: colors.whiteAlpha[5],
  borderRadius: '4px',
  color: colors.snow,
  fontSize: '0.813rem',
  fontWeight: '500',
  whiteSpace: 'nowrap',
});

export const footer = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.688rem',
  color: colors.dustyGrey,
  marginTop: '2px',
});

export const usdValue = style({
  fontFamily: 'monospace',
  fontWeight: '400',
});

export const leverage = style({
  fontFamily: 'monospace',
  fontWeight: '400',
});

export const error = style({
  color: '#ff4444',
  fontSize: '0.75rem',
  marginTop: '0.25rem',
  fontWeight: '400',
});
