import { Dispatch, Fragment, SetStateAction } from 'react';

import { mainnet } from 'viem/chains';

import { CHAIN_INFO } from '@/constants/chains';

import { AssetIcon } from '@/components/AssetIcon';

export const ChainSelect = ({
  onBack,
  selectedChain,
  setSelectedChain,
}: {
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
        {[mainnet.id].map((chain) => {
          const chainId = chain.toString();

          return (
            <Fragment key={chainId}>
              <button
                onClick={onChainClick(chainId)}
                type="button"
                style={{
                  backgroundColor: chainId === selectedChain ? 'var(--color-layer-4)' : undefined,
                }}
                tw="flex w-full justify-between px-1.25 py-1 hover:bg-color-layer-4"
                key={chainId}
              >
                <div tw="flex items-center gap-0.75">
                  <AssetIcon tw="h-[2rem] w-[2rem]" symbol="ETH" />
                  <div tw="flex flex-col items-start gap-0.125">
                    <div tw="text-medium font-medium">{CHAIN_INFO[chainId]?.name}</div>
                  </div>
                </div>
              </button>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};
