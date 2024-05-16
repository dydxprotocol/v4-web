import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useEnvFeatures, useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { HorizontalSeparatorFiller } from '@/components/Separator';

import { LimitPriceInputs } from './LimitPriceInputs';
import { OrderSizeInput } from './OrderSizeInput';

type ElementProps = {
  symbol: string;
  existsLimitOrder: boolean;
  size: number | null;
  positionSize: number | null;
  differingOrderSizes: boolean;
  multipleTakeProfitOrders: boolean;
  multipleStopLossOrders: boolean;
  stepSizeDecimals?: number;
  tickSizeDecimals?: number;
};

type StyleProps = {
  className?: string;
};

export const AdvancedTriggersOptions = ({
  symbol,
  existsLimitOrder,
  size,
  positionSize,
  differingOrderSizes,
  multipleTakeProfitOrders,
  multipleStopLossOrders,
  stepSizeDecimals,
  tickSizeDecimals,
  className,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const { isSlTpLimitOrdersEnabled } = useEnvFeatures();

  return (
    <$Container>
      <$Header>
        {stringGetter({ key: STRING_KEYS.ADVANCED })}
        <HorizontalSeparatorFiller />
      </$Header>
      <$Content>
        <OrderSizeInput
          className={className}
          differingOrderSizes={differingOrderSizes}
          symbol={symbol}
          size={size}
          positionSize={positionSize}
          stepSizeDecimals={stepSizeDecimals}
        />
        {isSlTpLimitOrdersEnabled && (
          <LimitPriceInputs
            className={className}
            existsLimitOrder={existsLimitOrder}
            multipleTakeProfitOrders={multipleTakeProfitOrders}
            multipleStopLossOrders={multipleStopLossOrders}
            tickSizeDecimals={tickSizeDecimals}
          />
        )}
      </$Content>
    </$Container>
  );
};
const $Container = styled.div`
  ${layoutMixins.column}
`;

const $Header = styled.h3`
  ${layoutMixins.inlineRow}
  font: var(--font-small-medium);
  color: var(--color-text-0);

  margin-bottom: 0.5rem;
`;

const $Content = styled.div`
  display: grid;
  gap: 0.5em;
`;
