import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { HorizontalSeparatorFiller } from '@/components/Separator';

import { testFlags } from '@/lib/testFlags';

import { LimitPriceInputs } from './LimitPriceInputs';
import { OrderSizeInput } from './OrderSizeInput';

type ElementProps = {
  symbol: string;
  stepSizeDecimals?: number;
  tickSizeDecimals?: number;
};

type StyleProps = {
  className?: string;
};

export const AdvancedTriggersOptions = ({
  symbol,
  stepSizeDecimals,
  tickSizeDecimals,
  className,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();

  return (
    <Styled.Container>
      <Styled.Header>
        {stringGetter({ key: STRING_KEYS.ADVANCED })}
        <HorizontalSeparatorFiller />
      </Styled.Header>
      {/* TODO: CT-625 Update with values from abacus */}
      <Styled.Content>
        <OrderSizeInput className={className} symbol={symbol} stepSizeDecimals={stepSizeDecimals} />
        {testFlags.enableConditionalLimitOrders && (
          <LimitPriceInputs className={className} tickSizeDecimals={tickSizeDecimals} />
        )}
      </Styled.Content>
    </Styled.Container>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Container = styled.div`
  ${layoutMixins.column}
`;

Styled.Header = styled.h3`
  ${layoutMixins.inlineRow}
  font: var(--font-small-medium);
  color: var(--color-text-0);

  margin-bottom: 0.5rem;
`;

Styled.Content = styled.div`
  display: grid;
  gap: 0.5em;
`;
