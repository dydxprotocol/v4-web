import { useMemo } from 'react';

import type { ColumnSize } from '@react-types/table';
import { useSelector, shallowEqual } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { type AnyStyledComponent } from 'styled-components';

import {
  type Asset,
  type Nullable,
  type SubaccountOrder,
  type SubaccountPosition,
  POSITION_SIDES,
} from '@/constants/abacus';
import { StringGetterFunction, STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { AppRoute } from '@/constants/routes';
import { PositionSide } from '@/constants/trade';

import { useStringGetter } from '@/hooks';
import { MediaQueryKeys } from '@/hooks/useBreakpoints';

import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { PositionSideTag } from '@/components/PositionSideTag';
import { type ColumnDef, Table, TableColumnHeader } from '@/components/Table';
import { MarketTableCell } from '@/components/Table/MarketTableCell';
import { TableCell } from '@/components/Table/TableCell';
import { TagSize } from '@/components/Tag';

import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { getExistingOpenPositions, getSubaccountConditionalOrders } from '@/state/accountSelectors';
import { getAssets } from '@/state/assetsSelectors';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

import { MustBigNumber } from '@/lib/numbers';

import { PositionsActionsCell } from './PositionsTable/PositionsActionsCell';
import { PositionsMarginCell } from './PositionsTable/PositionsMarginCell';
import { PositionsTriggersCell } from './PositionsTable/PositionsTriggersCell';

export enum PositionsTableColumnKey {
  Details = 'Details',
  IndexEntry = 'IndexEntry',
  PnL = 'PnL',

  Market = 'Market',
  Side = 'Side',
  Size = 'Size',
  Leverage = 'Leverage',
  LiquidationAndOraclePrice = 'LiquidationAndOraclePrice',
  Margin = 'Margin',
  UnrealizedPnl = 'UnrealizedPnl',
  RealizedPnl = 'RealizedPnl',
  AverageOpenAndClose = 'AverageOpenAndClose',
  Triggers = 'Triggers',
  Actions = 'Actions',
}

type PositionTableRow = {
  asset: Asset;
  oraclePrice: Nullable<number>;
  tickSizeDecimals: number;
  stopLossOrders: SubaccountOrder[];
  takeProfitOrders: SubaccountOrder[];
} & SubaccountPosition;

const getPositionsTableColumnDef = ({
  key,
  stringGetter,
  width,
  isAccountViewOnly,
  navigateToOrders,
}: {
  key: PositionsTableColumnKey;
  stringGetter: StringGetterFunction;
  width?: ColumnSize;
  isAccountViewOnly: boolean;
  navigateToOrders: (market: string) => void;
}) => ({
  width,
  ...(
    {
      [PositionsTableColumnKey.Details]: {
        columnKey: 'details',
        getCellValue: (row) => row.id,
        label: stringGetter({ key: STRING_KEYS.DETAILS }),
        renderCell: ({ id, asset, leverage, resources, size }) => (
          <TableCell stacked slotLeft={<Styled.AssetIcon symbol={asset?.id} />}>
            <Styled.HighlightOutput
              type={OutputType.Asset}
              value={size?.current}
              fractionDigits={TOKEN_DECIMALS}
              showSign={ShowSign.None}
              tag={asset?.id}
            />
            <Styled.InlineRow>
              <Styled.PositionSide>
                {resources.sideStringKey?.current &&
                  stringGetter({ key: resources.sideStringKey?.current })}
              </Styled.PositionSide>
              <Styled.SecondaryColor>@</Styled.SecondaryColor>
              <Styled.HighlightOutput
                type={OutputType.Multiple}
                value={leverage?.current}
                showSign={ShowSign.None}
              />
            </Styled.InlineRow>
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
            <Styled.OutputSigned
              isNegative={MustBigNumber(unrealizedPnlPercent?.current).isNegative()}
              type={OutputType.Percent}
              value={unrealizedPnlPercent?.current}
              showSign={ShowSign.None}
            />
            <Styled.HighlightOutput
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
        renderCell: ({ id, asset }) => <MarketTableCell asset={asset} marketId={id} />,
      },
      [PositionsTableColumnKey.Side]: {
        columnKey: 'market-side',
        getCellValue: (row) => row.side?.current && POSITION_SIDES[row.side.current.name],
        label: stringGetter({ key: STRING_KEYS.SIDE }),
        renderCell: ({ side }) =>
          side?.current && (
            <PositionSideTag
              positionSide={POSITION_SIDES[side.current.name]}
              size={TagSize.Medium}
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
            <Output
              type={OutputType.Asset}
              value={size?.current}
              tag={assetId}
              showSign={ShowSign.None}
            />
            <Output
              type={OutputType.Fiat}
              value={notionalTotal?.current}
              fractionDigits={tickSizeDecimals}
            />
          </TableCell>
        ),
      },
      [PositionsTableColumnKey.Leverage]: {
        columnKey: 'leverage',
        getCellValue: (row) => row.leverage?.current,
        label: stringGetter({ key: STRING_KEYS.LEVERAGE }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        renderCell: ({ leverage }) => (
          <Output type={OutputType.Multiple} value={leverage?.current} showSign={ShowSign.None} />
        ),
      },
      [PositionsTableColumnKey.Margin]: {
        columnKey: 'margin',
        getCellValue: (row) => row.leverage?.current,
        label: stringGetter({ key: STRING_KEYS.MARGIN }),
        hideOnBreakpoint: MediaQueryKeys.isMobile,
        isActionable: true,
        renderCell: ({ id, adjustedMmf, notionalTotal }) => (
          <PositionsMarginCell id={id} notionalTotal={notionalTotal} adjustedMmf={adjustedMmf} />
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
            <Styled.OutputSigned
              isNegative={MustBigNumber(unrealizedPnl?.current).isNegative()}
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
            <Styled.OutputSigned
              isNegative={MustBigNumber(realizedPnl?.current).isNegative()}
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
        label: stringGetter({ key: STRING_KEYS.AVERAGE_OPEN_CLOSE }),
        hideOnBreakpoint: MediaQueryKeys.isDesktopSmall,
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
          liquidationPrice,
          side,
          size,
          stopLossOrders,
          takeProfitOrders,
        }) => (
          <PositionsTriggersCell
            marketId={id}
            assetId={assetId}
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
        label: stringGetter({ key: STRING_KEYS.ACTION }), // TODO: CT-639
        isActionable: true,
        allowsSorting: false,
        hideOnBreakpoint: MediaQueryKeys.isTablet,
        renderCell: ({ id, assetId, stopLossOrders, takeProfitOrders }) => (
          <PositionsActionsCell
            marketId={id}
            assetId={assetId}
            isDisabled={isAccountViewOnly}
            stopLossOrders={stopLossOrders}
            takeProfitOrders={takeProfitOrders}
            navigateToMarketOrders={navigateToOrders}
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
  onNavigate,
  navigateToOrders,
  withGradientCardRows,
  withOuterBorder,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();

  const isAccountViewOnly = useSelector(calculateIsAccountViewOnly);
  const perpetualMarkets = useSelector(getPerpetualMarkets, shallowEqual) || {};
  const assets = useSelector(getAssets, shallowEqual) || {};
  const openPositions = useSelector(getExistingOpenPositions, shallowEqual) || [];
  const { stopLossOrders: allStopLossOrders, takeProfitOrders: allTakeProfitOrders } = useSelector(
    getSubaccountConditionalOrders,
    shallowEqual
  );

  const positionsData = useMemo(
    () =>
      openPositions.map((position: SubaccountPosition) => {
        return {
          tickSizeDecimals:
            perpetualMarkets?.[position.id]?.configs?.tickSizeDecimals || USD_DECIMALS,
          asset: assets?.[position.assetId],
          oraclePrice: perpetualMarkets?.[position.id]?.oraclePrice,
          stopLossOrders: allStopLossOrders.filter(
            (order: SubaccountOrder) => order.marketId === position.id
          ),
          takeProfitOrders: allTakeProfitOrders.filter(
            (order: SubaccountOrder) => order.marketId === position.id
          ),
          ...position,
        };
      }),
    [openPositions, perpetualMarkets, assets, allStopLossOrders, allTakeProfitOrders]
  );

  return (
    <Styled.Table
      key="positions"
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
          navigateToOrders,
        })
      )}
      getRowKey={(row: PositionTableRow) => row.id}
      onRowAction={(market: string) => {
        navigate(`${AppRoute.Trade}/${market}`, {
          state: { from: currentRoute },
        });
        onNavigate?.();
      }}
      getRowAttributes={(row: PositionTableRow) => ({
        'data-side': row.side.current,
      })}
      slotEmpty={
        <>
          <Styled.Icon iconName={IconName.Positions} />
          <h4>{stringGetter({ key: STRING_KEYS.POSITIONS_EMPTY_STATE })}</h4>
        </>
      }
      withGradientCardRows={withGradientCardRows}
      withOuterBorder={withOuterBorder}
      withInnerBorders
      withScrollSnapColumns
      withScrollSnapRows
      withFocusStickyRows
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Table = styled(Table)`
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
`;

Styled.InlineRow = styled.div`
  ${layoutMixins.inlineRow}
`;

Styled.AssetIcon = styled(AssetIcon)`
  ${layoutMixins.inlineRow}
  min-width: unset;
  font-size: 2.25rem;
`;

Styled.SecondaryColor = styled.span`
  color: var(--color-text-0);
`;

Styled.OutputSigned = styled(Output)<{ isNegative?: boolean }>`
  color: ${({ isNegative }) => (isNegative ? `var(--color-negative)` : `var(--color-positive)`)};
`;

Styled.HighlightOutput = styled(Output)<{ isNegative?: boolean }>`
  color: var(--color-text-1);
  --secondary-item-color: currentColor;
  --output-sign-color: ${({ isNegative }) =>
    isNegative !== undefined
      ? isNegative
        ? `var(--color-negative)`
        : `var(--color-positive)`
      : `currentColor`};
`;

Styled.PositionSide = styled.span`
  && {
    color: var(--side-color);
  }
`;

Styled.Icon = styled(Icon)`
  font-size: 3em;
`;
