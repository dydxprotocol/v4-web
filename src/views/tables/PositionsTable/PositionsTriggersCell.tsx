import { Separator } from '@radix-ui/react-separator';
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
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { isStopLossOrder } from '@/lib/orders';

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

  const onViewOrders = () => onViewOrdersClick(marketId);

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
          navigateToMarketOrders: onViewOrders,
        })
      )
    );
  };

  const viewOrdersButton = (align: 'left' | 'right') => (
    <$Container $align={align}>
      <$ViewOrdersButton
        action={ButtonAction.Navigation}
        size={ButtonSize.XSmall}
        onClick={onViewOrders ?? undefined}
        disabled={isDisabled}
      >
        <$Label>{stringGetter({ key: STRING_KEYS.VIEW_ORDERS })}</$Label>
      </$ViewOrdersButton>
    </$Container>
  );

  const editButton = (
    <WithTooltip
      tooltipString={stringGetter({ key: STRING_KEYS.EDIT_TAKE_PROFIT_STOP_LOSS_TRIGGERS })}
    >
      <$EditButton
        key="edit-triggers"
        iconName={IconName.Pencil}
        shape={ButtonShape.Square}
        onClick={openTriggersDialog}
      />
    </WithTooltip>
  );

  const renderOutput = ({
    align,
    orders,
  }: {
    align: 'right' | 'left';
    orders: SubaccountOrder[];
  }) => {
    if (orders.length === 0) {
      return (
        <$Container $align={align} onClick={openTriggersDialog}>
          <$Output type={OutputType.Fiat} value={null} $withLiquidationWarning={false} />
        </$Container>
      );
    }

    if (orders.length === 1) {
      const order = orders[0];
      const { size, triggerPrice } = order;

      const isPartialPosition = !!(positionSize && Math.abs(size) < Math.abs(positionSize));
      const liquidationWarningSide = showLiquidationWarning(order) ? positionSide : undefined;

      const output = (
        <$Output
          type={OutputType.Fiat}
          value={triggerPrice ?? null}
          fractionDigits={tickSizeDecimals}
          $withLiquidationWarning={!!liquidationWarningSide}
        />
      );

      return (
        <$Container $align={align} onClick={openTriggersDialog}>
          {liquidationWarningSide != null ? (
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
                  disabled={isDisabled}
                  onClick={openTriggersDialog}
                >
                  {stringGetter({ key: STRING_KEYS.EDIT_STOP_LOSS })}
                </Button>
              }
              slotTrigger={<div tw="flex min-w-[1px]">{output}</div>}
            />
          ) : (
            output
          )}
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
                  disabled={isDisabled}
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
                  <Icon iconName={IconName.PositionPartial} size="0.875em" />
                </$PartialFillIcon>
              }
            />
          )}
        </$Container>
      );
    }

    return viewOrdersButton(align);
  };

  return (
    <$TableCell>
      {renderOutput({ align: 'right', orders: takeProfitOrders })}
      <$VerticalSeparator />
      {renderOutput({ align: 'left', orders: stopLossOrders })}
      {!isDisabled && complianceState === ComplianceStates.FULL_ACCESS && editButton}
    </$TableCell>
  );
};

const $TableCell = styled(TableCell)`
  align-items: stretch;
  gap: 0.75em;
  justify-content: center;

  --output-width: 70px;
`;

const $Container = styled.div<{ $align: 'right' | 'left' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25em;
  width: var(--output-width);

  ${({ $align }) =>
    $align &&
    {
      right: css`
        justify-content: end;
      `,
      left: css`
        justify-content: start;
      `,
    }[$align]}
`;

const $Output = styled(Output)<{
  value: number | null;
  $withLiquidationWarning: boolean;
}>`
  ${layoutMixins.textTruncate}
  font: var(--font-mini-medium);

  ${({ value, $withLiquidationWarning }) =>
    $withLiquidationWarning
      ? css`
          color: var(--color-warning);
        `
      : value
        ? css`
            color: var(--color-text-1);
          `
        : css`
            color: var(--color-text-0);
          `}
`;

const ButtonStyle = css`
  --button-backgroundColor: transparent;
  --button-border: none;
  --button-width: min-content;
`;

const $EditButton = styled(IconButton)`
  ${ButtonStyle}
  --button-textColor: var(--color-text-0);
  --button-padding: 0 1em 0 0;
`;

const $ViewOrdersButton = styled(Button)`
  ${ButtonStyle}
  --button-height: 100%;
  --button-textColor: var(--color-accent);
  --button-padding: 0;

  max-width: 100%;
`;

const $PartialFillIcon = styled.span`
  align-self: center;
  svg {
    display: block;
  }
`;

const $Label = styled.div`
  ${layoutMixins.textTruncate}
`;

const $VerticalSeparator = styled(Separator)`
  border-right: solid var(--border-width) var(--color-border);
`;
