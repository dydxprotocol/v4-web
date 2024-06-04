import styled, { css } from 'styled-components';

import {
  AbacusPositionSide,
  Nullable,
  type AbacusPositionSides,
  type SubaccountOrder,
} from '@/constants/abacus';
import { ButtonAction, ButtonShape, ButtonSize } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useComplianceState } from '@/hooks/useComplianceState';
import { useEnvFeatures } from '@/hooks/useEnvFeatures';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Output, OutputType } from '@/components/Output';
import { TableCell } from '@/components/Table/TableCell';
import { WithHovercard } from '@/components/WithHovercard';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { isStopLossOrder } from '@/lib/orders';
import { testFlags } from '@/lib/testFlags';

enum TriggerButtonState {
  Warning = 'Warning',
  HasOrders = 'HasOrders',
  Default = 'Default',
}

type ElementProps = {
  marketId: string;
  assetId: string;
  tickSizeDecimals: number;
  liquidationPrice: Nullable<number>;
  stopLossOrders: SubaccountOrder[];
  takeProfitOrders: SubaccountOrder[];
  onViewOrdersClick: (marketId: string) => void;
  positionSide: Nullable<AbacusPositionSides>;
  positionSize: Nullable<number>;
  isDisabled?: boolean;
};

export const PositionsTriggersCell = ({
  marketId,
  assetId,
  tickSizeDecimals,
  liquidationPrice,
  stopLossOrders,
  takeProfitOrders,
  onViewOrdersClick,
  positionSide,
  positionSize,
  isDisabled,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const { isSlTpLimitOrdersEnabled } = useEnvFeatures();
  const { complianceState } = useComplianceState();

  const onViewOrders = isDisabled ? null : () => onViewOrdersClick(marketId);

  const showLiquidationWarning = (order: SubaccountOrder) => {
    if (!isStopLossOrder(order, isSlTpLimitOrdersEnabled) || !liquidationPrice) {
      return false;
    }
    return (
      (positionSide === AbacusPositionSide.SHORT &&
        (order.triggerPrice ?? order.price) > liquidationPrice) ||
      (positionSide === AbacusPositionSide.LONG &&
        (order.triggerPrice ?? order.price) < liquidationPrice)
    );
  };

  const openTriggersDialog = () => {
    dispatch(
      openDialog({
        type: DialogTypes.Triggers,
        dialogProps: {
          marketId,
          assetId,
          stopLossOrders,
          takeProfitOrders,
          navigateToMarketOrders: onViewOrders,
        },
      })
    );
  };

  const viewOrdersButton = (
    <$ViewOrdersButton
      action={ButtonAction.Navigation}
      size={ButtonSize.XSmall}
      onClick={onViewOrders ?? undefined}
    >
      {stringGetter({ key: STRING_KEYS.VIEW_ORDERS })}
      <$ArrowIcon iconName={IconName.Arrow} />
    </$ViewOrdersButton>
  );

  const renderOutput = ({ label, orders }: { label: string; orders: SubaccountOrder[] }) => {
    const triggerLabel = ({
      liquidationWarningSide,
    }: {
      liquidationWarningSide?: Nullable<AbacusPositionSides>;
    } = {}) => {
      let triggerButtonState = TriggerButtonState.Default;

      if (liquidationWarningSide != null) {
        triggerButtonState = TriggerButtonState.Warning;
      } else if (orders.length > 0) {
        triggerButtonState = TriggerButtonState.HasOrders;
      }

      const triggerButton = (
        <$TriggerButton
          action={ButtonAction.Primary}
          onClick={openTriggersDialog}
          triggerButtonState={triggerButtonState}
        >
          {label}
        </$TriggerButton>
      );
      return liquidationWarningSide ? (
        <WithHovercard
          align="start"
          side="left"
          hovercard={
            liquidationWarningSide === AbacusPositionSide.LONG
              ? 'liquidation-warning-long'
              : 'liquidation-warning-short'
          }
          slotButton={
            <Button
              action={ButtonAction.Primary}
              size={ButtonSize.Small}
              onClick={openTriggersDialog}
            >
              {stringGetter({ key: STRING_KEYS.EDIT_STOP_LOSS })}
            </Button>
          }
          slotTrigger={triggerButton}
        />
      ) : (
        triggerButton
      );
    };

    if (orders.length === 0) {
      return (
        <>
          {triggerLabel()} <$Output type={OutputType.Fiat} value={null} />
        </>
      );
    }

    if (orders.length === 1) {
      const order = orders[0];
      const { size, triggerPrice } = order;

      const isPartialPosition = !!(positionSize && Math.abs(size) < Math.abs(positionSize));
      const liquidationWarningSide = showLiquidationWarning(order) ? positionSide : undefined;

      return (
        <>
          {triggerLabel({ liquidationWarningSide })}
          <$Output
            type={OutputType.Fiat}
            value={triggerPrice ?? null}
            fractionDigits={tickSizeDecimals}
          />
          {isPartialPosition && (
            <WithHovercard
              align="end"
              side="top"
              hovercard={
                isStopLossOrder(order, isSlTpLimitOrdersEnabled)
                  ? 'partial-close-stop-loss'
                  : 'partial-close-take-profit'
              }
              slotButton={
                <Button
                  action={ButtonAction.Primary}
                  size={ButtonSize.Small}
                  onClick={openTriggersDialog}
                >
                  {stringGetter({
                    key: isStopLossOrder(order, isSlTpLimitOrdersEnabled)
                      ? STRING_KEYS.EDIT_STOP_LOSS
                      : STRING_KEYS.EDIT_TAKE_PROFIT,
                  })}
                </Button>
              }
              slotTrigger={
                <$PartialFillIcon>
                  <Icon iconName={IconName.PositionPartial} />
                </$PartialFillIcon>
              }
            />
          )}
        </>
      );
    }

    return (
      <>
        {triggerLabel()}
        {viewOrdersButton}
      </>
    );
  };

  return (
    <$TableCell
      stacked
      stackedWithSecondaryStyling={false}
      slotRight={
        !isDisabled &&
        testFlags.isolatedMargin &&
        complianceState === ComplianceStates.FULL_ACCESS && (
          <$EditButton
            key="edit-margin"
            iconName={IconName.Pencil}
            shape={ButtonShape.Square}
            onClick={openTriggersDialog}
          />
        )
      }
    >
      <$Row>{renderOutput({ label: 'TP', orders: takeProfitOrders })}</$Row>
      <$Row>{renderOutput({ label: 'SL', orders: stopLossOrders })}</$Row>
    </$TableCell>
  );
};
const $Row = styled.span`
  ${layoutMixins.inlineRow}

  --item-height: 1.25rem;
`;

const getStylingForTriggerButtonState = (state: TriggerButtonState) => {
  switch (state) {
    case TriggerButtonState.HasOrders:
      return css`
        --button-textColor: var(--color-text-1);
        --button-backgroundColor: var(--color-layer-4);
      `;
    case TriggerButtonState.Warning:
      return css`
        --button-textColor: var(--color-black);
        --button-backgroundColor: var(--color-warning);
      `;
    case TriggerButtonState.Default:
    default:
      return css`
        --button-hover-textColor: var(--color-text-1);
      `;
  }
};

const $TriggerButton = styled(Button)<{ triggerButtonState: TriggerButtonState }>`
  --button-backgroundColor: transparent;
  --button-border: solid var(--border-width) var(--color-border);
  --button-font: var(--font-tiny-book);
  --button-height: var(--item-height);
  --button-padding: 0 0.25rem;
  --button-textColor: var(--color-text-0);

  ${({ triggerButtonState }) => getStylingForTriggerButtonState(triggerButtonState)}
`;

const $Output = styled(Output)<{ value: number | null }>`
  font: var(--font-mini-medium);
  ${({ value }) =>
    value
      ? css`
          color: var(--color-text-1);
        `
      : css`
          color: var(--color-text-0);
        `}
`;

const $ViewOrdersButton = styled(Button)`
  --button-height: var(--item-height);
  --button-padding: 0;
  --button-textColor: var(--color-text-1);
`;

const $ArrowIcon = styled(Icon)`
  stroke-width: 2;
`;

const $PartialFillIcon = styled.span`
  svg {
    display: block;

    width: 0.875em;
    height: 0.875em;
  }
`;

const $EditButton = styled(IconButton)`
  --button-icon-size: 1.5em;
  --button-padding: 0;
  --button-textColor: var(--color-text-0);
  --button-hover-textColor: var(--color-text-1);

  margin-left: 0.5rem;
`;

const $TableCell = styled(TableCell)`
  justify-content: space-between;
`;
