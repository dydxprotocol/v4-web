import { AlertType } from '@/constants/alerts';
import { CHAIN_INFO } from '@/constants/chains';
import { SOLANA_MAINNET_ID } from '@/constants/solana';

import { useAccounts } from '@/hooks/useAccounts';

import { AlertMessage } from '@/components/AlertMessage';

import { DepositAddressCard } from '../DepositAddressCard';

// TODO: spot localization

export const SpotDepositForm = () => {
  const { solanaAddress } = useAccounts();

  return (
    <div tw="flexColumn gap-1">
      <DepositAddressCard
        address={solanaAddress}
        chainIcon={CHAIN_INFO[SOLANA_MAINNET_ID]?.icon}
        chainName={CHAIN_INFO[SOLANA_MAINNET_ID]?.name}
      />
      <AlertMessage withAccentText type={AlertType.Warning} tw="font-small-medium">
        Only send SOL on Solana. Assets on other networks will be lost.
      </AlertMessage>
    </div>
  );
};
