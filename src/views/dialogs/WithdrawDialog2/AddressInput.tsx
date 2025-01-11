import { EventHandler } from 'react';

import { SyntheticInputEvent } from 'react-number-format/types/types';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { WalletNetworkType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';

type AddressInputProps = {
  value: string;
  onChange: (newValue: string) => void;
  _destinationChain: string;
  onDestinationClicked: () => void;
};

export const AddressInput = ({
  value,
  onChange,
  _destinationChain,
  onDestinationClicked,
}: AddressInputProps) => {
  const stringGetter = useStringGetter();
  const { sourceAccount } = useAccounts();

  const onValueChange: EventHandler<SyntheticInputEvent> = (e) => {
    onChange(e.target.value);
  };

  return (
    <div tw="flex items-center justify-between gap-0.5 rounded-0.75 border border-solid border-color-border bg-color-layer-4 px-1.25 py-0.75">
      <div tw="flex flex-1 flex-col gap-0.5 text-small">
        <div>{stringGetter({ key: STRING_KEYS.ADDRESS })}</div>
        <input
          placeholder={sourceAccount.address}
          tw="flex-1 bg-color-layer-4 text-large font-medium outline-none"
          value={value}
          onChange={onValueChange}
        />
      </div>
      <button
        tw="flex items-center gap-0.75 rounded-0.75 border border-solid border-color-layer-6 bg-color-layer-5 px-0.5 py-0.375"
        type="button"
        disabled={sourceAccount.chain === WalletNetworkType.Solana}
        onClick={onDestinationClicked}
      >
        <div tw="flex items-center gap-0.5">
          <AssetIcon tw="h-[2rem] w-[2rem]" symbol="ETH" />
          <div>Ethereum</div>
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
