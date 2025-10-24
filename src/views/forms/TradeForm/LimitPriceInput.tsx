import { BonsaiHelpers } from '@/bonsai/ontology';
import { NumberFormatValues } from 'react-number-format';
import styled from 'styled-components';

import { ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { USD_DECIMALS } from '@/constants/numbers';

import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';

import { Button } from '@/components/Button';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { Tag } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { tradeFormActions } from '@/state/tradeForm';
import { getTradeFormValues } from '@/state/tradeFormSelectors';

import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

export const LimitPriceInput = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const tradeFormValues = useAppSelector(getTradeFormValues);
  const { limitPrice } = tradeFormValues;
  const { tickSizeDecimals } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const midMarketPrice = useAppSelector(BonsaiHelpers.currentMarket.midPrice.data)?.toNumber();

  const onMidMarketPriceClick = () => {
    if (!midMarketPrice) return;
    dispatch(
      tradeFormActions.setLimitPrice(
        MustBigNumber(midMarketPrice).toFixed(tickSizeDecimals ?? USD_DECIMALS)
      )
    );
  };

  const midMarketPriceButton = (
    <$MidPriceButton onClick={onMidMarketPriceClick} size={ButtonSize.XSmall}>
      {stringGetter({ key: STRING_KEYS.MID_MARKET_PRICE_SHORT })}
    </$MidPriceButton>
  );

  return (
    <FormInput
      id="limit-price"
      type={InputType.Currency}
      label={
        <>
          <WithTooltip tooltip="limit-price" side="right">
            {stringGetter({ key: STRING_KEYS.LIMIT_PRICE })}
          </WithTooltip>
          <Tag>USD</Tag>
        </>
      }
      onChange={({ value }: NumberFormatValues) => {
        dispatch(tradeFormActions.setLimitPrice(value));
      }}
      value={limitPrice ?? ''}
      decimals={tickSizeDecimals ?? USD_DECIMALS}
      slotRight={midMarketPrice ? midMarketPriceButton : undefined}
    />
  );
};

const $MidPriceButton = styled(Button)`
  ${formMixins.inputInnerButton}
`;
