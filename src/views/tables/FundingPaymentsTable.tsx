import { DateTime } from 'luxon';
import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import type { Asset, SubaccountFundingPayment } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Output, OutputType } from '@/components/Output';
import { Table, TableCell, type ColumnDef } from '@/components/Table';
import { MarketTableCell } from '@/components/Table/MarketTableCell';

import {
  getCurrentMarketFundingPayments,
  getSubaccountFundingPayments,
} from '@/state/accountSelectors';
import { getAssets } from '@/state/assetsSelectors';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

import { MustBigNumber } from '@/lib/numbers';
import { getHydratedTradingData } from '@/lib/orders';
import { getStringsForDateTimeDiff } from '@/lib/timeUtils';

type ElementProps = {
  currentMarket?: string;
};

type StyleProps = {
  withOuterBorder?: boolean;
};

export type FundingPaymentTableRow = {
  asset: Asset;
  stepSizeDecimals: number;
  tickSizeDecimals: number;
} & SubaccountFundingPayment;

export const FundingPaymentsTable = ({
  currentMarket,
  withOuterBorder,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();

  const marketFundingPayments = useSelector(getCurrentMarketFundingPayments, shallowEqual) || [];
  const allFundingPayments = useSelector(getSubaccountFundingPayments, shallowEqual) || [];
  const fundingPayments = currentMarket ? marketFundingPayments : allFundingPayments;

  const allPerpetualMarkets = useSelector(getPerpetualMarkets, shallowEqual) || {};
  const allAssets = useSelector(getAssets, shallowEqual) || {};

  const fundingPaymentsData = fundingPayments.map((fundingPayment: SubaccountFundingPayment) =>
    getHydratedTradingData({
      data: fundingPayment,
      assets: allAssets,
      perpetualMarkets: allPerpetualMarkets,
    })
  ) as FundingPaymentTableRow[];

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
              <MarketTableCell asset={asset} marketId={marketId} />
            ),
          },
          {
            columnKey: 'time',
            getCellValue: (row) => row.effectiveAtMilliSeconds,
            label: stringGetter({ key: STRING_KEYS.TIME }),
            renderCell: ({ effectiveAtMilliSeconds }) => {
              // TODO: use OutputType.RelativeTime when ready
              const { timeString, unitStringKey } = getStringsForDateTimeDiff(
                DateTime.fromMillis(effectiveAtMilliSeconds)
              );
              return `${timeString}${stringGetter({ key: unitStringKey })}`;
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
                  tag={asset.id}
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
        ] as ColumnDef<FundingPaymentTableRow>[]
      ).filter(Boolean)}
      slotEmpty={
        <>
          <h4>{stringGetter({ key: STRING_KEYS.FUNDING_PAYMENTS_EMPTY_STATE })}</h4>
        </>
      }
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
