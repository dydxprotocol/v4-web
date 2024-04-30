import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { AnyStyledComponent } from 'styled-components';

import { type SubaccountOrder } from '@/constants/abacus';
import { ButtonShape } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes, TradeBoxDialogTypes } from '@/constants/dialogs';
import { AppRoute } from '@/constants/routes';

import { useEnvFeatures } from '@/hooks';
import { useComplianceState } from '@/hooks/useComplianceState';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { ActionsTableCell } from '@/components/Table';

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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { complianceState } = useComplianceState();
  const { isSlTpEnabled } = useEnvFeatures();

  const currentMarketId = useSelector(getCurrentMarketId);
  const activeTradeBoxDialog = useSelector(getActiveTradeBoxDialog);
  const { type: tradeBoxDialogType } = activeTradeBoxDialog || {};

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

  return (
    <ActionsTableCell>
      {isSlTpEnabled && complianceState === ComplianceStates.FULL_ACCESS && (
        <Styled.TriggersButton
          key="edittriggers"
          onClick={() =>
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
            )
          }
          iconName={IconName.Pencil}
          shape={ButtonShape.Square}
          isDisabled={isDisabled}
        />
      )}
      {showClosePositionAction && (
        <Styled.CloseButtonToggle
          key="closepositions"
          isToggle={true}
          isPressed={
            tradeBoxDialogType === TradeBoxDialogTypes.ClosePosition && currentMarketId === marketId
          }
          onPressedChange={onCloseButtonToggle}
          iconName={IconName.Close}
          shape={ButtonShape.Square}
          isDisabled={isDisabled}
        />
      )}
    </ActionsTableCell>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.TriggersButton = styled(IconButton)`
  svg {
    width: 1.5em;
    height: 1.5em;
  }
`;

Styled.CloseButtonToggle = styled(IconButton)`
  --button-hover-textColor: var(--color-red);
  --button-toggle-on-textColor: var(--color-red);

  svg {
    width: 0.875em;
    height: 0.875em;
  }
`;
