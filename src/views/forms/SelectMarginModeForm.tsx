import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { AbacusMarginMode, MARGIN_MODE_STRINGS, TradeInputField } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { formMixins } from '@/styles/formMixins';

import { Button } from '@/components/Button';
import { RadioButtonCards } from '@/components/RadioButtonCards';

import { getInputTradeMarginMode } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';

export const SelectMarginModeForm = ({
  onChangeMarginMode,
}: {
  onChangeMarginMode?: () => void;
}) => {
  const marginMode = useSelector(getInputTradeMarginMode, shallowEqual);
  const marginModeValue = marginMode?.rawValue;

  const stringGetter = useStringGetter();

  const setMarginMode = (value: string) => {
    abacusStateManager.setTradeValue({
      value,
      field: TradeInputField.marginMode,
    });
    onChangeMarginMode?.();
  };

  return (
    <$Form>
      <$RadioButtonCards
        value={marginModeValue}
        onValueChange={setMarginMode}
        radioItems={[
          {
            value: AbacusMarginMode.cross.rawValue,
            label: stringGetter({ key: MARGIN_MODE_STRINGS[AbacusMarginMode.cross.rawValue] }),
            body: (
              <$TertiarySpan>
                {stringGetter({ key: STRING_KEYS.CROSS_MARGIN_DESCRIPTION })}
              </$TertiarySpan>
            ),
          },
          {
            value: AbacusMarginMode.isolated.rawValue,
            label: stringGetter({ key: MARGIN_MODE_STRINGS[AbacusMarginMode.isolated.rawValue] }),
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
`;
const $TertiarySpan = styled.span`
  color: var(--color-text-0);
`;
const $Button = styled(Button)`
  width: 100%;
`;
