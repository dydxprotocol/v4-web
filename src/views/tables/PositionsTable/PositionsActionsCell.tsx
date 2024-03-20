import { useDispatch } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import { type SubaccountOrder } from '@/constants/abacus';
import { ButtonShape } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { ActionsTableCell } from '@/components/Table';

import { openDialog } from '@/state/dialogs';

import { testFlags } from '@/lib/testFlags';

type ElementProps = {
  marketId: string;
  assetId: string;
  stopLossOrders: SubaccountOrder[];
  takeProfitOrders: SubaccountOrder[];
  isDisabled?: boolean;
  navigateToMarketOrders: (market: string) => void;
};

export const PositionsActionsCell = ({
  marketId,
  assetId,
  stopLossOrders,
  takeProfitOrders,
  isDisabled,
  navigateToMarketOrders,
}: ElementProps) => {
  const dispatch = useDispatch();

  const onCloseButtonClick = () => {};

  return (
    <ActionsTableCell>
      {testFlags.configureSlTpFromPositionsTable && (
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
      {testFlags.closePositionsFromPositionsTable && (
        <Styled.CloseButton
          key="closepositions"
          onClick={onCloseButtonClick}
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

Styled.CloseButton = styled(IconButton)`
  --button-hover-textColor: var(--color-red);

  svg {
    width: 0.875em;
    height: 0.875em;
  }
`;
