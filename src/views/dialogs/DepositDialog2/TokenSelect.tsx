import { Dispatch, Fragment, SetStateAction, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { partition } from 'lodash';
import { parseUnits } from 'viem';

import { CHAIN_INFO } from '@/constants/chains';

import { AssetIcon } from '@/components/AssetIcon';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';

import { useBalances } from './queries';
import { DepositToken } from './types';
import { getTokenSymbol } from './utils';

export const TokenSelect = ({
  onBack,
  token,
  setToken,
}: {
  onBack: () => void;
  token: DepositToken;
  setToken: Dispatch<SetStateAction<DepositToken>>;
}) => {
  const { isLoading, data } = useBalances();

  const [withBalances, noBalances] = useMemo(() => {
    if (!data) return [[], []];

    const allBalances = Object.keys(data.chains)
      .map((chainId) => {
        const denomToBalance = data.chains[chainId]?.denoms;
        return denomToBalance
          ? Object.entries(denomToBalance).map(([denom, balance]) => ({
              chainId,
              amount: balance.amount,
              formattedAmount: balance.formattedAmount,
              denom,
              decimals: balance.decimals,
              valueUSD: balance.valueUSD,
            }))
          : [];
      })
      .flat();

    return partition(
      allBalances,
      (balance) => parseUnits(balance.amount, balance.decimals ?? 18) > 0
    );
  }, [data]);

  const onTokenClick = (newToken: DepositToken) => () => {
    setToken(newToken);
    onBack();
  };

  if (isLoading)
    return (
      <div tw="flex h-full flex-col items-center justify-center">
        <LoadingSpinner />
      </div>
    );

  return (
    <div tw="flex flex-col gap-0.5 py-1">
      {withBalances.length > 0 && (
        <div tw="px-1.25 pt-0.125 font-medium text-color-text-0">Your tokens</div>
      )}
      <div tw="flex flex-col">
        {withBalances.map((balance, i) => (
          <Fragment key={balance.denom}>
            <button
              onClick={onTokenClick({ chainId: balance.chainId, denom: balance.denom })}
              type="button"
              style={{
                backgroundColor: token.denom === balance.denom ? 'var(--color-layer-4)' : undefined,
              }}
              tw="flex w-full justify-between px-1.25 py-1 hover:bg-color-layer-4"
              key={balance.denom}
            >
              <div tw="flex items-center gap-0.75">
                <AssetIcon tw="h-[2rem] w-[2rem]" symbol={getTokenSymbol(balance.denom)} />
                <div tw="flex flex-col items-start gap-0.125">
                  <div tw="text-medium font-medium">{getTokenSymbol(balance.denom)}</div>
                  <div>{CHAIN_INFO[balance.chainId]?.name}</div>
                </div>
              </div>

              <div tw="flex flex-col items-end gap-0.125">
                <Output
                  tw="text-medium font-medium"
                  fractionDigits={4}
                  type={OutputType.Number}
                  value={BigNumber(balance.formattedAmount)}
                />
                <Output
                  tw="text-color-text-0"
                  fractionDigits={2}
                  type={OutputType.SmallFiat}
                  value={balance.valueUSD}
                />
              </div>
            </button>
            {i < withBalances.length - 1 && (
              <hr tw="w-full border border-solid border-color-border" />
            )}
          </Fragment>
        ))}
      </div>

      {noBalances.length > 0 && (
        <div tw="px-1.25 pt-0.125 font-medium text-color-text-0">
          {withBalances.length > 0 ? 'Other tokens' : 'All tokens'}
        </div>
      )}

      <div tw="flex flex-col">
        {noBalances.map((balance, i) => (
          <Fragment key={balance.denom}>
            <button
              onClick={onTokenClick({ chainId: balance.chainId, denom: balance.denom })}
              type="button"
              tw="flex w-full justify-between px-1.25 py-1 hover:bg-color-layer-4"
              key={balance.denom}
            >
              <div tw="flex items-center gap-0.75">
                <AssetIcon tw="h-[2rem] w-[2rem]" symbol={getTokenSymbol(balance.denom)} />
                <div tw="flex flex-col items-start gap-0.125">
                  <div tw="text-medium font-medium">{getTokenSymbol(balance.denom)}</div>
                  <div>{CHAIN_INFO[balance.chainId]?.name}</div>
                </div>
              </div>
            </button>
            {i < noBalances.length - 1 && (
              <hr tw="w-full border border-solid border-color-border" />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
};
