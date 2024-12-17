import { EventHandler } from 'react';

import BigNumber from 'bignumber.js';
import { SyntheticInputEvent } from 'react-number-format/types/types';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { WalletNetworkType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';

import { useBalance } from './queries';
import { getTokenSymbol } from './utils';

export type AmountInputProps = {
  value: string;
  onChange: (newValue: string) => void;
  token: { chainId: string; denom: string };
  onTokenClick: () => void;
};

const numericValueRegex = /^\d*(?:\\[.])?\d*$/;
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export const AmountInput = ({ value, onChange, token, onTokenClick }: AmountInputProps) => {
  const stringGetter = useStringGetter();
  const { sourceAccount } = useAccounts();

  const onValueChange: EventHandler<SyntheticInputEvent> = (e) => {
    if (!numericValueRegex.test(escapeRegExp(e.target.value))) {
      return;
    }

    onChange(e.target.value);
  };

  const tokenBalance = useBalance(token.chainId, token.denom);

  return (
    <div tw="flex items-center justify-between gap-0.5 rounded-0.75 border border-solid border-color-border bg-color-layer-4 px-1.25 py-0.75">
      <div tw="flex flex-1 flex-col gap-0.5 text-small">
        <div>
          {stringGetter({ key: STRING_KEYS.AMOUNT })}

          {tokenBalance.formatted && (
            <>
              <span> • </span>
              <Output
                tw="inline font-medium text-color-text-0"
                fractionDigits={4}
                slotRight=" held"
                value={BigNumber(tokenBalance.formatted)}
                type={OutputType.Number}
              />
            </>
          )}
        </div>
        <input
          type="number"
          placeholder="0.00"
          tw="flex-1 bg-color-layer-4 text-large font-medium outline-none"
          value={value}
          onChange={onValueChange}
        />
      </div>
      <button
        tw="flex items-center gap-0.75 rounded-0.75 border border-solid border-color-layer-6 bg-color-layer-5 px-0.5 py-0.375"
        type="button"
        disabled={sourceAccount.chain === WalletNetworkType.Solana}
        onClick={onTokenClick}
      >
        <div tw="flex items-center gap-0.5">
          {/* TODO(deposit2.0): Also include chain logo */}
          <AssetIcon tw="h-[2rem] w-[2rem]" symbol={getTokenSymbol(token.denom)} />
          <div>{getTokenSymbol(token.denom)}</div>
        </div>
        {sourceAccount.chain !== WalletNetworkType.Solana && (
          <$CaretIcon size="10px" iconName={IconName.Caret} />
        )}
      </button>
    </div>
  );
};

const $CaretIcon = styled(Icon)`
  transform: rotate(-90deg);
  color: var(--color-text-0);
`;
