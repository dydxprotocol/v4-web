import {
  PositionUniqueId,
  SubaccountFill,
  SubaccountFillType,
  SubaccountPosition,
} from '@/bonsai/types/summaryTypes';
import styled from 'styled-components';

import { ButtonShape, ButtonStyle } from '@/constants/buttons';
import { DialogTypes, SharePNLAnalyticsDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { IndexerOrderSide, IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { ActionsTableCell } from '@/components/Table/ActionsTableCell';
import { WithTooltip } from '@/components/WithTooltip';

import {
  getFillsForOrderId,
  getOrderById,
  getSubaccountPositionByUniqueId,
} from '@/state/accountSelectors';
import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { getIndexerOrderSideStringKey } from '@/lib/enumToStringKeyHelpers';
import { MustNumber } from '@/lib/numbers';
import { Nullable } from '@/lib/typeUtils';

import { FillTableRow } from '../FillsTable';

type ElementProps = {
  fill: SubaccountFill;
  assetId: string;
  oraclePrice: Nullable<number>;
  isDisabled?: boolean;
};

export type FullFillTableRow = FillTableRow & { quoteAmount: string | undefined };

// Transform fill data into SharePnlData
const transformFillToShareData = (
  fill: FullFillTableRow,
  relatedFills: FullFillTableRow[],
  positionData: SubaccountPosition,
  assetId: string,
  oraclePrice: Nullable<number>
): SharePNLAnalyticsDialogProps => {
  const isLong = fill.positionSideBefore === IndexerPositionSide.LONG;
  const isCross = fill.marginMode === 'CROSS';

  let type: 'open' | 'close' | 'liquidated' | 'partialClose' = 'close';

  // Determine if this was an opening or closing trade
  const wasClosingTrade =
    fill.positionSideBefore != null &&
    ((fill.positionSideBefore === IndexerPositionSide.LONG &&
      fill.side === IndexerOrderSide.SELL) ||
      (fill.positionSideBefore === IndexerPositionSide.SHORT &&
        fill.side === IndexerOrderSide.BUY));

  if (fill.type === SubaccountFillType.LIQUIDATED) {
    type = 'liquidated';
  }

  if (positionData.status === 'OPEN' && wasClosingTrade) {
    type = 'partialClose';
  } else if (positionData.status === 'OPEN' && !wasClosingTrade) {
    type = 'open';
  }

  const aggregatedPnl = relatedFills.reduce((acc, rFill) => acc + (rFill.closedPnl ?? 0), 0);
  const calcTotalValue = relatedFills.reduce(
    (acc, rFill) => acc + MustNumber(rFill.quoteAmount ?? '0'),
    0
  );

  const size = positionData.value.toNumber();
  const prevSize = wasClosingTrade ? size + calcTotalValue : size - calcTotalValue;

  const entryPrice = fill.entryPriceBefore
    ? parseFloat(fill.entryPriceBefore)
    : positionData.entryPrice.toNumber();

  const exitPrice = MustNumber(fill.price);

  const pnlPercentage = isLong
    ? (exitPrice - entryPrice) / entryPrice
    : (entryPrice - exitPrice) / entryPrice;

  // eslint-disable-next-line no-console
  console.log('calcTotalValue: ', calcTotalValue);
  // eslint-disable-next-line no-console
  console.log('prevSize: ', prevSize);
  // eslint-disable-next-line no-console
  console.log('size: ', size);

  return {
    assetId,
    marketId: fill.market ?? '',
    isLong,
    isCross,
    shareType: type,
    size,
    prevSize,
    entryPrice: fill.entryPriceBefore ? parseFloat(fill.entryPriceBefore) : undefined,
    exitPrice: MustNumber(fill.price),
    oraclePrice: oraclePrice ?? undefined,
    pnlPercentage,
    pnl: aggregatedPnl,
  };
};

export const FillActionsCell = ({ fill, assetId, oraclePrice, isDisabled }: ElementProps) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const orderData = useAppSelectorWithArgs(getOrderById, fill.orderId ?? '');
  const relatedFills = useAppSelectorWithArgs(getFillsForOrderId, fill.orderId ?? '');

  const positionData = useAppSelectorWithArgs(
    getSubaccountPositionByUniqueId,
    orderData?.positionUniqueId as PositionUniqueId
  );

  const sideLabel = fill.side
    ? stringGetter({ key: getIndexerOrderSideStringKey(fill.side) })
    : undefined;

  const openShareDialog = () => {
    if (!positionData) return;

    const sharePnlData = transformFillToShareData(
      fill as FullFillTableRow,
      relatedFills as FullFillTableRow[],
      positionData as SubaccountPosition,
      assetId,
      oraclePrice
    );

    // eslint-disable-next-line no-console
    console.log('position data: ', positionData);
    // eslint-disable-next-line no-console
    console.log('fill: ', fill);
    // eslint-disable-next-line no-console
    console.log('order data: ', orderData);

    dispatch(
      openDialog(
        DialogTypes.SharePNLAnalytics({
          ...sharePnlData,
          leverage: positionData.leverage?.toNumber(),
          liquidationPrice: positionData.liquidationPrice?.toNumber(),
          sideLabel,
        })
      )
    );
  };

  return (
    <$ActionsTableCell>
      <WithTooltip tooltipString={stringGetter({ key: STRING_KEYS.SHARE })}>
        <$ShareButton
          key="share"
          onClick={openShareDialog}
          iconName={IconName.Share}
          shape={ButtonShape.Square}
          disabled={isDisabled}
          buttonStyle={ButtonStyle.WithoutBackground}
        />
      </WithTooltip>
    </$ActionsTableCell>
  );
};

const $ActionsTableCell = styled(ActionsTableCell)`
  --toolbar-margin: 0.25rem;
`;

const $ShareButton = styled(IconButton)`
  --button-icon-size: 1.25em;
  --button-textColor: var(--color-text-0);
  --button-hover-textColor: var(--color-text-1);
  --button-icon-size: 1em;
`;
