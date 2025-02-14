import { Dispatch, Fragment, SetStateAction } from 'react';

import { CHAIN_INFO } from '@/constants/chains';
import { WITHDRAWABLE_ASSETS } from '@/constants/tokens';

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
  const onChainClick = (newChainId: string) => () => {
    setSelectedChain(newChainId);
    onBack();
  };

  return (
    <div tw="flex flex-col gap-0.5 py-1">
      <div tw="flex flex-col">
        {Object.values(WITHDRAWABLE_ASSETS).map(({ chainId }) => (
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
                <AssetIcon tw="[--asset-icon-size:2rem]" logoUrl={CHAIN_INFO[chainId]?.icon} />
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
