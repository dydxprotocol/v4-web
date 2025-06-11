import { VaultTransfer, VaultTransferType } from '@/bonsai/public-calculators/vaultAccount';
import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { Output, OutputType, ShowSign } from '@/components/Output';

import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

export const VaultTransferRow = ({
  className,
  vaultTransfer,
}: {
  className?: string;
  vaultTransfer: VaultTransfer;
}) => {
  const stringGetter = useStringGetter();
  const { mintscan: mintscanTxUrl } = useURLConfigs();
  const { amountUsdc, timestampMs, transactionHash, type } = orEmptyObj(vaultTransfer);

  const typeString =
    type === VaultTransferType.DEPOSIT
      ? stringGetter({ key: STRING_KEYS.ADD_FUNDS })
      : type === VaultTransferType.WITHDRAWAL
        ? stringGetter({ key: STRING_KEYS.REMOVE_FUNDS })
        : undefined;

  const isReceiving = type === VaultTransferType.DEPOSIT;
  const sizeBN = MustBigNumber(amountUsdc);
  const value = isReceiving ? sizeBN : sizeBN.negated();

  return (
    <$VaultTransferRow className={className}>
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
          <Output
            tw="text-color-text-0 font-mini-book"
            type={OutputType.Date}
            value={timestampMs}
          />
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
            value={value}
          />
        </div>
        {transactionHash && (
          <Link
            tw="text-color-text-0"
            href={`${mintscanTxUrl.replace('{tx_hash}', transactionHash)}`}
          >
            <Icon iconName={IconName.LinkOut} />
          </Link>
        )}
      </div>
    </$VaultTransferRow>
  );
};

const $VaultTransferRow = styled.div`
  ${tw`row w-full justify-between gap-0.5 px-1.25`}
  border-bottom: var(--default-border-width) solid var(--color-layer-3);
`;
