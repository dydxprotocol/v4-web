import styled, { type AnyStyledComponent, css } from 'styled-components';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

export type PositionTableConditionalOrder = {
  size: number;
  triggerPrice: number;
};

type ElementProps = {
  stopLossOrders: PositionTableConditionalOrder[];
  takeProfitOrders: PositionTableConditionalOrder[];
  positionSize?: number;
  isDisabled?: boolean;
};

export const PositionsTriggersCell = ({
  stopLossOrders,
  takeProfitOrders,
  positionSize,
  isDisabled,
}: ElementProps) => {
  const stringGetter = useStringGetter();

  const onMultipleOrdersClick = () => {};

  const renderOutput = ({
    label,
    orders,
  }: {
    label: string;
    orders: PositionTableConditionalOrder[];
  }) => {
    if (orders.length === 0) {
      return (
        <>
          <Styled.Label>{label}</Styled.Label> <Styled.Output type={OutputType.Fiat} value={null} />
        </>
      );
    } else if (orders.length === 1) {
      const { triggerPrice, size } = orders[0];
      console.log(Math.abs(size), positionSize && Math.abs(positionSize))
      const isPartial = positionSize && Math.abs(size) < Math.abs(positionSize);

      return (
        <>
          <Styled.Label warning={isPartial}>{label}</Styled.Label>
          <Styled.Output type={OutputType.Fiat} value={triggerPrice} />
        </>
      ); //xcxc should i use limit or trigger price?
    } else {
      return (
        <>
          <Styled.Label>{label}</Styled.Label>
          <Styled.Button
            type={ButtonType.Link}
            action={ButtonAction.Navigation}
            size={ButtonSize.XSmall}
            onClick={onMultipleOrdersClick}
          >
            {stringGetter({ key: STRING_KEYS.VIEW_MORE })}
            {<Icon iconName={IconName.Arrow} />}
          </Styled.Button>
        </>
      );
    }
  };
  return (
    <Styled.Cell>
      <Styled.Row>
        {renderOutput({label: 'TP', orders: takeProfitOrders})}
      </Styled.Row>
      <Styled.Row>
        {renderOutput({label: 'SL', orders: stopLossOrders})}
      </Styled.Row>
    </Styled.Cell>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Cell = styled.div`
  ${layoutMixins.column}
  gap: 0.5ch;
`;

Styled.Row = styled.span`
  ${layoutMixins.inlineRow}
`;

Styled.Label = styled.div<{ warning?: boolean }>`
  align-items: center;
  border: solid var(--border-width) var(--color-border);
  border-radius: 0.5em;
  display: flex;
  font: var(--font-tiny-book);
  height: 1.25rem;
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
  --button-padding: 0;
`;
