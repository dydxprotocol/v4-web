import { ElementType } from 'react';

import styled from 'styled-components';

import { ConnectorType, WalletInfo, wallets } from '@/constants/wallets';

import { Icon } from './Icon';

export const WalletIcon = ({ wallet, size = '1em' }: { wallet: WalletInfo; size?: string }) => {
  if (wallet.connectorType === ConnectorType.Injected) {
    return <$Image src={wallet.icon} alt={wallet.name} size={size} />;
  }

  return <Icon iconComponent={wallets[wallet.name].icon as ElementType} size={size} />;
};

const $Image = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
`;
