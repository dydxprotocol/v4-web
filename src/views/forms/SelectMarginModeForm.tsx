import { MarginMode } from '@/bonsai/forms/trade/types';
import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';

import { RadioButtonCards } from '@/components/RadioButtonCards';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { tradeFormActions } from '@/state/tradeForm';
import { getTradeFormValues } from '@/state/tradeFormSelectors';

export const SelectMarginModeForm = ({
  onChangeMarginMode,
}: {
  onChangeMarginMode?: () => void;
}) => {
  const marginMode = useAppSelector(getTradeFormValues).marginMode;
  const dispatch = useAppDispatch();

  const stringGetter = useStringGetter();

  const setMarginMode = (value: string) => {
    dispatch(tradeFormActions.setMarginMode(value as MarginMode));
    onChangeMarginMode?.();
  };

  return (
    <$Form>
      <$RadioButtonCards
        value={marginMode}
        onValueChange={setMarginMode}
        radioItems={[
          {
            value: MarginMode.CROSS,
            label: stringGetter({ key: STRING_KEYS.CROSS }),
            body: (
              <$TertiarySpan>
                {stringGetter({ key: STRING_KEYS.CROSS_MARGIN_DESCRIPTION })}
              </$TertiarySpan>
            ),
          },
          {
            value: MarginMode.ISOLATED,
            label: stringGetter({ key: STRING_KEYS.ISOLATED }),
            body: (
              <$TertiarySpan>
                {stringGetter({ key: STRING_KEYS.ISOLATED_MARGIN_DESCRIPTION })}
              </$TertiarySpan>
            ),
          },
        ]}
      />
    </$Form>
  );
};

const $Form = styled.form`
  ${formMixins.transfersForm}
`;
const $RadioButtonCards = styled(RadioButtonCards)`
  padding: 0;

  --radio-button-cards-item-checked-backgroundColor: var(--color-layer-1);
  --radio-button-cards-item-header-font: var(--font-medium-medium);
`;
const $TertiarySpan = tw.span`text-color-text-0 font-base-medium`;
