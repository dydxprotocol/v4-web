import { ElementType } from 'react';

import styled from 'styled-components';

import { wallets } from '@/constants/wallets';

import { WalletInfo } from '@/lib/wallet/types';

import { Icon } from './Icon';

export const WalletIcon = ({ wallet, size = '1em' }: { wallet: WalletInfo; size?: string }) => {
  if (wallet.connectorType === 'mipd') {
    return <StyledImage src={wallet.icon} alt={wallet.name} size={size} />;
  }

  return <Icon iconComponent={wallets[wallet.name].icon as ElementType} size={size} />;
};

const StyledImage = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
`;
