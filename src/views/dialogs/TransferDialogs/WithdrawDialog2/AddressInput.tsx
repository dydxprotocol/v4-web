import { EventHandler, useState } from 'react';

import { SyntheticInputEvent } from 'react-number-format/types/types';
import styled from 'styled-components';

import { CHAIN_INFO } from '@/constants/chains';
import { STRING_KEYS } from '@/constants/localization';
import { WalletNetworkType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { CopyButton } from '@/components/CopyButton';
import { Icon, IconName } from '@/components/Icon';
import { WithTooltip } from '@/components/WithTooltip';

import { truncateAddress } from '@/lib/wallet';

import { isValidWithdrawalAddress } from '../utils';

type AddressInputProps = {
  value: string;
  onChange: (newValue: string) => void;
  destinationChain: string;
  onDestinationClicked: () => void;
};

export const AddressInput = ({
  value,
  onChange,
  destinationChain,
  onDestinationClicked,
}: AddressInputProps) => {
  const stringGetter = useStringGetter();
  const { sourceAccount } = useAccounts();
  const [invalidAddress, setInvalidAddress] = useState(false);

  const onValueChange: EventHandler<SyntheticInputEvent> = (e) => {
    onChange(e.target.value);
  };

  const hasValidAddress = isValidWithdrawalAddress(value, destinationChain);

  const onBlur = () => {
    if (value.length > 0 && !hasValidAddress) {
      setInvalidAddress(true);
    }
  };

  const onFocus = () => {
    setInvalidAddress(false);
  };

  return (
    <div tw="flex items-center justify-between gap-0.5 rounded-0.75 border border-solid border-color-border bg-color-layer-4 px-1.25 py-0.75">
      <div tw="flex flex-1 flex-col gap-0.5 text-small">
        <div>
          {stringGetter({ key: STRING_KEYS.ADDRESS })}{' '}
          {invalidAddress && (
            <WithTooltip tooltipString={stringGetter({ key: STRING_KEYS.INVALID_ADDRESS_TITLE })}>
              <Icon tw="text-color-error" size="0.75rem" iconName={IconName.Warning} />
            </WithTooltip>
          )}
        </div>
        <input
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={sourceAccount.address}
          tw="flex-1 text-ellipsis bg-color-layer-4 text-large font-medium outline-none"
          value={value}
          onChange={onValueChange}
        />
        {hasValidAddress && (
          <span tw="row gap-0.25 text-small" title={value}>
            <span>{truncateAddress(value, '')}</span>
            <CopyButton buttonType="text" value={value} />
          </span>
        )}
      </div>
      <button
        tw="flex items-center gap-0.75 rounded-0.75 border border-solid border-color-layer-6 bg-color-layer-5 px-0.5 py-0.375"
        type="button"
        disabled={sourceAccount.chain === WalletNetworkType.Solana}
        onClick={onDestinationClicked}
      >
        <div tw="flex items-center gap-0.5">
          <AssetIcon tw="[--asset-icon-size:2rem]" logoUrl={CHAIN_INFO[destinationChain]?.icon} />
          <div>{CHAIN_INFO[destinationChain]?.name}</div>
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
