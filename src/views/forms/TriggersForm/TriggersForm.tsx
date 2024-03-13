import { useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';

import { type SubaccountOrder } from '@/constants/abacus';
import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Output, OutputType } from '@/components/Output';

import { getPositionDetails } from '@/state/accountSelectors';

import { AdvancedTriggersOptions } from './AdvancedTriggersOptions';
import { TriggerOrderInputs } from './TriggerOrderInputs';

type ElementProps = {
  marketId: string;
  stopLossOrders: SubaccountOrder[];
  takeProfitOrders: SubaccountOrder[];
};

export const TriggersForm = ({ marketId, stopLossOrders, takeProfitOrders }: ElementProps) => {
  const stringGetter = useStringGetter();

  const { asset, entryPrice, stepSizeDecimals, tickSizeDecimals, oraclePrice } =
    useSelector(getPositionDetails(marketId)) || {};
  const symbol = asset?.id ?? '';

  const isDisabled = false; // TODO: CT-625 Update based on whether values are populated based on abacus

  const priceInfo = (
    <Styled.PriceBox>
      <Styled.PriceRow>
        <Styled.PriceLabel>{stringGetter({ key: STRING_KEYS.AVG_ENTRY_PRICE })}</Styled.PriceLabel>
        <Styled.Price type={OutputType.Fiat} value={entryPrice?.current} />
      </Styled.PriceRow>
      <Styled.PriceRow>
        <Styled.PriceLabel>{stringGetter({ key: STRING_KEYS.ORACLE_PRICE })}</Styled.PriceLabel>
        <Styled.Price type={OutputType.Fiat} value={oraclePrice} />
      </Styled.PriceRow>
    </Styled.PriceBox>
  );

  return (
    <Styled.Form>
      {priceInfo}
      {
        <TriggerOrderInputs
          symbol={symbol}
          tooltipId={'take-profit'}
          stringKeys={{
            header: STRING_KEYS.TAKE_PROFIT,
            price: STRING_KEYS.TP_PRICE,
            output: STRING_KEYS.GAIN,
          }}
          orders={takeProfitOrders}
        ></TriggerOrderInputs>
      }
      {
        <TriggerOrderInputs
          symbol={symbol}
          tooltipId={'stop-loss'}
          stringKeys={{
            header: STRING_KEYS.STOP_LOSS,
            price: STRING_KEYS.SL_PRICE,
            output: STRING_KEYS.LOSS,
          }}
          orders={stopLossOrders}
          tickSizeDecimals={tickSizeDecimals}
        ></TriggerOrderInputs>
      }
      {
        <AdvancedTriggersOptions
          symbol={symbol}
          stepSizeDecimals={stepSizeDecimals}
          tickSizeDecimals={tickSizeDecimals}
        ></AdvancedTriggersOptions>
      }
      <Button action={ButtonAction.Primary} state={{ isDisabled }}>
        {isDisabled
          ? stringGetter({ key: STRING_KEYS.ENTER_TRIGGERS })
          : stringGetter({ key: STRING_KEYS.ADD_TRIGGERS })}
      </Button>
    </Styled.Form>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Form = styled.form`
  ${layoutMixins.column}
  gap: 1.25ch;
`;

Styled.PriceBox = styled.div`
  background-color: var(--color-layer-2);
  border-radius: 0.5em;
  font: var(--font-base-medium);
`;

Styled.PriceRow = styled.div`
  ${layoutMixins.spacedRow}
  padding: 0.625em 0.75em;
`;

Styled.PriceLabel = styled.h3`
  color: var(--color-text-0);
`;

Styled.Price = styled(Output)`
  color: var(--color-text-2);
`;
