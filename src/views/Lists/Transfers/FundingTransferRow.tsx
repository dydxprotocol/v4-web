import { BonsaiHelpers } from '@/bonsai/ontology';
import styled from 'styled-components';
import tw from 'twin.macro';

import { FUNDING_DECIMALS, TOKEN_DECIMALS } from '@/constants/numbers';
import {
  IndexerFundingPaymentResponseObject,
  IndexerPositionSide,
} from '@/types/indexer/indexerApiGen';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';

import { getIndexerPositionSideStringKey } from '@/lib/enumToStringKeyHelpers';
import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

export const FundingTransferRow = ({
  className,
  fundingPayment,
}: {
  className?: string;
  fundingPayment: IndexerFundingPaymentResponseObject;
}) => {
  const stringGetter = useStringGetter();
  const { createdAt, ticker, size, side, rate, payment } = fundingPayment;
  const marketData = useAppSelectorWithArgs(BonsaiHelpers.markets.selectMarketSummaryById, ticker);
  const { displayableAsset, stepSizeDecimals } = orEmptyObj(marketData);

  // casting to IndexerPositionSide because the type is String in the IndexerFundingPaymentResponseObject
  const sideString = stringGetter({
    key: getIndexerPositionSideStringKey(side as IndexerPositionSide),
  });

  const paymentBN = MustBigNumber(payment);
  const rateBN = MustBigNumber(rate);
  const isReceiving = paymentBN.isPositive();

  const topRow = (
    <div tw="row gap-0.25">
      <Output type={OutputType.Number} value={size} fractionDigits={stepSizeDecimals} />
      <span>{displayableAsset}</span>
      <span
        css={{
          color:
            side === IndexerPositionSide.LONG ? 'var(--color-positive)' : 'var(--color-negative)',
        }}
      >
        {sideString}
      </span>
    </div>
  );

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
          <span tw="text-color-text-2">{topRow}</span>
          <span tw="leading-[0]">
            <Output
              tw="text-color-text-0 font-tiny-book"
              type={OutputType.Time}
              value={createdAt}
            />{' '}
            <Output
              tw="text-color-text-0 font-tiny-book"
              type={OutputType.Date}
              value={createdAt}
            />
          </span>
        </div>
      </div>

      <div tw="row gap-1">
        <div tw="flexColumn items-end text-end">
          <Output
            type={OutputType.Fiat}
            withSignColor
            showSign={ShowSign.Both}
            value={paymentBN}
            fractionDigits={TOKEN_DECIMALS}
          />
          <Output
            type={OutputType.Percent}
            tw="font-mini-book"
            css={{
              color: rateBN.isPositive() ? 'var(--color-positive)' : 'var(--color-negative)',
            }}
            withSignColor
            showSign={ShowSign.Both}
            value={rateBN.div(100)}
            fractionDigits={FUNDING_DECIMALS}
          />
        </div>
      </div>
    </$TransferRow>
  );
};

const $TransferRow = styled.div`
  ${tw`row w-full justify-between gap-0.5 px-1.25`}
  border-bottom: var(--default-border-width) solid var(--color-layer-3);
`;
