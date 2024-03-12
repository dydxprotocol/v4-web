import { useState, type FormEvent } from 'react';

import styled, { AnyStyledComponent } from 'styled-components';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { formMixins } from '@/styles/formMixins';

import { Button } from '@/components/Button';
import { RadioButtonCards } from '@/components/RadioButtonCards';

export const SelectMarginModeForm = ({
  onChangeMarginMode,
}: {
  onChangeMarginMode?: () => void;
}) => {
  const [marginMode, setMarginMode] = useState<string>('cross');

  const stringGetter = useStringGetter();
  const onSubmit = () => {
    onChangeMarginMode?.();
  };

  const getLabel = (marginMode: string) =>
    ({
      cross: stringGetter({ key: STRING_KEYS.CROSS_MARGIN }),
      isolated: stringGetter({ key: STRING_KEYS.ISOLATED_MARGIN }),
    }[marginMode]);

  return (
    <Styled.Form
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Styled.RadioButtonCards
        value={marginMode}
        onValueChange={setMarginMode}
        radioItems={[
          {
            value: 'cross',
            label: getLabel('cross'),
            body: (
              <Styled.TertiarySpan>
                {stringGetter({ key: STRING_KEYS.CROSS_MARGIN_DESCRIPTION })}
              </Styled.TertiarySpan>
            ),
          },
          {
            value: 'isolated',
            label: getLabel('isolated'),
            body: (
              <Styled.TertiarySpan>
                {stringGetter({ key: STRING_KEYS.ISOLATED_MARGIN_DESCRIPTION })}
              </Styled.TertiarySpan>
            ),
          },
        ]}
      />

      <Styled.Button action={ButtonAction.Primary} type={ButtonType.Submit}>
        {stringGetter({ key: STRING_KEYS.SELECT, params: { SELECTION: getLabel(marginMode) } })}
      </Styled.Button>
    </Styled.Form>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Form = styled.form`
  ${formMixins.transfersForm}
`;

Styled.RadioButtonCards = styled(RadioButtonCards)`
  padding: 0;

  --radio-button-cards-item-checked-backgroundColor: var(--color-layer-1);
`;

Styled.TertiarySpan = styled.span`
  color: var(--color-text-0);
`;

Styled.Button = styled(Button)`
  width: 100%;
`;
