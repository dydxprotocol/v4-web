import { Dispatch, Fragment, SetStateAction, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { partition } from 'lodash';
import { parseUnits } from 'viem';

import { CHAIN_INFO } from '@/constants/chains';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { TokenForTransfer } from '@/constants/tokens';

import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';

import { getTokenSymbol } from '../utils';
import { useBalances } from './queries';

export const TokenSelect = ({
  disabled,
  onBack,
  token,
  setToken,
}: {
  // disable buttons to prevent tab events while TokenSelect has 0 height
  disabled?: boolean;
  onBack: () => void;
  token: TokenForTransfer;
  setToken: Dispatch<SetStateAction<TokenForTransfer>>;
}) => {
  const stringGetter = useStringGetter();
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
      .flat()
      // TODO: log when there are no decimals? this shouldnt happen
      .filter((balance) => balance.decimals);

    return partition(allBalances, (balance) => parseUnits(balance.amount, balance.decimals!) > 0);
  }, [data]);

  const onTokenClick = (newToken: TokenForTransfer) => () => {
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
        <div tw="px-1.25 pt-0.125 font-medium text-color-text-0">
          {stringGetter({ key: STRING_KEYS.YOUR_TOKENS })}
        </div>
      )}
      <div tw="flex flex-col">
        {withBalances.map((balance, i) => (
          <Fragment key={balance.denom}>
            <button
              disabled={disabled}
              onClick={onTokenClick({
                chainId: balance.chainId,
                denom: balance.denom,
                decimals: balance.decimals!,
              })}
              type="button"
              style={{
                backgroundColor: token.denom === balance.denom ? 'var(--color-layer-4)' : undefined,
              }}
              tw="flex w-full justify-between px-1.25 py-1 hover:bg-color-layer-4"
              key={balance.denom}
            >
              <div tw="flex items-center gap-0.75">
                <AssetIcon
                  tw="[--asset-icon-size:2rem]"
                  symbol={getTokenSymbol(balance.denom)}
                  chainId={balance.chainId}
                />
                <div tw="flex flex-col items-start gap-0.125">
                  <div tw="text-medium font-medium">{getTokenSymbol(balance.denom)}</div>
                  <div>{CHAIN_INFO[balance.chainId]?.name}</div>
                </div>
              </div>

              <div tw="flex flex-col items-end gap-0.125">
                <Output
                  tw="text-medium font-medium"
                  fractionDigits={TOKEN_DECIMALS}
                  type={OutputType.Number}
                  value={BigNumber(balance.formattedAmount)}
                />
                <Output
                  tw="text-color-text-0"
                  fractionDigits={USD_DECIMALS}
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
          {withBalances.length > 0
            ? stringGetter({ key: STRING_KEYS.OTHER_TOKENS })
            : stringGetter({ key: STRING_KEYS.SUPPORTED_TOKENS })}
        </div>
      )}

      <div tw="flex flex-col">
        {noBalances.map((balance, i) => (
          <Fragment key={balance.denom}>
            <button
              disabled={disabled}
              onClick={onTokenClick({
                chainId: balance.chainId,
                denom: balance.denom,
                decimals: balance.decimals!,
              })}
              type="button"
              tw="flex w-full justify-between px-1.25 py-1 hover:bg-color-layer-4"
              key={balance.denom}
            >
              <div tw="flex items-center gap-0.75">
                <AssetIcon
                  tw="[--asset-icon-size:2rem]"
                  symbol={getTokenSymbol(balance.denom)}
                  chainId={balance.chainId}
                />
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
