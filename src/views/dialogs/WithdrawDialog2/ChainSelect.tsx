import { Dispatch, Fragment, SetStateAction, useMemo } from 'react';

import { CHAIN_INFO } from '@/constants/chains';
import { SOLANA_MAINNET_ID } from '@/constants/solana';
import { WITHDRAWABLE_ASSETS } from '@/constants/tokens';
import { WalletNetworkType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';

import { AssetIcon } from '@/components/AssetIcon';

export const ChainSelect = ({
  disabled,
  onBack,
  selectedChain,
  setSelectedChain,
}: {
  disabled?: boolean;
  onBack: () => void;
  selectedChain: string;
  setSelectedChain: Dispatch<SetStateAction<string>>;
}) => {
  const { sourceAccount } = useAccounts();
  const { chain } = sourceAccount;

  const onChainClick = (newChainId: string) => () => {
    setSelectedChain(newChainId);
    onBack();
  };

  const assets = useMemo(() => {
    return WITHDRAWABLE_ASSETS.filter((asset) => {
      if (asset.chainId === SOLANA_MAINNET_ID) {
        return chain === WalletNetworkType.Solana;
      }

      return true;
    });
  }, [chain]);

  return (
    <div tw="flex flex-col gap-0.5 py-1">
      <div tw="flex flex-col">
        {Object.values(assets).map(({ chainId }) => (
          <Fragment key={chainId}>
            <button
              disabled={disabled}
              onClick={onChainClick(chainId)}
              type="button"
              style={{
                backgroundColor: chainId === selectedChain ? 'var(--color-layer-4)' : undefined,
              }}
              tw="flex w-full justify-between px-1.25 py-1 hover:bg-color-layer-4"
              key={chainId}
            >
              <div tw="flex items-center gap-0.75">
                <AssetIcon tw="h-[2rem] w-[2rem]" logoUrl={CHAIN_INFO[chainId]?.icon} />
                <div tw="flex flex-col items-start gap-0.125">
                  <div tw="text-medium font-medium">{CHAIN_INFO[chainId]?.name}</div>
                </div>
              </div>
            </button>
          </Fragment>
        ))}
      </div>
    </div>
  );
};
