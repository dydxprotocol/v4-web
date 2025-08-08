import { forwardRef, useMemo } from 'react';

import { BonsaiCore, BonsaiHooks } from '@/bonsai/ontology';
import { PerpetualMarketSummary } from '@/bonsai/types/summaryTypes';
import type { ColumnSize } from '@react-types/table';
import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS, type StringGetterFunction } from '@/constants/localization';
import { FUNDING_DECIMALS, NumberSign, SMALL_USD_DECIMALS } from '@/constants/numbers';
import { EMPTY_ARR } from '@/constants/objects';
import {
  IndexerFundingPaymentResponseObject,
  IndexerOrderSide,
} from '@/types/indexer/indexerApiGen';

import { MediaQueryKeys } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Icon, IconName } from '@/components/Icon';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { ColumnDef, Table } from '@/components/Table';
import { MarketSummaryTableCell } from '@/components/Table/MarketTableCell';
import { TableCell } from '@/components/Table/TableCell';
import { PageSize } from '@/components/Table/TablePaginationRow';
import { TagSize } from '@/components/Tag';

import { useAppSelector } from '@/state/appTypes';

import { getHydratedFundingPayment } from '@/lib/fundingPayments';
import { getNumberSign } from '@/lib/numbers';
import { Nullable, orEmptyRecord } from '@/lib/typeUtils';

export enum FundingPaymentsTableColumnKey {
  Time = 'Time',
  Market = 'Market',
  Side = 'Side',
  OraclePrice = 'OraclePrice',
  Size = 'Size',
  Payment = 'Payment',
  Rate = 'Rate',
}

export type FundingPaymentTableRow = {
  marketSummary: Nullable<PerpetualMarketSummary>;
  stepSizeDecimals: number;
  tickSizeDecimals: number;
} & IndexerFundingPaymentResponseObject;

const getFundingPaymentsTableColumnDef = ({
  key,
  stringGetter,
  width,
  shortRows,
}: {
  key: FundingPaymentsTableColumnKey;
  stringGetter: StringGetterFunction;
  width?: ColumnSize;
  shortRows?: boolean;
}): ColumnDef<FundingPaymentTableRow> => ({
  width,
  ...(
    {
      [FundingPaymentsTableColumnKey.Time]: {
        columnKey: 'time',
        getCellValue: (row) => row.createdAt,
        label: stringGetter({ key: STRING_KEYS.TIME }),
        renderCell: ({ createdAt }) => (
          <div css={[shortRows ? tw`row gap-0.5` : tw`column`]}>
            <Output
              type={OutputType.Date}
              dateOptions={{ format: 'medium' }}
              value={new Date(createdAt).getTime()}
              title=""
            />
            <div
              css={[
                tw`text-[0.75rem] text-color-text-0`,
                !shortRows ? tw`leading-[0.7rem]` : tw`row`,
              ]}
            >
              <Output
                type={OutputType.Time}
                dateOptions={{ format: 'medium' }}
                value={new Date(createdAt).getTime()}
                title=""
              />
            </div>
          </div>
        ),
      },
      [FundingPaymentsTableColumnKey.Market]: {
        columnKey: 'market',
        getCellValue: (row) => row.ticker,
        label: stringGetter({ key: STRING_KEYS.MARKET }),
        renderCell: ({ marketSummary }) => (
          <MarketSummaryTableCell marketSummary={marketSummary ?? undefined} />
        ),
      },
      [FundingPaymentsTableColumnKey.Side]: {
        columnKey: 'side',
        getCellValue: (row) => row.side,
        label: stringGetter({ key: STRING_KEYS.SIDE }),
        renderCell: ({ side }) =>
          side && <OrderSideTag orderSide={side as IndexerOrderSide} size={TagSize.Medium} />,
      },
      [FundingPaymentsTableColumnKey.OraclePrice]: {
        columnKey: 'oraclePrice',
        getCellValue: (row) => row.oraclePrice,
        label: stringGetter({ key: STRING_KEYS.ORACLE_PRICE }),
        renderCell: ({ oraclePrice, tickSizeDecimals }) => (
          <Output type={OutputType.Fiat} value={oraclePrice} fractionDigits={tickSizeDecimals} />
        ),
      },
      [FundingPaymentsTableColumnKey.Size]: {
        columnKey: 'size',
        getCellValue: (row) => {
          return row.size;
        },
        label: stringGetter({ key: STRING_KEYS.SIZE }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        renderCell: ({ marketSummary, size, stepSizeDecimals }) => {
          return (
            <TableCell>
              <Output type={OutputType.Asset} value={size} fractionDigits={stepSizeDecimals} />
              <Output type={OutputType.Text} value={marketSummary?.displayableAsset} />
            </TableCell>
          );
        },
      },
      [FundingPaymentsTableColumnKey.Payment]: {
        columnKey: 'payment',
        getCellValue: (row) => row.payment,
        label: stringGetter({ key: STRING_KEYS.PAYMENT }),
        renderCell: ({ payment }) => {
          return (
            <TableCell>
              <Output
                type={OutputType.Fiat}
                value={payment}
                showSign={ShowSign.Negative}
                fractionDigits={SMALL_USD_DECIMALS}
              />
            </TableCell>
          );
        },
      },
      [FundingPaymentsTableColumnKey.Rate]: {
        columnKey: 'rate',
        getCellValue: (row) => row.rate,
        label: stringGetter({ key: STRING_KEYS.RATE }),
        renderCell: ({ rate }) => {
          return (
            <TableCell>
              <$OutputSigned
                sign={getNumberSign(rate)}
                type={OutputType.Percent}
                value={rate}
                showSign={ShowSign.Negative}
                fractionDigits={FUNDING_DECIMALS}
              />
            </TableCell>
          );
        },
      },
    } satisfies Record<FundingPaymentsTableColumnKey, ColumnDef<FundingPaymentTableRow>>
  )[key],
});

type ElementProps = {
  columnKeys?: FundingPaymentsTableColumnKey[];
  columnWidths?: Partial<Record<FundingPaymentsTableColumnKey, ColumnSize>>;
  currentMarket?: string;
  initialPageSize?: PageSize;
  shortRows?: boolean;
};

type StyleProps = {
  withOuterBorder?: boolean;
  withInnerBorders?: boolean;
};

export const FundingPaymentsTable = forwardRef<HTMLDivElement, ElementProps & StyleProps>(
  (
    {
      columnKeys = [
        FundingPaymentsTableColumnKey.Time,
        FundingPaymentsTableColumnKey.Market,
        FundingPaymentsTableColumnKey.Side,
        FundingPaymentsTableColumnKey.OraclePrice,
        FundingPaymentsTableColumnKey.Size,
        FundingPaymentsTableColumnKey.Payment,
        FundingPaymentsTableColumnKey.Rate,
      ],
      columnWidths,
      currentMarket,
      initialPageSize,
      shortRows,
      withOuterBorder,
      withInnerBorders = true,
    }: ElementProps & StyleProps,
    _ref
  ) => {
    const stringGetter = useStringGetter();

    const { data: fundingPayments, status: fundingPaymentsStatus } =
      BonsaiHooks.useFundingPayments();

    const marketSummaries = orEmptyRecord(useAppSelector(BonsaiCore.markets.markets.data));

    const fundingPaymentsData = useMemo(() => {
      const filteredFundingPayments = fundingPayments?.filter((fundingPayment) => {
        if (currentMarket) {
          return fundingPayment.ticker === currentMarket;
        }
        return true;
      });

      return filteredFundingPayments?.map(
        (fundingPayment): FundingPaymentTableRow =>
          getHydratedFundingPayment({
            id: fundingPayment.perpetualId + fundingPayment.createdAtHeight,
            data: fundingPayment,
            marketSummaries,
          })
      );
    }, [fundingPayments, marketSummaries, currentMarket]);

    const isLoading =
      fundingPaymentsStatus === 'pending' && (fundingPaymentsData ?? EMPTY_ARR).length === 0;

    return (
      <$Table
        label="Funding Payments"
        tableId="funding-payments"
        data={fundingPaymentsData ?? EMPTY_ARR}
        getRowKey={(row: FundingPaymentTableRow) => row.perpetualId + row.createdAtHeight}
        columns={columnKeys.map((key: FundingPaymentsTableColumnKey) =>
          getFundingPaymentsTableColumnDef({
            key,
            stringGetter,
            width: columnWidths?.[key],
            shortRows,
          })
        )}
        slotEmpty={
          isLoading ? (
            <LoadingSpace />
          ) : (
            <>
              <Icon iconName={IconName.Clock} tw="text-[3em]" />
              <h4>{stringGetter({ key: STRING_KEYS.FUNDING_PAYMENTS_EMPTY_STATE })}</h4>
            </>
          )
        }
        defaultSortDescriptor={{ column: 'time', direction: 'descending' }}
        initialPageSize={initialPageSize}
        withOuterBorder={withOuterBorder}
        withInnerBorders={withInnerBorders}
        withScrollSnapColumns
        withScrollSnapRows
        withFocusStickyRows
      />
    );
  }
);

const $Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}
` as typeof Table;

const $OutputSigned = styled(Output)<{ sign: NumberSign }>`
  color: ${({ sign }) =>
    ({
      [NumberSign.Positive]: `var(--color-positive)`,
      [NumberSign.Negative]: `var(--color-negative)`,
      [NumberSign.Neutral]: `var(--color-text-2)`,
    })[sign]};
`;
