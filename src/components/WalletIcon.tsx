import { ElementType } from 'react';

import styled from 'styled-components';

import { ConnectorType, WalletInfo, wallets } from '@/constants/wallets';

import { Icon, IconName } from './Icon';

const isWalletType = (walletName: string): walletName is keyof typeof wallets => {
  return Object.keys(wallets).includes(walletName);
};

export const WalletIcon = ({ wallet, size = '1em' }: { wallet: WalletInfo; size?: string }) => {
  if (wallet.connectorType === ConnectorType.Injected) {
    return <$Image src={wallet.icon} alt={wallet.name} size={size} />;
  }

  if (isWalletType(wallet.name)) {
    return <Icon iconComponent={wallets[wallet.name].icon as ElementType} size={size} />;
  }

  return <Icon iconName={IconName.Wallet} size={size} />;
};

const $Image = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
`;
