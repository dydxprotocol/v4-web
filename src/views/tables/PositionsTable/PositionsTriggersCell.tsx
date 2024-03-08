import styled, { type AnyStyledComponent, css } from 'styled-components';

import {
  AbacusPositionSide,
  Nullable,
  type AbacusPositionSides,
  type SubaccountOrder,
} from '@/constants/abacus';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { TimeInForceOptions } from '@/constants/trade';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { WithHovercard } from '@/components/WithHovercard';

import { isMarketOrderType, isStopLossOrder } from '@/lib/orders';

type ElementProps = {
  market: string;
  liquidationPrice: Nullable<number>;
  stopLossOrders: SubaccountOrder[];
  takeProfitOrders: SubaccountOrder[];
  onViewOrdersClick: (market: string) => void;
  positionSide: Nullable<AbacusPositionSides>;
  positionSize: Nullable<number>;
  isDisabled?: boolean;
};

export const PositionsTriggersCell = ({
  market,
  liquidationPrice,
  stopLossOrders,
  takeProfitOrders,
  onViewOrdersClick,
  positionSide,
  positionSize,
  isDisabled, // TODO: CT-656 Disable onViewOrdersClick behavior when isDisabled
}: ElementProps) => {
  const stringGetter = useStringGetter();

  const showLiquidationWarning = (order: SubaccountOrder) => {
    if (!isStopLossOrder(order) || !liquidationPrice) {
      return false;
    } else if (
      (positionSide === AbacusPositionSide.SHORT && order.price > liquidationPrice) ||
      (positionSide === AbacusPositionSide.LONG && order.price < liquidationPrice)
    ) {
      return true;
    }
    return false;
  };

  const viewOrdersButton = (
    <Styled.Button
      type={ButtonType.Link}
      action={ButtonAction.Navigation}
      size={ButtonSize.XSmall}
      onClick={() => onViewOrdersClick(market)}
    >
      {stringGetter({ key: STRING_KEYS.VIEW_ORDERS })}
      {<Styled.ArrowIcon iconName={IconName.Arrow} />}
    </Styled.Button>
  );

  const renderOutput = ({ label, orders }: { label: string; orders: SubaccountOrder[] }) => {
    const triggerLabel = ({
      liquidationWarningSide,
    }: {
      liquidationWarningSide?: Nullable<AbacusPositionSides>;
    }) => {
      const styledLabel = <Styled.Label warning={liquidationWarningSide}>{label}</Styled.Label>;
      return liquidationWarningSide ? (
        <WithHovercard
          align={'start'}
          side={'left'}
          hovercard={
            liquidationWarningSide === AbacusPositionSide.LONG
              ? 'liquidation-warning-long'
              : 'liquidation-warning-short'
          }
          slotButton={
            <Button
              action={ButtonAction.Primary}
              size={ButtonSize.Small}
              onClick={() => null} // TODO: CT-663 Implement onClick functionality
            >
              {stringGetter({ key: STRING_KEYS.EDIT_STOP_LOSS })}
            </Button>
          }
          slotTrigger={styledLabel}
        />
      ) : (
        styledLabel
      );
    };

    if (orders.length === 0) {
      return (
        <>
          {triggerLabel({})} <Styled.Output type={OutputType.Fiat} value={null} />
        </>
      );
    }

    if (orders.length === 1) {
      const order = orders[0];
      const { price, size, triggerPrice, timeInForce, type } = order;

      const shouldRenderValue =
        timeInForce?.name === TimeInForceOptions.IOC &&
        (isMarketOrderType(type) || price === triggerPrice);

      if (shouldRenderValue) {
        const isPartialPosition = !!(positionSize && Math.abs(size) < Math.abs(positionSize));
        const liquidationWarningSide = showLiquidationWarning(order) ? positionSide : undefined;

        return (
          <>
            {triggerLabel({ liquidationWarningSide })}
            <Styled.Output type={OutputType.Fiat} value={triggerPrice} />
            {isPartialPosition && (
              <WithHovercard
                align={'end'}
                side={'top'}
                hovercard={
                  isStopLossOrder(order) ? 'partial-close-stop-loss' : 'partial-close-take-profit'
                }
                slotButton={
                  <Button
                    action={ButtonAction.Primary}
                    size={ButtonSize.Small}
                    onClick={() => null} // TODO: CT-663 Implement onClick functionality
                  >
                    {stringGetter({ key: STRING_KEYS.EDIT_STOP_LOSS })}
                  </Button>
                }
                slotTrigger={
                  <Styled.PartialFillIcon>
                    <Icon iconName={IconName.PositionPartial} />
                  </Styled.PartialFillIcon>
                }
              />
            )}
          </>
        );
      }
    }

    return (
      <>
        {triggerLabel({})}
        {viewOrdersButton}
      </>
    );
  };
  return (
    <Styled.Cell>
      <Styled.Row>{renderOutput({ label: 'TP', orders: takeProfitOrders })}</Styled.Row>
      <Styled.Row>{renderOutput({ label: 'SL', orders: stopLossOrders })}</Styled.Row>
    </Styled.Cell>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Cell = styled.div`
  ${layoutMixins.column}
  gap: 0.25em;

  color: var(--color-text-1);
`;

Styled.Row = styled.span`
  ${layoutMixins.inlineRow}

  --item-height: 1.25rem;
`;

Styled.Label = styled.div<{ warning?: boolean }>`
  align-items: center;
  border: solid var(--border-width) var(--color-border);
  border-radius: 0.5em;
  display: flex;
  font: var(--font-tiny-book);
  height: var(--item-height);
  padding: 0 0.25rem;

  ${({ warning }) =>
    warning &&
    css`
      background-color: var(--color-warning);
      color: var(--color-black);
    `}
`;

Styled.Output = styled(Output)`
  font: var(--font-mini-medium);
`;

Styled.Button = styled(Button)`
  --button-height: var(--item-height);
  --button-padding: 0;
  --button-textColor: var(--color-text-1);
`;

Styled.ArrowIcon = styled(Icon)`
  stroke-width: 2;
`;

Styled.PartialFillIcon = styled.span`
  svg {
    display: block;

    width: 0.875em;
    height: 0.875em;
  }
`;
