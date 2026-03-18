import { PositionUniqueId } from '@/bonsai/types/summaryTypes';
import BigNumber from 'bignumber.js';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { ButtonShape, ButtonStyle } from '@/constants/buttons';
import {
  DialogTypes,
  SharePNLAnalyticsDialogProps,
  TradeBoxDialogTypes,
} from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';
import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { ActionsTableCell } from '@/components/Table/ActionsTableCell';
import { WithTooltip } from '@/components/WithTooltip';

import { getOpenPositionFromId } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { closePositionFormActions } from '@/state/closePositionForm';
import { getCurrentMarketId } from '@/state/currentMarketSelectors';
import { closeDialogInTradeBox, openDialog, openDialogInTradeBox } from '@/state/dialogs';
import { getActiveTradeBoxDialog } from '@/state/dialogsSelectors';

import { Nullable } from '@/lib/typeUtils';

type ElementProps = {
  positionId: PositionUniqueId;
  marketId: string;
  assetId: string;
  leverage: Nullable<BigNumber>;
  oraclePrice: Nullable<BigNumber>;
  entryPrice: Nullable<BigNumber>;
  unrealizedPnl: Nullable<BigNumber>;
  side: Nullable<IndexerPositionSide>;
  isDisabled?: boolean;
  showClosePositionAction: boolean;
};

export const PositionsActionsCell = ({
  positionId,
  marketId,
  assetId,
  leverage,
  oraclePrice,
  entryPrice,
  unrealizedPnl,
  side,
  isDisabled,
  showClosePositionAction,
}: ElementProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const currentMarketId = useAppSelector(getCurrentMarketId);
  const activeTradeBoxDialog = useAppSelector(getActiveTradeBoxDialog);
  const stringGetter = useStringGetter();

  const position = useAppSelectorWithArgs(getOpenPositionFromId, positionId);

  const onCloseButtonToggle = (isPressed: boolean) => {
    navigate(`${AppRoute.Trade}/${marketId}`);
    dispatch(
      isPressed
        ? openDialogInTradeBox(TradeBoxDialogTypes.ClosePosition())
        : closeDialogInTradeBox()
    );

    if (!isPressed) {
      dispatch(closePositionFormActions.reset());
    }
  };

  const openShareDialog = () => {
    const sharePnlData: SharePNLAnalyticsDialogProps = {
      assetId,
      marketId,
      size: position?.value.toNumber() ?? 0,
      isLong: side === IndexerPositionSide.LONG,
      isCross: position?.marginMode === 'CROSS',
      leverage: leverage?.toNumber(),
      oraclePrice: oraclePrice?.toNumber(),
      entryPrice: entryPrice?.toNumber(),
      unrealizedPnl: unrealizedPnl?.toNumber(),
      pnl: position?.realizedPnl.toNumber(),
      pnlPercentage: position?.updatedUnrealizedPnlPercent?.toNumber(),
      liquidationPrice: position?.liquidationPrice?.toNumber(),
    };

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
      {showClosePositionAction && (
        <WithTooltip tooltipString={stringGetter({ key: STRING_KEYS.CLOSE_POSITION })}>
          <$CloseButtonToggle
            key="closepositions"
            isToggle
            isPressed={
              activeTradeBoxDialog != null &&
              TradeBoxDialogTypes.is.ClosePosition(activeTradeBoxDialog) &&
              currentMarketId === marketId
            }
            onPressedChange={onCloseButtonToggle}
            iconName={IconName.Close}
            shape={ButtonShape.Square}
            disabled={isDisabled}
            buttonStyle={ButtonStyle.WithoutBackground}
          />
        </WithTooltip>
      )}
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

const $CloseButtonToggle = styled(IconButton)`
  --button-icon-size: 1em;
  --button-hover-textColor: var(--color-red);
  --button-toggle-on-textColor: var(--color-red);
`;
