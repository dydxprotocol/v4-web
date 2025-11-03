import { EventHandler, useState } from 'react';

import { SyntheticInputEvent } from 'react-number-format/types/types';
import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';

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
}: AddressInputProps) => {
  const stringGetter = useStringGetter();
  const { sourceAccount } = useAccounts();
  const [isFocused, setIsFocused] = useState(false);

  const onValueChange: EventHandler<SyntheticInputEvent> = (e) => {
    onChange(e.target.value);
  };

  const hasValidAddress = isValidWithdrawalAddress(value, destinationChain);

  const onBlur = () => {
    setIsFocused(false);
  };

  const onFocus = () => {
    setIsFocused(true);
  };

  return (
    <$WithdrawAmountInputContainer>
      <div tw="flex min-w-0 flex-1 flex-col gap-0.5 text-small">
        <div>
          {stringGetter({ key: STRING_KEYS.ADDRESS })}{' '}
          {!hasValidAddress && !isFocused && value.trim() !== '' && (
            <WithTooltip tooltipString={stringGetter({ key: STRING_KEYS.INVALID_ADDRESS_TITLE })}>
              <Icon tw="text-color-error" size="0.75rem" iconName={IconName.Warning} />
            </WithTooltip>
          )}
        </div>
        <$Input
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={sourceAccount.address}
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
    </$WithdrawAmountInputContainer>
  );
};

const $WithdrawAmountInputContainer = styled.div<{ isSimpleUi?: boolean }>`
  ${tw`flex items-center justify-between gap-0.5 rounded-0.75 px-1.25 py-0.75`}
  background-color: var(--withdraw-dialog-amount-bgColor, var(--color-layer-4));
  border: 1px solid var(--color-border);

  @media ${breakpoints.tablet} {
    --withdraw-dialog-amount-bgColor: var(--color-layer-2);
    border-color: transparent;
  }
`;

const $Input = styled.input`
  ${tw`flex-1 text-ellipsis text-large font-medium outline-none`}
  background-color: var(--withdraw-dialog-amount-bgColor, var(--color-layer-4));
`;
