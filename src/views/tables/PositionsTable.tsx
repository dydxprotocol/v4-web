import { Key, useMemo } from 'react';

import { Separator } from '@radix-ui/react-separator';
import type { ColumnSize } from '@react-types/table';
import { shallowEqual } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import {
  type Asset,
  type Nullable,
  type SubaccountOrder,
  type SubaccountPosition,
} from '@/constants/abacus';
import { STRING_KEYS, StringGetterFunction } from '@/constants/localization';
import { NumberSign, TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { EMPTY_ARR } from '@/constants/objects';
import { AppRoute } from '@/constants/routes';
import { PositionSide } from '@/constants/trade';

import { MediaQueryKeys, useBreakpoints } from '@/hooks/useBreakpoints';
import { useEnvFeatures } from '@/hooks/useEnvFeatures';
import { useStringGetter } from '@/hooks/useStringGetter';

import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { ColumnDef, Table } from '@/components/Table';
import { MarketTableCell } from '@/components/Table/MarketTableCell';
import { TableCell } from '@/components/Table/TableCell';
import { TableColumnHeader } from '@/components/Table/TableColumnHeader';
import { PageSize } from '@/components/Table/TablePaginationRow';
import { Tag } from '@/components/Tag';
import { MarketTypeFilter, marketTypeMatchesFilter } from '@/pages/trade/types';

import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { getExistingOpenPositions, getSubaccountConditionalOrders } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getAssets } from '@/state/assetsSelectors';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { MustBigNumber, getNumberSign } from '@/lib/numbers';
import { safeAssign } from '@/lib/objectHelpers';
import { testFlags } from '@/lib/testFlags';
import { getMarginModeFromSubaccountNumber, getPositionMargin } from '@/lib/tradeData';
import { orEmptyRecord } from '@/lib/typeUtils';

import { CloseAllPositionsButton } from './PositionsTable/CloseAllPositionsButton';
import { PositionsActionsCell } from './PositionsTable/PositionsActionsCell';
import { PositionsMarginCell } from './PositionsTable/PositionsMarginCell';
import { PositionsTriggersCell } from './PositionsTable/PositionsTriggersCell';
import { PositionsTriggersCellDeprecated } from './PositionsTable/PositionsTriggersCellDeprecated';

export enum PositionsTableColumnKey {
  Details = 'Details',
  IndexEntry = 'IndexEntry',

  Market = 'Market',
  Leverage = 'Leverage',
  Type = 'Type',
  Size = 'Size',
  Value = 'Value',
  PnL = 'PnL',
  Margin = 'Margin',
  AverageOpen = 'AverageOpen',
  Oracle = 'Oracle',
  Liquidation = 'Liquidation',
  Triggers = 'Triggers',
  NetFunding = 'NetFunding',
  Actions = 'Actions',

  // TODO: CT-1292 remove deprecated fields
  LiquidationAndOraclePrice = 'LiquidationAndOraclePrice',
  RealizedPnl = 'RealizedPnl',
  UnrealizedPnl = 'UnrealizedPnl',
  AverageOpenAndClose = 'AverageOpenAndClose',
}

type PositionTableRow = {
  asset: Asset | undefined;
  oraclePrice: Nullable<number>;
  tickSizeDecimals: number;
  fundingRate: Nullable<number>;
  stopLossOrders: SubaccountOrder[];
  takeProfitOrders: SubaccountOrder[];
  stepSizeDecimals: number;
} & SubaccountPosition;

const getPositionsTableColumnDef = ({
  key,
  stringGetter,
  width,
  isAccountViewOnly,
  showClosePositionAction,
  navigateToOrders,
  isSinglePosition,
  uiRefresh,
  isTablet,
}: {
  key: PositionsTableColumnKey;
  stringGetter: StringGetterFunction;
  width?: ColumnSize;
  isAccountViewOnly: boolean;
  showClosePositionAction: boolean;
  navigateToOrders: (market: string) => void;
  isSinglePosition: boolean;
  uiRefresh: boolean;
  isTablet: boolean;
}) => ({
  width,
  ...(
    {
      [PositionsTableColumnKey.Details]: {
        columnKey: 'details',
        getCellValue: (row) => row.id,
        label: stringGetter({ key: STRING_KEYS.DETAILS }),
        renderCell: ({ asset, leverage, resources, size }) => (
          <TableCell
            stacked
            slotLeft={
              <AssetIcon
                logoUrl={asset?.resources?.imageUrl}
                symbol={asset?.id}
                tw="inlineRow min-w-[unset] text-[2.25rem]"
              />
            }
          >
            <$HighlightOutput
              type={OutputType.Asset}
              value={size?.current}
              fractionDigits={TOKEN_DECIMALS}
              showSign={ShowSign.None}
              tag={asset?.id}
            />
            <div tw="inlineRow">
              <$PositionSide>
                {resources.sideStringKey?.current &&
                  stringGetter({ key: resources.sideStringKey?.current })}
              </$PositionSide>
              <span tw="text-color-text-0">@</span>
              <$HighlightOutput
                type={OutputType.Multiple}
                value={leverage?.current}
                showSign={ShowSign.None}
              />
            </div>
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.IndexEntry]: {
        columnKey: 'oracleEntry',
        getCellValue: (row) => row.entryPrice?.current,
        label: (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.ORACLE_PRICE_ABBREVIATED })}</span>
            <span>
              {stringGetter({
                key: STRING_KEYS.ENTRY_PRICE_SHORT,
              })}
            </span>
          </TableColumnHeader>
        ),
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
        hideOnBreakpoint: uiRefresh ? undefined : MediaQueryKeys.isNotTablet,
        renderCell: ({ unrealizedPnl, unrealizedPnlPercent }) => {
          return uiRefresh && !isTablet ? (
            <TableCell>
              <$OutputSigned
                sign={getNumberSign(unrealizedPnl?.current)}
                type={OutputType.Fiat}
                value={unrealizedPnl?.current}
                showSign={ShowSign.None}
              />
            </TableCell>
          ) : (
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
          );
        },
      },
      [PositionsTableColumnKey.Market]: {
        columnKey: 'market',
        getCellValue: (row) => row.displayId,
        label: stringGetter({ key: STRING_KEYS.MARKET }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        renderCell: ({ displayId, asset, leverage }) => {
          return (
            <MarketTableCell
              asset={asset}
              marketId={displayId}
              leverage={leverage?.current ?? undefined}
              isHighlighted
            />
          );
        },
      },
      [PositionsTableColumnKey.Leverage]: {
        columnKey: 'leverage',
        getCellValue: (row) => row.leverage?.current,
        label: stringGetter({ key: STRING_KEYS.LEVERAGE }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        renderCell: ({ leverage }) => (
          <TableCell>
            <Output type={OutputType.Multiple} value={leverage.current} showSign={ShowSign.None} />
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.Type]: {
        columnKey: 'type',
        getCellValue: (row) => getMarginModeFromSubaccountNumber(row.childSubaccountNumber).name,
        label: stringGetter({ key: STRING_KEYS.TYPE }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        renderCell: ({ childSubaccountNumber }) => (
          <TableCell>
            <Tag>{getMarginModeFromSubaccountNumber(childSubaccountNumber).name}</Tag>
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.Size]: {
        columnKey: 'size',
        getCellValue: (row) => {
          return uiRefresh ? row.size?.current : row.notionalTotal?.current;
        },
        label: stringGetter({ key: STRING_KEYS.SIZE }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        renderCell: ({ assetId, size, notionalTotal, stepSizeDecimals }) => {
          return uiRefresh ? (
            <TableCell>
              <$OutputSigned
                type={OutputType.Asset}
                value={size?.current}
                showSign={ShowSign.Negative}
                sign={getNumberSign(size?.current)}
                fractionDigits={stepSizeDecimals}
              />
            </TableCell>
          ) : (
            <TableCell stacked>
              <$OutputSigned
                type={OutputType.Asset}
                value={size?.current}
                tag={getDisplayableAssetFromBaseAsset(assetId)}
                showSign={ShowSign.Negative}
                sign={getNumberSign(size?.current)}
                fractionDigits={stepSizeDecimals}
              />
              <Output type={OutputType.Fiat} value={notionalTotal?.current} />
            </TableCell>
          );
        },
      },
      [PositionsTableColumnKey.Value]: {
        columnKey: 'value',
        getCellValue: (row) => row.notionalTotal?.current,
        label: stringGetter({ key: STRING_KEYS.VALUE }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        renderCell: ({ displayId, asset, leverage, notionalTotal }) => {
          return uiRefresh ? (
            <TableCell>
              <Output type={OutputType.Fiat} value={notionalTotal?.current} />
            </TableCell>
          ) : (
            <MarketTableCell
              asset={asset}
              marketId={displayId}
              leverage={leverage?.current ?? undefined}
              isHighlighted
            />
          );
        },
      },
      [PositionsTableColumnKey.Margin]: {
        columnKey: 'margin',
        getCellValue: (row) => getPositionMargin({ position: row }),
        label: stringGetter({ key: STRING_KEYS.MARGIN }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        isActionable: true,
        renderCell: (row) => <PositionsMarginCell position={row} />,
      },
      [PositionsTableColumnKey.AverageOpen]: {
        columnKey: 'averageOpen',
        getCellValue: (row) => row.entryPrice?.current,
        label: stringGetter({ key: STRING_KEYS.AVG_OPEN }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        isActionable: true,
        renderCell: ({ entryPrice, tickSizeDecimals }) => (
          <TableCell>
            <Output
              type={OutputType.Fiat}
              value={entryPrice?.current}
              fractionDigits={tickSizeDecimals}
            />
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.Oracle]: {
        columnKey: 'oracle',
        getCellValue: (row) => row.oraclePrice,
        label: stringGetter({ key: STRING_KEYS.ORACLE_PRICE_ABBREVIATED }),
        renderCell: ({ liquidationPrice, oraclePrice, tickSizeDecimals }) => (
          <TableCell stacked={!uiRefresh}>
            {!uiRefresh && (
              <Output
                type={OutputType.Fiat}
                value={liquidationPrice?.current}
                fractionDigits={tickSizeDecimals}
              />
            )}
            <Output type={OutputType.Fiat} value={oraclePrice} fractionDigits={tickSizeDecimals} />
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.Liquidation]: {
        columnKey: 'liquidation',
        getCellValue: (row) => row.liquidationPrice?.current,
        label: stringGetter({ key: STRING_KEYS.LIQUIDATION }),
        renderCell: ({ liquidationPrice, oraclePrice, tickSizeDecimals }) => (
          <TableCell stacked={!uiRefresh}>
            <Output
              type={OutputType.Fiat}
              value={liquidationPrice?.current}
              fractionDigits={tickSizeDecimals}
            />
            {!uiRefresh && (
              <Output
                type={OutputType.Fiat}
                value={oraclePrice}
                fractionDigits={tickSizeDecimals}
              />
            )}
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.NetFunding]: {
        columnKey: 'netFunding',
        getCellValue: (row) => row.netFunding,
        label: uiRefresh ? (
          stringGetter({ key: STRING_KEYS.FUNDING_PAYMENTS_SHORT })
        ) : (
          <TableColumnHeader>
            <span>{stringGetter({ key: STRING_KEYS.FUNDING_PAYMENTS_SHORT })}</span>
            <span>{stringGetter({ key: STRING_KEYS.RATE })}</span>
          </TableColumnHeader>
        ),
        hideOnBreakpoint: MediaQueryKeys.isTablet,
        renderCell: ({ netFunding, fundingRate }) => {
          return uiRefresh ? (
            <TableCell>
              <Output type={OutputType.Fiat} value={netFunding} />
            </TableCell>
          ) : (
            <TableCell stacked>
              <$OutputSigned
                sign={getNumberSign(netFunding)}
                type={OutputType.Fiat}
                value={netFunding}
              />
              <Output showSign={ShowSign.Negative} type={OutputType.Percent} value={fundingRate} />
            </TableCell>
          );
        },
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
        label: uiRefresh ? (
          <$TriggersContainer tw="flex gap-[0.75em] pr-[2.75em]">
            <$TriggerLabel>TP</$TriggerLabel> <$VerticalSeparator />
            <$TriggerLabel>SL</$TriggerLabel>
          </$TriggersContainer>
        ) : (
          stringGetter({ key: STRING_KEYS.TRIGGERS })
        ),
        isActionable: true,
        allowsSorting: false,
        hideOnBreakpoint: MediaQueryKeys.isTablet,
        align: uiRefresh ? 'center' : undefined,
        renderCell: ({
          id,
          assetId,
          tickSizeDecimals,
          liquidationPrice,
          side,
          size,
          stopLossOrders,
          takeProfitOrders,
        }) => {
          return uiRefresh ? (
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
          ) : (
            <PositionsTriggersCellDeprecated
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
          );
        },
      },
      [PositionsTableColumnKey.Actions]: {
        columnKey: 'actions',
        label: showClosePositionAction && !isSinglePosition ? <CloseAllPositionsButton /> : '',
        isActionable: true,
        allowsSorting: false,
        hideOnBreakpoint: MediaQueryKeys.isTablet,
        renderCell: ({
          id,
          assetId,
          stopLossOrders,
          leverage,
          side,
          oraclePrice,
          entryPrice,
          takeProfitOrders,
          unrealizedPnl,
          resources,
        }) => (
          <PositionsActionsCell
            marketId={id}
            assetId={assetId}
            side={side.current}
            leverage={leverage.current}
            oraclePrice={oraclePrice}
            entryPrice={entryPrice.current}
            unrealizedPnl={unrealizedPnl?.current}
            sideLabel={
              resources.sideStringKey?.current &&
              stringGetter({ key: resources.sideStringKey?.current })
            }
            isDisabled={isAccountViewOnly}
            showClosePositionAction={showClosePositionAction}
            stopLossOrders={stopLossOrders}
            takeProfitOrders={takeProfitOrders}
            navigateToMarketOrders={navigateToOrders}
          />
        ),
      },
    } satisfies Record<PositionsTableColumnKey, ColumnDef<PositionTableRow>>
  )[key],
});

type ElementProps = {
  columnKeys: PositionsTableColumnKey[];
  columnWidths?: Partial<Record<PositionsTableColumnKey, ColumnSize>>;
  currentRoute?: string;
  currentMarket?: string;
  marketTypeFilter?: MarketTypeFilter;
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
  marketTypeFilter,
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
  const { uiRefresh } = testFlags;
  const { isTablet } = useBreakpoints();

  const isAccountViewOnly = useAppSelector(calculateIsAccountViewOnly);
  const perpetualMarkets = orEmptyRecord(useAppSelector(getPerpetualMarkets, shallowEqual));
  const assets = orEmptyRecord(useAppSelector(getAssets, shallowEqual));

  const openPositions = useAppSelector(getExistingOpenPositions, shallowEqual) ?? EMPTY_ARR;
  const positions = useMemo(() => {
    return openPositions.filter((position) => {
      const matchesMarket = currentMarket == null || position.id === currentMarket;
      const subaccountNumber = position.childSubaccountNumber;
      const marginType = getMarginModeFromSubaccountNumber(subaccountNumber).name;
      const matchesType = marketTypeMatchesFilter(marginType, marketTypeFilter);
      return matchesMarket && matchesType;
    });
  }, [currentMarket, marketTypeFilter, openPositions]);

  const conditionalOrderSelector = useMemo(getSubaccountConditionalOrders, []);
  const { stopLossOrders: allStopLossOrders, takeProfitOrders: allTakeProfitOrders } =
    useAppSelector((s) => conditionalOrderSelector(s, isSlTpLimitOrdersEnabled), {
      equalityFn: (oldVal, newVal) => {
        return (
          shallowEqual(oldVal.stopLossOrders, newVal.stopLossOrders) &&
          shallowEqual(oldVal.takeProfitOrders, newVal.takeProfitOrders)
        );
      },
    });

  const positionsData = useMemo(
    () =>
      positions.map((position: SubaccountPosition): PositionTableRow => {
        return safeAssign(
          {},
          {
            tickSizeDecimals:
              perpetualMarkets?.[position.id]?.configs?.tickSizeDecimals ?? USD_DECIMALS,
            asset: assets?.[position.assetId],
            oraclePrice: perpetualMarkets?.[position.id]?.oraclePrice,
            fundingRate: perpetualMarkets?.[position.id]?.perpetual?.nextFundingRate,
            stopLossOrders: allStopLossOrders.filter(
              (order: SubaccountOrder) => order.marketId === position.id
            ),
            takeProfitOrders: allTakeProfitOrders.filter(
              (order: SubaccountOrder) => order.marketId === position.id
            ),
            stepSizeDecimals:
              perpetualMarkets?.[position.id]?.configs?.stepSizeDecimals ?? TOKEN_DECIMALS,
          },
          position
        );
      }),
    [positions, perpetualMarkets, assets, allStopLossOrders, allTakeProfitOrders]
  );

  return (
    <$Table
      key={currentMarket ?? 'positions'}
      label={stringGetter({ key: STRING_KEYS.POSITIONS })}
      data={positionsData}
      columns={columnKeys.map((key: PositionsTableColumnKey) =>
        getPositionsTableColumnDef({
          key,
          stringGetter,
          width: columnWidths?.[key],
          isAccountViewOnly,
          showClosePositionAction,
          navigateToOrders,
          isSinglePosition: positionsData.length === 1,
          uiRefresh,
          isTablet,
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
          <Icon iconName={IconName.Positions} tw="text-[3em]" />
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

const $OutputSigned = styled(Output)<{ sign: NumberSign }>`
  color: ${({ sign }) =>
    ({
      [NumberSign.Positive]: `var(--color-positive)`,
      [NumberSign.Negative]: `var(--color-negative)`,
      [NumberSign.Neutral]: `var(--color-text-2)`,
    })[sign]};
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

const $TriggersContainer = styled.div`
  font: var(--font-small-book);
`;

const $TriggerLabel = styled(Tag)`
  background-color: transparent;
  border: var(--border);
  color: var(--tableStickyRow-textColor, var(--color-text-0));
`;

const $VerticalSeparator = styled(Separator)`
  border-right: solid var(--border-width) var(--color-border);
`;
