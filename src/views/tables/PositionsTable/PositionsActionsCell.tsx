import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { SubaccountOrder } from '@/constants/abacus';
import { ButtonShape } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes, TradeBoxDialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useComplianceState } from '@/hooks/useComplianceState';
import { useEnvFeatures } from '@/hooks/useEnvFeatures';
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

type ElementProps = {
  marketId: string;
  assetId: string;
  stopLossOrders: SubaccountOrder[];
  takeProfitOrders: SubaccountOrder[];
  isDisabled?: boolean;
  showClosePositionAction: boolean;
  navigateToMarketOrders: (market: string) => void;
};

export const PositionsActionsCell = ({
  marketId,
  assetId,
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
  const { isSlTpEnabled } = useEnvFeatures();
  const { complianceState } = useComplianceState();

  const { type: tradeBoxDialogType } = activeTradeBoxDialog ?? {};

  const onCloseButtonToggle = (isPressed: boolean) => {
    navigate(`${AppRoute.Trade}/${marketId}`);
    dispatch(
      isPressed
        ? openDialogInTradeBox({
            type: TradeBoxDialogTypes.ClosePosition,
          })
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
      openDialog({
        type: DialogTypes.Triggers,
        dialogProps: {
          marketId,
          assetId,
          stopLossOrders,
          takeProfitOrders,
          navigateToMarketOrders,
        },
      })
    );
  };

  return (
    <ActionsTableCell>
      {!isDisabled && isSlTpEnabled && complianceState === ComplianceStates.FULL_ACCESS && (
        <WithTooltip
          tooltipString={stringGetter({ key: STRING_KEYS.EDIT_TAKE_PROFIT_STOP_LOSS_TRIGGERS })}
        >
          <$TriggersButton
            key="edittriggers"
            onClick={openTriggersDialog}
            iconName={IconName.Pencil}
            shape={ButtonShape.Square}
            disabled={isDisabled}
          />
        </WithTooltip>
      )}
      {showClosePositionAction && (
        <WithTooltip tooltipString={stringGetter({ key: STRING_KEYS.CLOSE_POSITION })}>
          <$CloseButtonToggle
            key="closepositions"
            isToggle
            isPressed={
              tradeBoxDialogType === TradeBoxDialogTypes.ClosePosition &&
              currentMarketId === marketId
            }
            onPressedChange={onCloseButtonToggle}
            iconName={IconName.Close}
            shape={ButtonShape.Square}
            disabled={isDisabled}
          />
        </WithTooltip>
      )}
    </ActionsTableCell>
  );
};

const $TriggersButton = styled(IconButton)`
  --button-icon-size: 1.5em;
  --button-padding: 0;
  --button-textColor: var(--color-text-0);
  --button-hover-textColor: var(--color-text-1);
`;

const $CloseButtonToggle = styled(IconButton)`
  --button-icon-size: 1em;
  --button-hover-textColor: var(--color-red);
  --button-toggle-on-textColor: var(--color-red);
`;
