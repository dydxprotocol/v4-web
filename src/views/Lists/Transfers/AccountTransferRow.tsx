import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';
import { IndexerTransferResponseObject, IndexerTransferType } from '@/types/indexer/indexerApiGen';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { Output, OutputType, ShowSign } from '@/components/Output';

import { getTransferTypeStringKey } from '@/lib/enumToStringKeyHelpers';
import { MustBigNumber } from '@/lib/numbers';
import { truncateAddress } from '@/lib/wallet';

export const AccountTransferRow = ({
  className,
  transfer,
}: {
  className?: string;
  transfer: IndexerTransferResponseObject;
}) => {
  const stringGetter = useStringGetter();
  const { mintscan: mintscanTxUrl } = useURLConfigs();
  const { createdAt, recipient, sender, size, symbol, transactionHash, type } = transfer;
  const typeString = stringGetter({ key: getTransferTypeStringKey(type) });

  const isReceiving =
    type === IndexerTransferType.TRANSFERIN || type === IndexerTransferType.DEPOSIT;

  const sizeBN = MustBigNumber(size);
  const value = isReceiving ? sizeBN : sizeBN.negated();
  const transferString = isReceiving
    ? stringGetter({
        key: STRING_KEYS.FROM,
        params: {
          FROM: <span>{truncateAddress(sender.address)}</span>,
        },
      })
    : stringGetter({
        key: STRING_KEYS.TO,
        params: {
          TO: <span>{truncateAddress(recipient.address)}</span>,
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
          <span tw="text-color-text-2">{typeString}</span>
          <Output tw="text-color-text-0 font-mini-book" type={OutputType.Date} value={createdAt} />
        </div>
      </div>

      <div tw="row gap-1">
        <div tw="flexColumn items-end text-end">
          <Output
            type={symbol === 'USDC' ? OutputType.Fiat : OutputType.Number}
            css={{
              color: isReceiving ? 'var(--color-positive)' : 'var(--color-negative)',
            }}
            withSignColor
            showSign={ShowSign.Both}
            value={value}
            slotRight={symbol === 'USDC' ? null : <span>{symbol}</span>}
          />
          <span tw="text-color-text-0 font-mini-book">{transferString}</span>
        </div>
        <Link
          tw="text-color-text-0"
          href={`${mintscanTxUrl.replace('{tx_hash}', transactionHash)}`}
        >
          <Icon iconName={IconName.LinkOut} />
        </Link>
      </div>
    </$TransferRow>
  );
};

const $TransferRow = styled.div`
  ${tw`row w-full justify-between gap-0.5 px-1.25`}
  border-bottom: var(--default-border-width) solid var(--color-layer-3);
`;
