import { TradeAction } from '@/bonsai/types/summaryTypes';
import styled from 'styled-components';

import { ButtonShape, ButtonStyle } from '@/constants/buttons';
import { DialogTypes, SharePNLAnalyticsDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { ActionsTableCell } from '@/components/Table/ActionsTableCell';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { MaybeBigNumber } from '@/lib/numbers';

import { type TradeTableRow } from '../TradeHistoryTable';

type ElementProps = {
  trade: TradeTableRow;
  isDisabled?: boolean;
};

export const TradeHistoryActionsCell = ({ trade, isDisabled }: ElementProps) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const shareType =
    trade.action === TradeAction.OPEN_LONG || trade.action === TradeAction.OPEN_SHORT
      ? 'open'
      : trade.action === TradeAction.PARTIAL_CLOSE_LONG ||
          trade.action === TradeAction.PARTIAL_CLOSE_SHORT
        ? 'partialClose'
        : trade.action === TradeAction.CLOSE_LONG || trade.action === TradeAction.CLOSE_SHORT
          ? 'close'
          : trade.action === TradeAction.LIQUIDATION
            ? 'liquidated'
            : undefined;

  const prevSize = !!trade.prevSize && !!trade.price ? trade.prevSize * trade.price : undefined;

  const sharePnlData: SharePNLAnalyticsDialogProps = {
    assetId: trade.marketSummary?.assetId ?? '',
    marketId: trade.marketId,
    size: trade.size ?? trade.value,
    prevSize,
    isLong:
      trade.positionSide === 'LONG' ||
      trade.action === TradeAction.OPEN_LONG ||
      trade.action === TradeAction.CLOSE_LONG,
    isCross: trade.marginMode === 'CROSS',
    shareType,
    leverage: trade.leverage,
    oraclePrice: MaybeBigNumber(trade.marketSummary?.oraclePrice)?.toNumber(),
    entryPrice: trade.entryPrice,
    exitPrice: trade.price,
    pnl: trade.closedPnl,
    pnlPercentage: trade.netClosedPnlPercent ?? 0,
    liquidationPrice: trade.liquidationPrice,
  };

  const openShareDialog = () => {
    dispatch(openDialog(DialogTypes.SharePNLAnalytics(sharePnlData)));
  };

  return (
    <$ActionsTableCell tw="mr-[-0.5rem]">
      <WithTooltip tooltipString={stringGetter({ key: STRING_KEYS.SHARE })}>
        <$TriggersButton
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

const $TriggersButton = styled(IconButton)`
  --button-icon-size: 1em;
  --button-textColor: var(--color-text-0);
  --button-hover-textColor: var(--color-text-1);
`;
