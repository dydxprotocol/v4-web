import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Icon, IconName } from '@/components/Icon';
import { formatNumberOutput, Output, OutputType, ShowSign } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { selectTransfersByAddress } from '@/state/transfersSelectors';

import { orEmptyObj } from '@/lib/typeUtils';
import { truncateAddress } from '@/lib/wallet';

import { UnseenIndicator } from './UnseenIndicator';

export const SkipTransferNotificationRow = ({
  className,
  transferId,
  isUnseen,
}: {
  className?: string;
  transferId: string;
  isUnseen: boolean;
}) => {
  const stringGetter = useStringGetter();
  const { dydxAddress } = useAccounts();
  const selectedLocale = useAppSelector(getSelectedLocale);
  const userTransfers = useAppSelectorWithArgs(selectTransfersByAddress, dydxAddress);
  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();

  const transfer = orEmptyObj(userTransfers.find((t) => t.id === transferId));
  const { type, status, estimatedAmountUsd, finalAmountUsd, updatedAt } = transfer;
  const finalAmount = formatNumberOutput(finalAmountUsd ?? estimatedAmountUsd, OutputType.Fiat, {
    decimalSeparator,
    groupSeparator,
    selectedLocale,
  });

  const isReceiving = type === 'deposit';
  const isSuccess = status === 'success';

  const chainId = type === 'deposit' ? transfer.chainId : 'DYDX';

  const title =
    type === 'withdraw'
      ? stringGetter({ key: isSuccess ? STRING_KEYS.WITHDRAW : STRING_KEYS.WITHDRAW_IN_PROGRESS })
      : stringGetter({ key: isSuccess ? STRING_KEYS.DEPOSIT : STRING_KEYS.DEPOSIT_IN_PROGRESS });

  const transferString = isReceiving
    ? stringGetter({
        key: STRING_KEYS.FROM,
        params: {
          FROM: <span>{chainId}</span>,
        },
      })
    : stringGetter({
        key: STRING_KEYS.TO,
        params: {
          TO: <span>{truncateAddress(dydxAddress)}</span>,
        },
      });

  return (
    <$TransferRow className={className}>
      <div tw="row gap-0.75">
        <div
          tw="row size-2.25 justify-center rounded-0.5 bg-color-layer-3 text-color-text-2"
          css={{
            transform: isReceiving ? 'rotate(0.5turn)' : 'none',
          }}
        >
          <Icon iconName={IconName.Move} />
        </div>
        <div tw="flexColumn">
          <span tw="text-color-text-2">{title}</span>
          <Output tw="text-color-text-0 font-tiny-book" type={OutputType.Date} value={updatedAt} />
        </div>
      </div>

      <div tw="row gap-1">
        <div tw="flexColumn items-end text-end">
          <Output
            type={OutputType.Fiat}
            css={{
              color: isReceiving ? 'var(--color-positive)' : 'var(--color-negative)',
            }}
            withSignColor
            showSign={ShowSign.Both}
            value={finalAmount}
          />
          <span tw="text-color-text-0 font-small-book">{transferString}</span>
        </div>
        {isUnseen && <UnseenIndicator />}
      </div>
    </$TransferRow>
  );
};

const $TransferRow = styled.div`
  ${tw`row w-full justify-between gap-0.5 px-1.25`}
  border-bottom: var(--default-border-width) solid var(--color-layer-3);
`;
