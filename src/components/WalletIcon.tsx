import { ElementType } from 'react';

import { wallets } from '@/constants/wallets';

import { DisplayWallet } from '@/lib/wallet/types';

import { Icon } from './Icon';

export const WalletIcon = ({ wallet }: { wallet: DisplayWallet }) => {
  if (wallet.connectorType === 'mipd') {
    return <img src={wallet.icon} alt={wallet.name} tw="h-[1.5em] w-[1.5em]" />;
  }

  return <Icon iconComponent={wallets[wallet.name].icon as ElementType} tw="h-[1.5em] w-[1.5em]" />;
};
