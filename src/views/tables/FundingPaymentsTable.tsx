import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import type { Asset, Nullable, SubaccountFundingPayment } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';

import { useStringGetter } from '@/hooks/useStringGetter';

import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Output, OutputType } from '@/components/Output';
import { Table, type ColumnDef } from '@/components/Table';
import { MarketTableCell } from '@/components/Table/MarketTableCell';
import { TableCell } from '@/components/Table/TableCell';
import { PageSize } from '@/components/Table/TablePaginationRow';

import {
  getCurrentMarketFundingPayments,
  getSubaccountFundingPayments,
} from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getAssets } from '@/state/assetsSelectors';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';
import { getHydratedTradingData } from '@/lib/orders';
import { orEmptyObj } from '@/lib/typeUtils';

type ElementProps = {
  currentMarket?: string;
  initialPageSize?: PageSize;
};

type StyleProps = {
  withOuterBorder?: boolean;
};

export type FundingPaymentTableRow = {
  asset: Nullable<Asset>;
  stepSizeDecimals: Nullable<number>;
  tickSizeDecimals: Nullable<number>;
} & SubaccountFundingPayment;

export const FundingPaymentsTable = ({
  currentMarket,
  initialPageSize,
  withOuterBorder,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();

  const marketFundingPayments =
    useAppSelector(getCurrentMarketFundingPayments, shallowEqual) ?? EMPTY_ARR;
  const allFundingPayments =
    useAppSelector(getSubaccountFundingPayments, shallowEqual) ?? EMPTY_ARR;
  const fundingPayments = currentMarket ? marketFundingPayments : allFundingPayments;

  const allPerpetualMarkets = orEmptyObj(useAppSelector(getPerpetualMarkets, shallowEqual));
  const allAssets = orEmptyObj(useAppSelector(getAssets, shallowEqual));

  const fundingPaymentsData = fundingPayments.map(
    (fundingPayment: SubaccountFundingPayment): FundingPaymentTableRow =>
      getHydratedTradingData({
        data: fundingPayment,
        assets: allAssets,
        perpetualMarkets: allPerpetualMarkets,
      })
  );

  return (
    <$Table
      key={currentMarket ?? 'all-fundingPayments'}
      label="FundingPayments"
      data={fundingPaymentsData}
      getRowKey={(row: FundingPaymentTableRow) => `${row.marketId}-${row.effectiveAtMilliSeconds}`}
      columns={(
        [
          !currentMarket && {
            columnKey: 'marketId',
            getCellValue: (row) => row.marketId,
            label: stringGetter({ key: STRING_KEYS.MARKET }),
            renderCell: ({ asset, marketId }) => (
              <MarketTableCell asset={asset ?? undefined} marketId={marketId} />
            ),
          },
          {
            columnKey: 'time',
            getCellValue: (row) => row.effectiveAtMilliSeconds,
            label: stringGetter({ key: STRING_KEYS.TIME }),
            renderCell: ({ effectiveAtMilliSeconds }) => {
              return (
                <Output
                  type={OutputType.RelativeTime}
                  value={effectiveAtMilliSeconds}
                  relativeTimeFormatOptions={{ format: 'singleCharacter' }}
                />
              );
            },
          },
          {
            columnKey: 'payment',
            getCellValue: (row) => row.payment,
            label: stringGetter({ key: STRING_KEYS.PAYMENT }),
            renderCell: (row) => <Output type={OutputType.SmallFiat} value={row.payment} />,
          },
          {
            columnKey: 'fundingRate',
            getCellValue: (row) => row.rate,
            label: stringGetter({ key: STRING_KEYS.FUNDING_RATE }),
            renderCell: (row) => (
              <$Output
                type={OutputType.SmallPercent}
                value={row.rate}
                isNegative={MustBigNumber(row.rate).isNegative()}
              />
            ),
          },
          {
            columnKey: 'position',
            getCellValue: (row) => row.positionSize,
            label: stringGetter({ key: STRING_KEYS.POSITION }),
            renderCell: ({ asset, positionSize, stepSizeDecimals }) => (
              <TableCell stacked>
                <Output
                  type={OutputType.Asset}
                  value={Math.abs(positionSize)}
                  fractionDigits={stepSizeDecimals}
                  tag={asset?.id}
                />
                <$Output
                  type={OutputType.Text}
                  value={
                    MustBigNumber(positionSize).isNegative()
                      ? stringGetter({ key: STRING_KEYS.SHORT_POSITION_SHORT })
                      : stringGetter({ key: STRING_KEYS.LONG_POSITION_SHORT })
                  }
                  isNegative={MustBigNumber(positionSize).isNegative()}
                />
              </TableCell>
            ),
          },
          {
            columnKey: 'oraclePrice',
            getCellValue: (row) => row.price,
            label: stringGetter({ key: STRING_KEYS.ORACLE_PRICE }),
            renderCell: ({ price, tickSizeDecimals }) => (
              <Output type={OutputType.Fiat} value={price} fractionDigits={tickSizeDecimals} />
            ),
          },
        ] satisfies Array<false | ColumnDef<FundingPaymentTableRow>>
      ).filter(isTruthy)}
      slotEmpty={<h4>{stringGetter({ key: STRING_KEYS.FUNDING_PAYMENTS_EMPTY_STATE })}</h4>}
      initialPageSize={initialPageSize}
      withOuterBorder={withOuterBorder}
      withInnerBorders
      withScrollSnapColumns
      withScrollSnapRows
      withFocusStickyRows
    />
  );
};
const $Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}
` as typeof Table;

const $Output = styled(Output)<{ isNegative?: boolean }>`
  color: ${({ isNegative }) =>
    isNegative ? `var(--color-negative)` : `var(--color-positive)`} !important;
`;
