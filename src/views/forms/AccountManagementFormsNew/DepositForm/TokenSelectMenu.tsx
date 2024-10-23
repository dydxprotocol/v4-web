import { useMemo } from 'react';

import { Asset } from '@skip-go/client';

import { isLowFeeDenom } from '@/constants/cctp';

import { SearchSelectMenu } from '@/components/SearchSelectMenu';

import { FeeLevelTag } from '../FeeLevelTag';

type ElementProps = {
  tokens: Asset[];
  selectedToken?: Asset;
  onSelectTokenDenom: (denom: string) => void;
};

export const TokenSelectMenu = ({ tokens, selectedToken, onSelectTokenDenom }: ElementProps) => {
  // tokenItems are *all* available tokens, sorted by balance then low fees.
  // if no balances, don't sort by balance
  const tokenItems = useMemo(() => {
    return (
      Object.values(tokens)
        .map(({ denom, name }) => ({
          value: denom,
          label: name,
          onSelect: () => {
            onSelectTokenDenom(denom);
          },
        }))
        // .sort((a, b) => getBalance(b) - getBalance(a))
        .sort(({ value }) => (isLowFeeDenom(value) ? -1 : 1))
    );
  }, [onSelectTokenDenom, tokens]);
  return (
    <SearchSelectMenu
      items={[{ group: 'assets', items: tokenItems }]}
      withSearch
      alternateSearchInputComponent
    >
      <div tw="row gap-0.5 text-color-text-2 font-base-book">
        <img tw="h-1.25 w-1.25 rounded-[50%]" src={selectedToken?.logoURI} alt="icon" />{' '}
        {selectedToken?.name}
        {/* TODO: actually input feelevel */}
        <FeeLevelTag feeLevel="low" />
      </div>
    </SearchSelectMenu>
  );
};
