import { forwardRef, useMemo } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import {
  PerpetualMarketSummary,
  SubaccountOrder,
  SubaccountPosition,
} from '@/bonsai/types/summaryTypes';
import { Separator } from '@radix-ui/react-separator';
import type { ColumnSize } from '@react-types/table';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { STRING_KEYS, StringGetterFunction } from '@/constants/localization';
import { NumberSign, TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { EMPTY_ARR } from '@/constants/objects';
import { AppRoute } from '@/constants/routes';
import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { MediaQueryKeys, useBreakpoints } from '@/hooks/useBreakpoints';
import { useEnvFeatures } from '@/hooks/useEnvFeatures';
import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { ColumnDef, Table } from '@/components/Table';
import { MarketSummaryTableCell } from '@/components/Table/MarketTableCell';
import { TableCell } from '@/components/Table/TableCell';
import { TableColumnHeader } from '@/components/Table/TableColumnHeader';
import { PageSize } from '@/components/Table/TablePaginationRow';
import { Tag } from '@/components/Tag';
import { marginModeMatchesFilter, MarketTypeFilter } from '@/pages/trade/types';

import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { getSubaccountConditionalOrders } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { getNumberSign, MaybeBigNumber, MaybeNumber, MustBigNumber } from '@/lib/numbers';
import { safeAssign } from '@/lib/objectHelpers';
import { orEmptyRecord } from '@/lib/typeUtils';

import { CloseAllPositionsButton } from './PositionsTable/CloseAllPositionsButton';
import { PositionsActionsCell } from './PositionsTable/PositionsActionsCell';
import { PositionsMarginCell } from './PositionsTable/PositionsMarginCell';
import { PositionsTriggersCell } from './PositionsTable/PositionsTriggersCell';
import { getIndexerPositionSideStringKey, getMarginModeStringKey } from './enumToStringKeyHelpers';

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
}

type PositionTableRow = {
  marketSummary: PerpetualMarketSummary | undefined;
  stopLossOrders: SubaccountOrder[];
  takeProfitOrders: SubaccountOrder[];
  stepSizeDecimals: number;
  tickSizeDecimals: number;
  oraclePrice: number | undefined;
} & SubaccountPosition;

const getPositionsTableColumnDef = ({
  key,
  stringGetter,
  width,
  isAccountViewOnly,
  showClosePositionAction,
  navigateToOrders,
  isSinglePosition,
  isTablet,
}: {
  key: PositionsTableColumnKey;
  stringGetter: StringGetterFunction;
  width?: ColumnSize;
  isAccountViewOnly: boolean;
  showClosePositionAction: boolean;
  navigateToOrders: (market: string) => void;
  isSinglePosition: boolean;
  isTablet: boolean;
}) => ({
  width,
  ...(
    {
      [PositionsTableColumnKey.Details]: {
        columnKey: 'details',
        getCellValue: (row) => row.uniqueId,
        label: stringGetter({ key: STRING_KEYS.DETAILS }),
        renderCell: ({ marketSummary, leverage, signedSize, side }) => (
          <TableCell
            stacked
            slotLeft={
              <AssetIcon
                logoUrl={marketSummary?.logo}
                symbol={marketSummary?.assetId}
                tw="inlineRow min-w-[unset] [--asset-icon-size:2.25rem]"
              />
            }
          >
            <$HighlightOutput
              type={OutputType.Asset}
              value={signedSize}
              fractionDigits={TOKEN_DECIMALS}
              showSign={ShowSign.None}
              tag={marketSummary?.displayableAsset}
            />
            <div tw="inlineRow">
              <$PositionSide>
                {stringGetter({ key: getIndexerPositionSideStringKey(side) })}
              </$PositionSide>
              <span tw="text-color-text-0">@</span>
              <$HighlightOutput
                type={OutputType.Multiple}
                value={leverage}
                showSign={ShowSign.None}
              />
            </div>
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.IndexEntry]: {
        columnKey: 'oracleEntry',
        getCellValue: (row) => row.entryPrice.toNumber(),
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
            <Output
              withSubscript
              type={OutputType.Fiat}
              value={oraclePrice}
              fractionDigits={tickSizeDecimals}
            />
            <Output
              withSubscript
              type={OutputType.Fiat}
              value={entryPrice}
              fractionDigits={tickSizeDecimals}
            />
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.PnL]: {
        columnKey: 'combinedPnl',
        getCellValue: (row) => row.updatedUnrealizedPnl.toNumber(),
        label: stringGetter({ key: STRING_KEYS.PNL }),
        renderCell: ({ updatedUnrealizedPnl, updatedUnrealizedPnlPercent }) => {
          return !isTablet ? (
            <TableCell>
              <$OutputSigned
                sign={getNumberSign(updatedUnrealizedPnl)}
                type={OutputType.Fiat}
                value={updatedUnrealizedPnl}
                showSign={ShowSign.Negative}
              />
              <$OutputSigned
                sign={getNumberSign(updatedUnrealizedPnl)}
                type={OutputType.Percent}
                value={updatedUnrealizedPnlPercent}
                showSign={ShowSign.Negative}
                fractionDigits={0}
                withParentheses
              />
            </TableCell>
          ) : (
            <TableCell stacked>
              <$OutputSigned
                sign={getNumberSign(updatedUnrealizedPnlPercent)}
                type={OutputType.Percent}
                value={updatedUnrealizedPnlPercent}
                showSign={ShowSign.None}
              />
              <$HighlightOutput
                isNegative={MustBigNumber(updatedUnrealizedPnl).isNegative()}
                type={OutputType.Fiat}
                value={updatedUnrealizedPnl}
                showSign={ShowSign.Both}
              />
            </TableCell>
          );
        },
      },
      [PositionsTableColumnKey.Market]: {
        columnKey: 'market',
        getCellValue: (row) => row.marketSummary?.displayableTicker,
        label: stringGetter({ key: STRING_KEYS.MARKET }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        renderCell: ({ marketSummary }) => {
          return <MarketSummaryTableCell marketSummary={marketSummary} />;
        },
      },
      [PositionsTableColumnKey.Leverage]: {
        columnKey: 'leverage',
        getCellValue: (row) => row.leverage?.toNumber(),
        label: stringGetter({ key: STRING_KEYS.LEVERAGE }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        renderCell: ({ leverage }) => (
          <TableCell>
            <Output type={OutputType.Multiple} value={leverage} showSign={ShowSign.None} />
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.Type]: {
        columnKey: 'type',
        getCellValue: (row) => row.marginMode,
        label: stringGetter({ key: STRING_KEYS.TYPE }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        renderCell: ({ marginMode }) => (
          <TableCell>
            <Tag>{stringGetter({ key: getMarginModeStringKey(marginMode) })}</Tag>
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.Size]: {
        columnKey: 'size',
        getCellValue: (row) => {
          return row.signedSize.toNumber();
        },
        label: stringGetter({ key: STRING_KEYS.SIZE }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        renderCell: ({ signedSize, stepSizeDecimals }) => {
          return (
            <TableCell>
              <$OutputSigned
                type={OutputType.Asset}
                value={signedSize}
                showSign={ShowSign.Negative}
                sign={getNumberSign(signedSize)}
                fractionDigits={stepSizeDecimals}
              />
            </TableCell>
          );
        },
      },
      [PositionsTableColumnKey.Value]: {
        columnKey: 'value',
        getCellValue: (row) => row.notional.toNumber(),
        label: stringGetter({ key: STRING_KEYS.VALUE }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        renderCell: ({ notional }) => {
          return (
            <TableCell>
              <Output type={OutputType.Fiat} value={notional} />
            </TableCell>
          );
        },
      },
      [PositionsTableColumnKey.Margin]: {
        columnKey: 'margin',
        getCellValue: (row) => row.marginValueInitial.toNumber(),
        label: stringGetter({ key: STRING_KEYS.MARGIN }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        isActionable: true,
        renderCell: (row) => <PositionsMarginCell position={row} />,
      },
      [PositionsTableColumnKey.AverageOpen]: {
        columnKey: 'averageOpen',
        getCellValue: (row) => row.entryPrice.toNumber(),
        label: stringGetter({ key: STRING_KEYS.AVG_OPEN }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        isActionable: true,
        renderCell: ({ entryPrice, tickSizeDecimals }) => (
          <TableCell>
            <Output
              withSubscript
              type={OutputType.Fiat}
              value={entryPrice}
              fractionDigits={tickSizeDecimals}
            />
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.Oracle]: {
        columnKey: 'oracle',
        getCellValue: (row) => row.oraclePrice,
        label: stringGetter({ key: STRING_KEYS.ORACLE_PRICE_ABBREVIATED }),
        renderCell: ({ oraclePrice, tickSizeDecimals }) => (
          <TableCell>
            <Output
              withSubscript
              type={OutputType.Fiat}
              value={oraclePrice}
              fractionDigits={tickSizeDecimals}
            />
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.Liquidation]: {
        columnKey: 'liquidation',
        getCellValue: (row) => row.liquidationPrice?.toNumber(),
        label: stringGetter({ key: STRING_KEYS.LIQUIDATION }),
        renderCell: ({ liquidationPrice, tickSizeDecimals }) => (
          <TableCell>
            <Output
              withSubscript
              type={OutputType.Fiat}
              value={liquidationPrice}
              fractionDigits={tickSizeDecimals}
            />
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.NetFunding]: {
        columnKey: 'netFunding',
        getCellValue: (row) => row.netFunding.toNumber(),
        label: stringGetter({ key: STRING_KEYS.FUNDING_PAYMENTS_SHORT }),
        hideOnBreakpoint: MediaQueryKeys.isTablet,
        renderCell: ({ netFunding }) => {
          return (
            <TableCell>
              <$OutputSigned
                sign={getNumberSign(netFunding)}
                type={OutputType.Fiat}
                value={netFunding}
                showSign={ShowSign.Negative}
              />
            </TableCell>
          );
        },
      },
      [PositionsTableColumnKey.Triggers]: {
        columnKey: 'triggers',
        label: (
          <$TriggersContainer tw="flex gap-[0.75em] pr-[2.75em]">
            <$TriggerLabel>TP</$TriggerLabel> <$VerticalSeparator />
            <$TriggerLabel>SL</$TriggerLabel>
          </$TriggersContainer>
        ),
        isActionable: true,
        allowsSorting: false,
        hideOnBreakpoint: MediaQueryKeys.isTablet,
        align: 'center',
        renderCell: ({
          market,
          assetId,
          tickSizeDecimals,
          liquidationPrice,
          side,
          signedSize,
          stopLossOrders,
          takeProfitOrders,
          uniqueId,
        }) => {
          return (
            <PositionsTriggersCell
              marketId={market}
              positionUniqueId={uniqueId}
              assetId={assetId}
              tickSizeDecimals={tickSizeDecimals}
              liquidationPrice={liquidationPrice}
              stopLossOrders={stopLossOrders}
              takeProfitOrders={takeProfitOrders}
              positionSide={side}
              positionSize={signedSize}
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
          market,
          marketSummary,
          assetId,
          leverage,
          side,
          entryPrice,
          unrealizedPnl,
        }) => (
          <PositionsActionsCell
            marketId={market}
            assetId={assetId}
            side={side}
            leverage={leverage}
            oraclePrice={MaybeBigNumber(marketSummary?.oraclePrice)}
            entryPrice={entryPrice}
            unrealizedPnl={unrealizedPnl}
            sideLabel={stringGetter({ key: getIndexerPositionSideStringKey(side) })}
            isDisabled={isAccountViewOnly}
            showClosePositionAction={showClosePositionAction}
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

export const PositionsTable = forwardRef(
  (
    {
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
    }: ElementProps & StyleProps,
    _ref
  ) => {
    const stringGetter = useStringGetter();
    const navigate = useNavigate();
    const { isSlTpLimitOrdersEnabled } = useEnvFeatures();
    const { isTablet } = useBreakpoints();

    // todo this uses the old subaccount id for now
    const isAccountViewOnly = useAppSelector(calculateIsAccountViewOnly);
    const marketSummaries = orEmptyRecord(useAppSelector(BonsaiCore.markets.markets.data));

    const openPositions =
      useAppSelector(BonsaiCore.account.parentSubaccountPositions.data) ?? EMPTY_ARR;

    const positions = useMemo(() => {
      return openPositions.filter((position) => {
        const matchesMarket = currentMarket == null || position.market === currentMarket;
        const marginType = position.marginMode;
        const matchesType = marginModeMatchesFilter(marginType, marketTypeFilter);
        return matchesMarket && matchesType;
      });
    }, [currentMarket, marketTypeFilter, openPositions]);

    const tpslOrdersByPositionUniqueId = useParameterizedSelector(
      getSubaccountConditionalOrders,
      isSlTpLimitOrdersEnabled
    );

    const positionsData = useMemo(
      () =>
        positions.map((position: SubaccountPosition): PositionTableRow => {
          const marketSummary = marketSummaries[position.market];
          return safeAssign(
            {},
            {
              marketSummary,
              stopLossOrders:
                tpslOrdersByPositionUniqueId[position.uniqueId]?.stopLossOrders ?? EMPTY_ARR,
              takeProfitOrders:
                tpslOrdersByPositionUniqueId[position.uniqueId]?.takeProfitOrders ?? EMPTY_ARR,
              stepSizeDecimals: marketSummary?.stepSizeDecimals ?? TOKEN_DECIMALS,
              tickSizeDecimals: marketSummary?.tickSizeDecimals ?? USD_DECIMALS,
              oraclePrice: MaybeNumber(marketSummary?.oraclePrice) ?? undefined,
            },
            position
          );
        }),
      [positions, tpslOrdersByPositionUniqueId, marketSummaries]
    );

    return (
      <$Table
        key={currentMarket ?? 'positions'}
        label={stringGetter({ key: STRING_KEYS.POSITIONS })}
        data={positionsData}
        tableId="positions"
        columns={columnKeys.map((key: PositionsTableColumnKey) =>
          getPositionsTableColumnDef({
            key,
            stringGetter,
            width: columnWidths?.[key],
            isAccountViewOnly,
            showClosePositionAction,
            navigateToOrders,
            isSinglePosition: positionsData.length === 1,
            isTablet,
          })
        )}
        getRowKey={(row: PositionTableRow) => row.uniqueId}
        onRowAction={
          currentMarket
            ? undefined
            : (id, row) => {
                navigate(`${AppRoute.Trade}/${row.market}`, {
                  state: { from: currentRoute },
                });
                onNavigate?.();
              }
        }
        getRowAttributes={(row: PositionTableRow) => ({
          'data-side': row.side,
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
  }
);

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

    &[data-side='${IndexerPositionSide.LONG}'] {
      --side-color: var(--color-positive);
      --table-row-gradient-to-color: var(--color-gradient-positive);
    }

    &[data-side='${IndexerPositionSide.SHORT}'] {
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
