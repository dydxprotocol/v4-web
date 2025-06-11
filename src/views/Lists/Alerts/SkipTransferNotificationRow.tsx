import styled from 'styled-components';
import tw from 'twin.macro';

import { CHAIN_INFO } from '@/constants/chains';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';

import { Transfer } from '@/state/transfers';

import { MustBigNumber } from '@/lib/numbers';
import { truncateAddress } from '@/lib/wallet';

import { DateContent } from '../DateContent';
import { UnseenIndicator } from './UnseenIndicator';

export const SkipTransferNotificationRow = ({
  className,
  transfer,
  isUnseen,
}: {
  className?: string;
  transfer: Transfer;
  isUnseen: boolean;
}) => {
  const stringGetter = useStringGetter();
  const { dydxAddress } = useAccounts();
  const { type, status, estimatedAmountUsd, finalAmountUsd, updatedAt } = transfer;
  const transferAmountBN = MustBigNumber(finalAmountUsd ?? estimatedAmountUsd);
  const isReceiving = type === 'deposit';
  const multiplier = isReceiving ? 1 : -1;
  const isSuccess = status === 'success';
  const transferAmount = transferAmountBN.times(multiplier);

  const chainId = type === 'deposit' ? transfer.chainId : undefined;
  const chain = chainId ? CHAIN_INFO[chainId]?.name : 'DYDX';

  const title =
    type === 'withdraw'
      ? stringGetter({ key: isSuccess ? STRING_KEYS.WITHDRAW : STRING_KEYS.WITHDRAW_IN_PROGRESS })
      : stringGetter({ key: isSuccess ? STRING_KEYS.DEPOSIT : STRING_KEYS.DEPOSIT_IN_PROGRESS });

  const transferString = isReceiving
    ? stringGetter({
        key: STRING_KEYS.FROM,
        params: {
          FROM: <span tw="text-color-text-2">{chain}</span>,
        },
      })
    : stringGetter({
        key: STRING_KEYS.TO,
        params: {
          TO: <span tw="text-color-text-2">{truncateAddress(dydxAddress)}</span>,
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
          <DateContent time={updatedAt} />
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
            value={transferAmount}
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
