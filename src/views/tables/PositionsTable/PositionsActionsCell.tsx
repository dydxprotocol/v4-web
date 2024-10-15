import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { AbacusPositionSides, Nullable, SubaccountOrder } from '@/constants/abacus';
import { ButtonShape } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes, TradeBoxDialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useComplianceState } from '@/hooks/useComplianceState';
import { useStringGetter } from '@/hooks/useStringGetter';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { ActionsTableCell } from '@/components/Table/ActionsTableCell';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { closeDialogInTradeBox, openDialog, openDialogInTradeBox } from '@/state/dialogs';
import { getActiveTradeBoxDialog } from '@/state/dialogsSelectors';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { testFlags } from '@/lib/testFlags';

type ElementProps = {
  marketId: string;
  assetId: string;
  leverage: Nullable<number>;
  oraclePrice: Nullable<number>;
  entryPrice: Nullable<number>;
  unrealizedPnl: Nullable<number>;
  side: Nullable<AbacusPositionSides>;
  sideLabel: Nullable<string>;
  stopLossOrders: SubaccountOrder[];
  takeProfitOrders: SubaccountOrder[];
  isDisabled?: boolean;
  showClosePositionAction: boolean;
  navigateToMarketOrders: (market: string) => void;
};

export const PositionsActionsCell = ({
  marketId,
  assetId,
  leverage,
  oraclePrice,
  entryPrice,
  unrealizedPnl,
  side,
  sideLabel,
  stopLossOrders,
  takeProfitOrders,
  isDisabled,
  showClosePositionAction,
  navigateToMarketOrders,
}: ElementProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const currentMarketId = useAppSelector(getCurrentMarketId);
  const activeTradeBoxDialog = useAppSelector(getActiveTradeBoxDialog);
  const stringGetter = useStringGetter();
  const { complianceState } = useComplianceState();

  const { uiRefresh } = testFlags;

  const onCloseButtonToggle = (isPressed: boolean) => {
    navigate(`${AppRoute.Trade}/${marketId}`);
    dispatch(
      isPressed
        ? openDialogInTradeBox(TradeBoxDialogTypes.ClosePosition())
        : closeDialogInTradeBox()
    );

    if (!isPressed) {
      abacusStateManager.clearClosePositionInputValues({ shouldFocusOnTradeInput: true });
    }
  };

  const openTriggersDialog = () => {
    if (isDisabled) {
      return;
    }
    dispatch(
      openDialog(
        DialogTypes.Triggers({
          marketId,
          assetId,
          stopLossOrders,
          takeProfitOrders,
          navigateToMarketOrders,
        })
      )
    );
  };

  const openShareDialog = () => {
    dispatch(
      openDialog(
        DialogTypes.SharePNLAnalytics({
          marketId,
          assetId,
          leverage,
          oraclePrice,
          entryPrice,
          unrealizedPnl,
          side,
          sideLabel,
        })
      )
    );
  };

  return (
    <$ActionsTableCell $uiRefreshEnabled={uiRefresh}>
      {!isDisabled && complianceState === ComplianceStates.FULL_ACCESS && !uiRefresh && (
        <WithTooltip
          tooltipString={stringGetter({ key: STRING_KEYS.EDIT_TAKE_PROFIT_STOP_LOSS_TRIGGERS })}
        >
          <$TriggersButton
            key="edittriggers"
            onClick={openTriggersDialog}
            iconName={IconName.Pencil}
            shape={ButtonShape.Square}
            $uiRefreshEnabled={uiRefresh}
          />
        </WithTooltip>
      )}
      <$TriggersButton
        key="share"
        onClick={openShareDialog}
        iconName={IconName.Share}
        shape={ButtonShape.Square}
        disabled={isDisabled}
        $uiRefreshEnabled={uiRefresh}
      />
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
            $uiRefreshEnabled={uiRefresh}
          />
        </WithTooltip>
      )}
    </$ActionsTableCell>
  );
};

const $ActionsTableCell = styled(ActionsTableCell)<{ $uiRefreshEnabled: boolean }>`
  ${({ $uiRefreshEnabled }) =>
    $uiRefreshEnabled &&
    css`
      --toolbar-margin: 1rem;
    `}
`;

const $TriggersButton = styled(IconButton)<{ $uiRefreshEnabled: boolean }>`
  --button-icon-size: 1.5em;
  --button-textColor: var(--color-text-0);
  --button-hover-textColor: var(--color-text-1);

  ${({ $uiRefreshEnabled }) =>
    $uiRefreshEnabled &&
    css`
      --button-icon-size: 1em;
      --button-backgroundColor: transparent;
      --button-border: none;
      width: min-content;
    `}
`;

const $CloseButtonToggle = styled(IconButton)<{ $uiRefreshEnabled: boolean }>`
  --button-icon-size: 1em;
  --button-hover-textColor: var(--color-red);
  --button-toggle-on-textColor: var(--color-red);

  ${({ $uiRefreshEnabled }) =>
    $uiRefreshEnabled &&
    css`
      --button-backgroundColor: transparent;
      --button-border: none;
      width: min-content;
    `}
`;
