import { Key, useMemo } from 'react';

import type { ColumnSize } from '@react-types/table';
import { shallowEqual, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import {
  Subaccount,
  type Asset,
  type Nullable,
  type SubaccountOrder,
  type SubaccountPosition,
} from '@/constants/abacus';
import { STRING_KEYS, StringGetterFunction } from '@/constants/localization';
import { NumberSign, TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { AppRoute } from '@/constants/routes';
import { PositionSide } from '@/constants/trade';

import { MediaQueryKeys } from '@/hooks/useBreakpoints';
import { useEnvFeatures } from '@/hooks/useEnvFeatures';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { Table, TableColumnHeader, type ColumnDef } from '@/components/Table';
import { MarketTableCell } from '@/components/Table/MarketTableCell';
import { TableCell } from '@/components/Table/TableCell';
import { PageSize } from '@/components/Table/TablePaginationRow';

import {
  calculateIsAccountViewOnly,
  calculateShouldRenderTriggersInPositionsTable,
} from '@/state/accountCalculators';
import {
  getExistingOpenPositions,
  getSubaccount,
  getSubaccountConditionalOrders,
} from '@/state/accountSelectors';
import { getAssets } from '@/state/assetsSelectors';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

import { MustBigNumber, getNumberSign } from '@/lib/numbers';
import { getPositionMargin } from '@/lib/tradeData';

import { PositionsActionsCell } from './PositionsTable/PositionsActionsCell';
import { PositionsMarginCell } from './PositionsTable/PositionsMarginCell';
import { PositionsTriggersCell } from './PositionsTable/PositionsTriggersCell';

export enum PositionsTableColumnKey {
  Details = 'Details',
  IndexEntry = 'IndexEntry',
  PnL = 'PnL',

  Market = 'Market',
  Size = 'Size',
  LiquidationAndOraclePrice = 'LiquidationAndOraclePrice',
  Margin = 'Margin',
  UnrealizedPnl = 'UnrealizedPnl',
  RealizedPnl = 'RealizedPnl',
  AverageOpenAndClose = 'AverageOpenAndClose',
  NetFunding = 'NetFunding',
  Triggers = 'Triggers',
  Actions = 'Actions',
}

type PositionTableRow = {
  asset: Asset;
  oraclePrice: Nullable<number>;
  tickSizeDecimals: number;
  fundingRate: Nullable<number>;
  stopLossOrders: SubaccountOrder[];
  takeProfitOrders: SubaccountOrder[];
} & SubaccountPosition;

const getPositionsTableColumnDef = ({
  key,
  stringGetter,
  width,
  isAccountViewOnly,
  showClosePositionAction,
  shouldRenderTriggers,
  navigateToOrders,
  subaccount,
}: {
  key: PositionsTableColumnKey;
  subaccount: Subaccount | undefined;
  stringGetter: StringGetterFunction;
  width?: ColumnSize;
  isAccountViewOnly: boolean;
  showClosePositionAction: boolean;
  shouldRenderTriggers: boolean;
  navigateToOrders: (market: string) => void;
}) => ({
  width,
  ...(
    {
      [PositionsTableColumnKey.Details]: {
        columnKey: 'details',
        getCellValue: (row) => row.id,
        label: stringGetter({ key: STRING_KEYS.DETAILS }),
        renderCell: ({ asset, leverage, resources, size }) => (
          <TableCell stacked slotLeft={<$AssetIcon symbol={asset?.id} />}>
            <$HighlightOutput
              type={OutputType.Asset}
              value={size?.current}
              fractionDigits={TOKEN_DECIMALS}
              showSign={ShowSign.None}
              tag={asset?.id}
            />
            <$InlineRow>
              <$PositionSide>
                {resources.sideStringKey?.current &&
                  stringGetter({ key: resources.sideStringKey?.current })}
              </$PositionSide>
              <$SecondaryColor>@</$SecondaryColor>
              <$HighlightOutput
                type={OutputType.Multiple}
                value={leverage?.current}
                showSign={ShowSign.None}
              />
            </$InlineRow>
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.IndexEntry]: {
        columnKey: 'oracleEntry',
        getCellValue: (row) => row.entryPrice?.current,
        label: `${stringGetter({ key: STRING_KEYS.ORACLE_PRICE_ABBREVIATED })} / ${stringGetter({
          key: STRING_KEYS.ENTRY_PRICE_SHORT,
        })}`,
        hideOnBreakpoint: MediaQueryKeys.isNotTablet,
        renderCell: ({ entryPrice, oraclePrice, tickSizeDecimals }) => (
          <TableCell stacked>
            <Output type={OutputType.Fiat} value={oraclePrice} fractionDigits={tickSizeDecimals} />
            <Output
              type={OutputType.Fiat}
              value={entryPrice?.current}
              fractionDigits={tickSizeDecimals}
            />
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.PnL]: {
        columnKey: 'combinedPnl',
        getCellValue: (row) => row.unrealizedPnl?.current,
        label: stringGetter({ key: STRING_KEYS.PNL }),
        hideOnBreakpoint: MediaQueryKeys.isNotTablet,
        renderCell: ({ unrealizedPnl, unrealizedPnlPercent }) => (
          <TableCell stacked>
            <$OutputSigned
              sign={getNumberSign(unrealizedPnlPercent?.current)}
              type={OutputType.Percent}
              value={unrealizedPnlPercent?.current}
              showSign={ShowSign.None}
            />
            <$HighlightOutput
              isNegative={MustBigNumber(unrealizedPnl?.current).isNegative()}
              type={OutputType.Fiat}
              value={unrealizedPnl?.current}
              showSign={ShowSign.Both}
            />
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.Market]: {
        columnKey: 'market',
        getCellValue: (row) => row.id,
        label: stringGetter({ key: STRING_KEYS.MARKET }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        renderCell: ({ id, asset, leverage }) => (
          <MarketTableCell
            asset={asset}
            marketId={id}
            leverage={leverage?.current ?? undefined}
            isHighlighted
          />
        ),
      },
      [PositionsTableColumnKey.Size]: {
        columnKey: 'size',
        getCellValue: (row) => row.notionalTotal?.current,
        label: stringGetter({ key: STRING_KEYS.SIZE }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        renderCell: ({ assetId, size, notionalTotal, tickSizeDecimals }) => (
          <TableCell stacked>
            <$OutputSigned
              type={OutputType.Asset}
              value={size?.current}
              tag={assetId}
              showSign={ShowSign.Negative}
              sign={getNumberSign(size?.current)}
            />
            <Output
              type={OutputType.Fiat}
              value={notionalTotal?.current}
              fractionDigits={tickSizeDecimals}
            />
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.Margin]: {
        columnKey: 'margin',
        getCellValue: (row) => getPositionMargin({ position: row, subaccount }),
        label: stringGetter({ key: STRING_KEYS.MARGIN }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        isActionable: true,
        renderCell: (row) => <PositionsMarginCell position={row} subaccount={subaccount} />,
      },
      [PositionsTableColumnKey.NetFunding]: {
        columnKey: 'netFunding',
        getCellValue: (row) => row.netFunding,
        label: (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.FUNDING_PAYMENTS_SHORT })}</span>
            <span>{stringGetter({ key: STRING_KEYS.RATE })}</span>
          </TableColumnHeader>
        ),
        hideOnBreakpoint: MediaQueryKeys.isTablet,
        renderCell: ({ netFunding, fundingRate }) => (
          <TableCell stacked>
            <$OutputSigned
              sign={getNumberSign(netFunding)}
              type={OutputType.Fiat}
              value={netFunding}
            />
            <Output showSign={ShowSign.Negative} type={OutputType.Percent} value={fundingRate} />
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.LiquidationAndOraclePrice]: {
        columnKey: 'price',
        getCellValue: (row) => row.liquidationPrice?.current,
        label: (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.LIQUIDATION_PRICE_SHORT })}</span>
            <span>{stringGetter({ key: STRING_KEYS.ORACLE_PRICE_ABBREVIATED })}</span>
          </TableColumnHeader>
        ),
        renderCell: ({ liquidationPrice, oraclePrice, tickSizeDecimals }) => (
          <TableCell stacked>
            <Output
              type={OutputType.Fiat}
              value={liquidationPrice?.current}
              fractionDigits={tickSizeDecimals}
            />
            <Output type={OutputType.Fiat} value={oraclePrice} fractionDigits={tickSizeDecimals} />
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.UnrealizedPnl]: {
        columnKey: 'unrealizedPnl',
        getCellValue: (row) => row.unrealizedPnl?.current,
        label: stringGetter({ key: STRING_KEYS.UNREALIZED_PNL }),
        hideOnBreakpoint: MediaQueryKeys.isTablet,
        renderCell: ({ unrealizedPnl, unrealizedPnlPercent }) => (
          <TableCell stacked>
            <$OutputSigned
              sign={getNumberSign(unrealizedPnl?.current)}
              type={OutputType.Fiat}
              value={unrealizedPnl?.current}
            />
            <Output type={OutputType.Percent} value={unrealizedPnlPercent?.current} />
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.RealizedPnl]: {
        columnKey: 'realizedPnl',
        getCellValue: (row) => row.realizedPnl?.current,
        label: stringGetter({ key: STRING_KEYS.REALIZED_PNL }),
        hideOnBreakpoint: MediaQueryKeys.isTablet,
        renderCell: ({ realizedPnl, realizedPnlPercent }) => (
          <TableCell stacked>
            <$OutputSigned
              sign={getNumberSign(realizedPnl?.current)}
              type={OutputType.Fiat}
              value={realizedPnl?.current}
              showSign={ShowSign.Negative}
            />
            <Output type={OutputType.Percent} value={realizedPnlPercent?.current} />
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.AverageOpenAndClose]: {
        columnKey: 'entryExitPrice',
        getCellValue: (row) => row.entryPrice?.current,
        label: (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.AVERAGE_OPEN_SHORT })}</span>
            <span>{stringGetter({ key: STRING_KEYS.AVERAGE_CLOSE_SHORT })}</span>
          </TableColumnHeader>
        ),
        hideOnBreakpoint: MediaQueryKeys.isTablet,
        renderCell: ({ entryPrice, exitPrice, tickSizeDecimals }) => (
          <TableCell stacked>
            <Output
              type={OutputType.Fiat}
              value={entryPrice?.current}
              fractionDigits={tickSizeDecimals}
            />
            <Output type={OutputType.Fiat} value={exitPrice} fractionDigits={tickSizeDecimals} />
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.Triggers]: {
        columnKey: 'triggers',
        label: stringGetter({ key: STRING_KEYS.TRIGGERS }),
        isActionable: true,
        allowsSorting: false,
        hideOnBreakpoint: MediaQueryKeys.isTablet,
        renderCell: ({
          id,
          assetId,
          tickSizeDecimals,
          liquidationPrice,
          side,
          size,
          stopLossOrders,
          takeProfitOrders,
        }) => (
          <PositionsTriggersCell
            marketId={id}
            assetId={assetId}
            tickSizeDecimals={tickSizeDecimals}
            liquidationPrice={liquidationPrice?.current}
            stopLossOrders={stopLossOrders}
            takeProfitOrders={takeProfitOrders}
            positionSide={side.current}
            positionSize={size?.current}
            isDisabled={isAccountViewOnly}
            onViewOrdersClick={navigateToOrders}
          />
        ),
      },
      [PositionsTableColumnKey.Actions]: {
        columnKey: 'actions',
        label: stringGetter({
          key: showClosePositionAction ? STRING_KEYS.CLOSE : STRING_KEYS.ACTION,
        }),
        isActionable: true,
        allowsSorting: false,
        hideOnBreakpoint: MediaQueryKeys.isTablet,
        renderCell: ({ id }) => (
          <PositionsActionsCell
            marketId={id}
            isDisabled={isAccountViewOnly}
            showClosePositionAction={showClosePositionAction}
          />
        ),
      },
    } as Record<PositionsTableColumnKey, ColumnDef<PositionTableRow>>
  )[key],
});

type ElementProps = {
  columnKeys: PositionsTableColumnKey[];
  columnWidths?: Partial<Record<PositionsTableColumnKey, ColumnSize>>;
  currentRoute?: string;
  currentMarket?: string;
  showClosePositionAction: boolean;
  initialPageSize?: PageSize;
  onNavigate?: () => void;
  navigateToOrders: (market: string) => void;
};

type StyleProps = {
  withGradientCardRows?: boolean;
  withOuterBorder?: boolean;
};

export const PositionsTable = ({
  columnKeys,
  columnWidths,
  currentRoute,
  currentMarket,
  showClosePositionAction,
  initialPageSize,
  onNavigate,
  navigateToOrders,
  withGradientCardRows,
  withOuterBorder,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();
  const { isSlTpLimitOrdersEnabled } = useEnvFeatures();

  const isAccountViewOnly = useSelector(calculateIsAccountViewOnly);
  const perpetualMarkets = useSelector(getPerpetualMarkets, shallowEqual) || {};
  const subaccount = useSelector(getSubaccount, shallowEqual) ?? undefined;
  const assets = useSelector(getAssets, shallowEqual) || {};
  const shouldRenderTriggers = useSelector(calculateShouldRenderTriggersInPositionsTable);

  const openPositions = useSelector(getExistingOpenPositions, shallowEqual) || [];
  const marketPosition = openPositions.find((position) => position.id == currentMarket);
  const positions = currentMarket ? (marketPosition ? [marketPosition] : []) : openPositions;

  const { stopLossOrders: allStopLossOrders, takeProfitOrders: allTakeProfitOrders } = useSelector(
    getSubaccountConditionalOrders(isSlTpLimitOrdersEnabled),
    {
      equalityFn: (oldVal, newVal) => {
        return (
          shallowEqual(oldVal.stopLossOrders, newVal.stopLossOrders) &&
          shallowEqual(oldVal.takeProfitOrders, newVal.takeProfitOrders)
        );
      },
    }
  );

  const positionsData = useMemo(
    () =>
      positions.map((position: SubaccountPosition): PositionTableRow => {
        // object splat ... doesn't copy getter defined properties
        return Object.assign(
          {
            tickSizeDecimals:
              perpetualMarkets?.[position.id]?.configs?.tickSizeDecimals || USD_DECIMALS,
            asset: assets?.[position.assetId],
            oraclePrice: perpetualMarkets?.[position.id]?.oraclePrice,
            fundingRate: perpetualMarkets?.[position.id]?.perpetual?.nextFundingRate,
            stopLossOrders: allStopLossOrders.filter(
              (order: SubaccountOrder) => order.marketId === position.id
            ),
            takeProfitOrders: allTakeProfitOrders.filter(
              (order: SubaccountOrder) => order.marketId === position.id
            ),
          },
          position
        );
      }),
    [positions, perpetualMarkets, assets, allStopLossOrders, allTakeProfitOrders]
  );

  return (
    <$Table
      key={currentMarket ?? 'positions'}
      label="Positions"
      defaultSortDescriptor={{
        column: 'market',
        direction: 'ascending',
      }}
      data={positionsData}
      columns={columnKeys.map((key: PositionsTableColumnKey) =>
        getPositionsTableColumnDef({
          key,
          stringGetter,
          width: columnWidths?.[key],
          isAccountViewOnly,
          showClosePositionAction,
          shouldRenderTriggers,
          subaccount: subaccount,
          navigateToOrders,
        })
      )}
      getRowKey={(row: PositionTableRow) => row.id}
      onRowAction={
        currentMarket
          ? undefined
          : (market: Key) => {
              navigate(`${AppRoute.Trade}/${market}`, {
                state: { from: currentRoute },
              });
              onNavigate?.();
            }
      }
      getRowAttributes={(row: PositionTableRow) => ({
        'data-side': row.side.current,
      })}
      slotEmpty={
        <>
          <$Icon iconName={IconName.Positions} />
          <h4>{stringGetter({ key: STRING_KEYS.POSITIONS_EMPTY_STATE })}</h4>
        </>
      }
      initialPageSize={initialPageSize}
      withGradientCardRows={withGradientCardRows}
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

  tr {
    &:after {
      content: '';
    }
  }

  tbody tr {
    overflow: hidden;
    position: relative;

    &[data-side='${PositionSide.Long}'] {
      --side-color: var(--color-positive);
      --table-row-gradient-to-color: var(--color-gradient-positive);
    }

    &[data-side='${PositionSide.Short}'] {
      --side-color: var(--color-negative);
      --table-row-gradient-to-color: var(--color-gradient-negative);
    }
  }
` as typeof Table;

const $InlineRow = styled.div`
  ${layoutMixins.inlineRow}
`;

const $AssetIcon = styled(AssetIcon)`
  ${layoutMixins.inlineRow}
  min-width: unset;
  font-size: 2.25rem;
`;

const $SecondaryColor = styled.span`
  color: var(--color-text-0);
`;

const $OutputSigned = styled(Output)<{ sign: NumberSign }>`
  color: ${({ sign }) =>
    ({
      [NumberSign.Positive]: `var(--color-positive)`,
      [NumberSign.Negative]: `var(--color-negative)`,
      [NumberSign.Neutral]: `var(--color-text-2)`,
    }[sign])};
`;

const $HighlightOutput = styled(Output)<{ isNegative?: boolean }>`
  color: var(--color-text-1);
  --secondary-item-color: currentColor;
  --output-sign-color: ${({ isNegative }) =>
    isNegative !== undefined
      ? isNegative
        ? `var(--color-negative)`
        : `var(--color-positive)`
      : `currentColor`};
`;

const $PositionSide = styled.span`
  && {
    color: var(--side-color);
  }
`;

const $Icon = styled(Icon)`
  font-size: 3em;
`;
