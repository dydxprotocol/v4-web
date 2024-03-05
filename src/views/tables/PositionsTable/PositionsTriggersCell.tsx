import styled, { type AnyStyledComponent, css } from 'styled-components';

import { AbacusOrderTimeInForces, AbacusOrderTypes, Nullable } from '@/constants/abacus';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { TimeInForceOptions } from '@/constants/trade';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';

import { isMarketOrderType } from '@/lib/orders';

export type PositionTableConditionalOrder = {
  price: number;
  size: number;
  triggerPrice: Nullable<number>;
  timeInForce: Nullable<AbacusOrderTimeInForces>;
  type: AbacusOrderTypes;
};

type ElementProps = {
  stopLossOrders: PositionTableConditionalOrder[];
  takeProfitOrders: PositionTableConditionalOrder[];
  positionSize?: number | null;
  isDisabled?: boolean;
};

export const PositionsTriggersCell = ({
  stopLossOrders,
  takeProfitOrders,
  positionSize,
  isDisabled, // TODO: CT-656 Disable onViewOrdersClick behavior when isDisabled
}: ElementProps) => {
  const stringGetter = useStringGetter();

  const onViewOrdersClick = () => {
    // TODO: CT-655
  };

  const renderOutput = ({
    label,
    orders,
  }: {
    label: string;
    orders: PositionTableConditionalOrder[];
  }) => {
    const triggerLabel = (warning: boolean = false) => (
      <Styled.Label warning={warning}>{label}</Styled.Label>
    );
    const viewOrdersButton = (
      <Styled.Button
        type={ButtonType.Link}
        action={ButtonAction.Navigation}
        size={ButtonSize.XSmall}
        onClick={onViewOrdersClick}
      >
        {stringGetter({ key: STRING_KEYS.VIEW_ORDERS })}
        {<Icon iconName={IconName.Arrow} />}
      </Styled.Button>
    );

    if (orders.length === 0) {
      return (
        <>
          {triggerLabel()} <Styled.Output type={OutputType.Fiat} value={null} />
        </>
      );
    } else if (orders.length === 1) {
      const { price, size, triggerPrice, timeInForce, type } = orders[0];

      const isPartial = !!(positionSize && Math.abs(size) < Math.abs(positionSize));
      const shouldRenderValue =
        timeInForce?.name === TimeInForceOptions.IOC &&
        (isMarketOrderType(type) || price === triggerPrice);

      return shouldRenderValue ? (
        <>
          {triggerLabel(isPartial)}
          <Styled.Output type={OutputType.Fiat} value={triggerPrice} />
          {/* // TODO: CT-654 Update styling + confirm logic for partial positions */}
        </>
      ) : (
        <>
          {triggerLabel()}
          {viewOrdersButton}
        </>
      );
    } else {
      return (
        <>
          {triggerLabel()}
          {viewOrdersButton}
        </>
      );
    }
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
`;
