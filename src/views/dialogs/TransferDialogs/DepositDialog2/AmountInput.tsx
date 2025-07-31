import { EventHandler } from 'react';

import { SyntheticInputEvent } from 'react-number-format/types/types';
import styled from 'styled-components';
import tw from 'twin.macro';
import { formatUnits, parseUnits } from 'viem';

import { STRING_KEYS } from '@/constants/localization';
import { EVM_GAS_RESERVE_AMOUNT, TOKEN_DECIMALS } from '@/constants/numbers';
import { ETH_DECIMALS, TokenForTransfer } from '@/constants/tokens';
import { WalletNetworkType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';

import { getTokenSymbol, isNativeTokenDenom } from '../utils';

export type AmountInputProps = {
  value: string;
  onChange: (newValue: string) => void;
  token: TokenForTransfer;
  onTokenClick: () => void;
  tokenBalance: { raw?: string; formatted?: string };
  error?: Error | null;
};

const numericValueRegex = /^\d*(?:\\[.])?\d*$/;
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const GAS_RESERVE_AMOUNT = parseUnits(EVM_GAS_RESERVE_AMOUNT.toString(), ETH_DECIMALS);

export const AmountInput = ({
  value,
  onChange,
  token,
  onTokenClick,
  tokenBalance,
  error,
}: AmountInputProps) => {
  const stringGetter = useStringGetter();
  const { sourceAccount } = useAccounts();

  const onValueChange: EventHandler<SyntheticInputEvent> = (e) => {
    if (!numericValueRegex.test(escapeRegExp(e.target.value))) {
      return;
    }

    onChange(e.target.value);
  };

  const isNativeToken = isNativeTokenDenom(token.denom);

  const onClickMax = () => {
    if (!tokenBalance.raw) return;

    const balanceAmount = BigInt(tokenBalance.raw!);
    if (isNativeToken) {
      const amount =
        balanceAmount > GAS_RESERVE_AMOUNT ? balanceAmount - GAS_RESERVE_AMOUNT : balanceAmount;
      onChange(formatUnits(amount, token.decimals));
      return;
    }

    onChange(formatUnits(balanceAmount, token.decimals));
  };

  const onMaxDisabled = !tokenBalance.raw || BigInt(tokenBalance.raw) === BigInt(0);

  return (
    <$AmountInputContainer>
      <div tw="flex min-w-0 flex-1 flex-col gap-0.5 text-small">
        <div tw="row justify-between">
          {stringGetter({ key: STRING_KEYS.AMOUNT })}

          <div>
            {tokenBalance.formatted && (
              <Output
                tw="inline font-medium text-color-text-0"
                fractionDigits={TOKEN_DECIMALS}
                slotRight={` ${stringGetter({ key: STRING_KEYS.HELD })}`}
                value={tokenBalance.formatted}
                type={OutputType.Number}
              />
            )}

            {tokenBalance.raw && (
              <>
                <span> • </span>
                <button
                  disabled={onMaxDisabled}
                  onClick={onClickMax}
                  type="button"
                  tw="font-medium"
                  css={{ color: onMaxDisabled ? 'var(--color-text-0)' : 'var(--color-accent)' }}
                >
                  {stringGetter({ key: STRING_KEYS.MAX })}
                </button>
              </>
            )}
          </div>
        </div>
        <div tw="row gap-0.5">
          <$Input
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            type="text"
            placeholder="0.00"
            hasError={!!error}
            value={value}
            onChange={onValueChange}
          />

          <$TokenButton
            type="button"
            disabled={sourceAccount.chain === WalletNetworkType.Solana}
            onClick={onTokenClick}
          >
            <div tw="flex items-center gap-0.5 text-color-text-2">
              <AssetIcon
                tw="[--asset-icon-size:2rem]"
                symbol={getTokenSymbol(token.denom)}
                chainId={token.chainId}
              />
              <div>{getTokenSymbol(token.denom)}</div>
            </div>
            {sourceAccount.chain !== WalletNetworkType.Solana && (
              <$CaretIcon size="10px" iconName={IconName.Caret} />
            )}
          </$TokenButton>
        </div>
      </div>
    </$AmountInputContainer>
  );
};

const $AmountInputContainer = styled.div`
  ${tw`flex items-center justify-between gap-0.5 rounded-0.75 px-1.25 py-0.75`}

  background-color: var(--deposit-dialog-amount-bgColor, var(--color-layer-4));
  border: 1px solid var(--color-border);

  @media ${breakpoints.tablet} {
    --deposit-dialog-amount-bgColor: var(--color-layer-2);
    border-color: transparent;
  }
`;

const $Input = styled.input<{ hasError?: boolean }>`
  ${tw`min-w-0 flex-1 text-color-text-2 outline-none font-extra-medium`}
  ${({ hasError }) => hasError && tw`text-color-error`}
  background-color: var(--deposit-dialog-amount-bgColor, var(--color-layer-4));
`;

const $TokenButton = styled.button`
  ${tw`flex items-center gap-0.75 rounded-0.75 border border-solid border-color-layer-6 bg-color-layer-5 px-0.5 py-0.375`}

  --asset-icon-chain-icon-borderColor: var(--color-layer-5);

  @media ${breakpoints.tablet} {
    border-color: transparent;
  }
`;

const $CaretIcon = styled(Icon)`
  transform: rotate(-90deg);
  color: var(--color-text-0);
`;
