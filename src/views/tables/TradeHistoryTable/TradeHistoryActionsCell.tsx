import { TradeAction } from '@/bonsai/types/summaryTypes';
import styled from 'styled-components';

import { ButtonShape, ButtonStyle } from '@/constants/buttons';
import { DialogTypes, SharePNLAnalyticsDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { useStringGetter } from '@/hooks/useStringGetter';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { ActionsTableCell } from '@/components/Table/ActionsTableCell';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { getIndexerPositionSideStringKey } from '@/lib/enumToStringKeyHelpers';
import { MaybeBigNumber } from '@/lib/numbers';

import { TradeTableRow } from '../TradeHistoryTable';

type ElementProps = {
  trade: TradeTableRow;
  isDisabled?: boolean;
};

export const TradeHistoryActionsCell = ({ trade, isDisabled }: ElementProps) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const sideLabel =
    trade.positionSide &&
    stringGetter({
      key: getIndexerPositionSideStringKey(trade.positionSide),
    });

  const shareType =
    trade.action === TradeAction.OPEN_LONG || trade.action === TradeAction.OPEN_SHORT
      ? 'open'
      : trade.action === TradeAction.PARTIAL_CLOSE_LONG ||
          trade.action === TradeAction.PARTIAL_CLOSE_SHORT
        ? 'partialClose'
        : trade.action === TradeAction.CLOSE_LONG || trade.action === TradeAction.CLOSE_SHORT
          ? 'close'
          : undefined;

  const sharePnlData: SharePNLAnalyticsDialogProps = {
    assetId: trade.marketSummary?.assetId ?? '',
    marketId: trade.marketId,
    size: trade.value ?? 0,
    isLong: trade.positionSide === IndexerPositionSide.LONG,
    isCross: trade.marginMode === 'CROSS',
    shareType,
    leverage: trade.leverage,
    oraclePrice: MaybeBigNumber(trade.marketSummary?.oraclePrice)?.toNumber(),
    entryPrice: MaybeBigNumber(trade.entryPrice)?.toNumber(),
    exitPrice: MaybeBigNumber(trade.price)?.toNumber(),
    pnl: trade.closedPnl,
    pnlPercentage: trade.closedPnlPercent ?? 0,
    liquidationPrice: trade.liquidationPrice,
  };

  const openShareDialog = () => {
    dispatch(
      openDialog(
        DialogTypes.SharePNLAnalytics({
          ...sharePnlData,
          sideLabel: sideLabel ?? undefined,
        })
      )
    );
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
  --button-icon-size: 1.25em;
  --button-textColor: var(--color-text-0);
  --button-hover-textColor: var(--color-text-1);

  --button-icon-size: 1em;
`;
