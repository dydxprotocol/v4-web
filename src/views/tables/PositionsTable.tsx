import { useSelector, shallowEqual } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import type { ColumnSize } from '@react-types/table';

import {
  type Asset,
  type Nullable,
  type SubaccountPosition,
  POSITION_SIDES,
} from '@/constants/abacus';

import { StringGetterFunction, STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { PositionSide } from '@/constants/trade';
import { useStringGetter } from '@/hooks';
import { MediaQueryKeys } from '@/hooks/useBreakpoints';

import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { getExistingOpenPositions } from '@/state/accountSelectors';
import { getAssets } from '@/state/assetsSelectors';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { MarketTableCell } from '@/components/Table/MarketTableCell';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { PositionSideTag } from '@/components/PositionSideTag';
import { type ColumnDef, Table, TableColumnHeader } from '@/components/Table';
import { TableCell } from '@/components/Table/TableCell';
import { TagSize } from '@/components/Tag';

import { MustBigNumber } from '@/lib/numbers';

export enum PositionsTableColumnKey {
  Details = 'Details',
  IndexEntry = 'IndexEntry',
  PnL = 'PnL',

  Market = 'Market',
  Side = 'Side',
  Size = 'Size',
  Leverage = 'Leverage',
  LiquidationAndOraclePrice = 'LiquidationAndOraclePrice',
  UnrealizedPnl = 'UnrealizedPnl',
  RealizedPnl = 'RealizedPnl',
  AverageOpenAndClose = 'AverageOpenAndClose',
}

type PositionTableRow = {
  asset: Asset;
  oraclePrice: Nullable<number>;
  tickSizeDecimals: number;
} & SubaccountPosition;

const getPositionsTableColumnDef = ({
  key,
  stringGetter,
  width,
}: {
  key: PositionsTableColumnKey;
  stringGetter: StringGetterFunction;
  width?: ColumnSize;
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
    } as Record<PositionsTableColumnKey, ColumnDef<PositionTableRow>>
  )[key],
});

type ElementProps = {
  columnKeys: PositionsTableColumnKey[];
  columnWidths?: Partial<Record<PositionsTableColumnKey, ColumnSize>>;
  currentRoute?: string;
  onNavigate?: () => void;
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
  withGradientCardRows,
  withOuterBorder,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();

  const perpetualMarkets = useSelector(getPerpetualMarkets, shallowEqual) || {};
  const assets = useSelector(getAssets, shallowEqual) || {};
  const openPositions = useSelector(getExistingOpenPositions, shallowEqual) || [];

  const positionsData = openPositions.map((position: SubaccountPosition) => ({
    tickSizeDecimals: perpetualMarkets?.[position.id]?.configs?.tickSizeDecimals || USD_DECIMALS,
    asset: assets?.[position.assetId],
    oraclePrice: perpetualMarkets?.[position.id]?.oraclePrice,
    ...position,
  })) as PositionTableRow[];

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
        })
      )}
      getRowKey={(row: PositionTableRow) => row.id}
      onRowAction={(market: string) => {
        navigate(`/trade/${market}`, {
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
