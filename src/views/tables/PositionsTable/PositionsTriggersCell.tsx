import { PositionUniqueId, SubaccountOrder } from '@/bonsai/types/summaryTypes';
import BigNumber from 'bignumber.js';
import styled, { css } from 'styled-components';

import { ButtonAction, ButtonShape, ButtonSize, ButtonStyle } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { BREAKPOINT_REM } from '@/constants/page';
import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

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

import { isStopLossOrderNew } from '@/lib/orders';
import { Nullable } from '@/lib/typeUtils';

type ElementProps = {
  marketId: string;
  assetId: string;
  positionUniqueId: PositionUniqueId;
  tickSizeDecimals: number;
  liquidationPrice: Nullable<BigNumber>;
  stopLossOrders: SubaccountOrder[];
  takeProfitOrders: SubaccountOrder[];
  onViewOrdersClick: (marketId: string) => void;
  positionSide: Nullable<IndexerPositionSide>;
  positionSize: Nullable<BigNumber>;
  isDisabled?: boolean;
};

export const PositionsTriggersCell = ({
  marketId,
  assetId,
  positionUniqueId,
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
    if (!isStopLossOrderNew(order, isSlTpLimitOrdersEnabled) || !liquidationPrice) {
      return false;
    }
    return (
      (positionSide === IndexerPositionSide.SHORT &&
        (order.triggerPrice ?? order.price).gt(liquidationPrice)) ||
      (positionSide === IndexerPositionSide.LONG &&
        (order.triggerPrice ?? order.price).lt(liquidationPrice))
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
          positionUniqueId,
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
        buttonStyle={ButtonStyle.WithoutBackground}
      >
        <$Label>{stringGetter({ key: STRING_KEYS.VIEW_ORDERS })}</$Label>
      </$ViewOrdersButton>
    </$Container>
  );

  const editButton = (
    <WithTooltip
      tooltipString={stringGetter({ key: STRING_KEYS.EDIT_TAKE_PROFIT_STOP_LOSS_TRIGGERS })}
    >
      <IconButton
        key="edit-triggers"
        iconName={IconName.Pencil}
        shape={ButtonShape.Square}
        onClick={openTriggersDialog}
        action={ButtonAction.Secondary}
        buttonStyle={ButtonStyle.WithoutBackground}
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
          <$TabletPlaceholder>--</$TabletPlaceholder>
          <$Output type={OutputType.Fiat} value={null} $withLiquidationWarning={false} />
        </$Container>
      );
    }

    if (orders.length === 1) {
      const order = orders[0]!;
      const { size, triggerPrice } = order;

      const isPartialPosition = !!(positionSize && size.abs().lt(positionSize.abs()));
      const liquidationWarningSide = showLiquidationWarning(order) ? positionSide : undefined;

      const output = (
        <$Output
          withSubscript
          type={OutputType.Fiat}
          value={triggerPrice?.toNumber() ?? null}
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
                liquidationWarningSide === IndexerPositionSide.LONG
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
                isStopLossOrderNew(order, isSlTpLimitOrdersEnabled)
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
                    key: isStopLossOrderNew(order, isSlTpLimitOrdersEnabled)
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
      <$Divider />
      {renderOutput({ align: 'left', orders: stopLossOrders })}
      {!isDisabled && complianceState === ComplianceStates.FULL_ACCESS && editButton}
    </$TableCell>
  );
};

const tabletQuery = `@media (max-width: ${BREAKPOINT_REM.tablet})`;
const notTabletQuery = `@media (min-width: ${BREAKPOINT_REM.tablet})`;

const $TableCell = styled(TableCell)`
  align-items: stretch;

  ${tabletQuery} {
    --output-width: 30px;
    gap: 0.25em;
  }

  ${notTabletQuery} {
    --output-width: 70px;
    gap: 0.75em;
    justify-content: center;
  }
`;

const $Container = styled.div<{ $align: 'right' | 'left' }>`
  align-items: center;
  gap: 0.25em;

  ${notTabletQuery} {
    width: var(--output-width);
    display: inline-flex;
  }

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

// Shown only on tablet (replaces the Output component's null state)
const $TabletPlaceholder = styled.span`
  display: none;

  ${tabletQuery} {
    display: inline;
  }
`;

const $Output = styled(Output)<{
  value: number | null;
  $withLiquidationWarning: boolean;
}>`
  ${layoutMixins.textTruncate}
  font: var(--font-mini-medium);

  ${tabletQuery} {
    display: none;
  }

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

const $ViewOrdersButton = styled(Button)`
  --button-height: 100%;
  --button-textColor: var(--color-accent);
  --button-padding: 0 0.5em;
  margin: 0 -0.5em;

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

const $Divider = styled.div`
  ${tabletQuery} {
    &::before {
      content: '/';
    }
  }

  ${notTabletQuery} {
    border-right: solid var(--border-width) var(--color-border);
  }
`;
