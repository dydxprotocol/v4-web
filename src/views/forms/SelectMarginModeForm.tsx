import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { AbacusMarginMode, MARGIN_MODE_STRINGS, TradeInputField } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';

import { RadioButtonCards } from '@/components/RadioButtonCards';

import { useAppSelector } from '@/state/appTypes';
import { getInputTradeMarginMode } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';

export const SelectMarginModeForm = ({
  onChangeMarginMode,
}: {
  onChangeMarginMode?: () => void;
}) => {
  const marginMode = useAppSelector(getInputTradeMarginMode, shallowEqual);
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
            value: AbacusMarginMode.Cross.rawValue,
            label: stringGetter({ key: MARGIN_MODE_STRINGS[AbacusMarginMode.Cross.rawValue] }),
            body: (
              <$TertiarySpan>
                {stringGetter({ key: STRING_KEYS.CROSS_MARGIN_DESCRIPTION })}
              </$TertiarySpan>
            ),
          },
          {
            value: AbacusMarginMode.Isolated.rawValue,
            label: stringGetter({ key: MARGIN_MODE_STRINGS[AbacusMarginMode.Isolated.rawValue] }),
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
const $TertiarySpan = styled.span`
  color: var(--color-text-0);
  font: var(--font-base-medium);
`;
