import { useMemo, useState } from 'react';

import { ASSET_ICON_MAP } from '@/constants/assets';
import { CHAIN_INFO, EVM_DEPOSIT_CHAINS } from '@/constants/chains';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { DepositAddressCard } from '../../DepositAddressCard';
import { DepositNetworkSelect } from '../../DepositNetworkSelect';

const CHAINS = EVM_DEPOSIT_CHAINS.map((chain) => chain.id);

/**
 * Shows the embedded wallet's own EVM address so users can fund it, after which they can
 * deposit from it through the regular DepositForm. The address is the same on every EVM chain;
 * the network select only changes which assets are listed as depositable.
 */
export const WalletAddressDeposit = () => {
  const stringGetter = useStringGetter();
  const { sourceAccount } = useAccounts();
  const [selectedChain, setSelectedChain] = useState(String(CHAINS[0]));

  const gasDenom = CHAIN_INFO[selectedChain]?.gasDenom;

  const supportedAssets = useMemo(() => {
    const gasIcon =
      gasDenom != null ? ASSET_ICON_MAP[gasDenom as keyof typeof ASSET_ICON_MAP] : undefined;

    return [
      ...(gasDenom != null && gasIcon != null ? [{ icon: gasIcon, name: gasDenom }] : []),
      { icon: ASSET_ICON_MAP.USDC, name: 'USDC' },
    ];
  }, [gasDenom]);

  const getAcceptedAssets = (id: string | number) =>
    stringGetter({
      key: STRING_KEYS.ACCEPTED_ASSETS_AND_USDC,
      params: { ASSETS: CHAIN_INFO[id]?.gasDenom },
    });

  return (
    <div tw="flexColumn gap-1">
      <span tw="text-color-text-0 font-small-book">
        {stringGetter({ key: STRING_KEYS.SEND_FUNDS_SUBTITLE })}
      </span>
      <DepositNetworkSelect
        chains={CHAINS}
        selectedChain={selectedChain}
        onSelectChain={setSelectedChain}
        getAcceptedAssets={getAcceptedAssets}
      />
      <DepositAddressCard address={sourceAccount.address} supportedAssets={supportedAssets} />
    </div>
  );
};
