import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { ButtonShape } from '@/constants/buttons';
import { TradeBoxDialogTypes } from '@/constants/dialogs';
import { AppRoute } from '@/constants/routes';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { ActionsTableCell } from '@/components/Table/ActionsTableCell';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { closeDialogInTradeBox, openDialogInTradeBox } from '@/state/dialogs';
import { getActiveTradeBoxDialog } from '@/state/dialogsSelectors';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';

type ElementProps = {
  marketId: string;
  isDisabled?: boolean;
  showClosePositionAction: boolean;
};

export const PositionsActionsCell = ({
  marketId,
  isDisabled,
  showClosePositionAction,
}: ElementProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const currentMarketId = useAppSelector(getCurrentMarketId);
  const activeTradeBoxDialog = useAppSelector(getActiveTradeBoxDialog);
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

  return (
    <ActionsTableCell>
      {showClosePositionAction && (
        <$CloseButtonToggle
          key="closepositions"
          isToggle
          isPressed={
            tradeBoxDialogType === TradeBoxDialogTypes.ClosePosition && currentMarketId === marketId
          }
          onPressedChange={onCloseButtonToggle}
          iconName={IconName.Close}
          shape={ButtonShape.Square}
          disabled={isDisabled}
        />
      )}
    </ActionsTableCell>
  );
};

const $CloseButtonToggle = styled(IconButton)`
  --button-icon-size: 1em;
  --button-hover-textColor: var(--color-red);
  --button-toggle-on-textColor: var(--color-red);
`;
