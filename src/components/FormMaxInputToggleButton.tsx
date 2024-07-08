import styled from 'styled-components';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';

import { Icon, IconName } from './Icon';
import { ToggleButton } from './ToggleButton';

type ElementProps = {
  size?: ButtonSize;
  isInputEmpty: boolean;
  isLoading: boolean;
  onPressedChange: (isPressed: boolean) => void;
};

export const FormMaxInputToggleButton = ({
  size = ButtonSize.Small,
  isInputEmpty,
  isLoading,
  onPressedChange,
}: ElementProps) => {
  const stringGetter = useStringGetter();

  return (
    <$FormMaxInputToggleButton
      size={size}
      isPressed={!isInputEmpty}
      disabled={isLoading}
      onPressedChange={onPressedChange}
      shape={isInputEmpty ? ButtonShape.Rectangle : ButtonShape.Circle}
    >
      {isInputEmpty ? stringGetter({ key: STRING_KEYS.MAX }) : <Icon iconName={IconName.Close} />}
    </$FormMaxInputToggleButton>
  );
};

const $FormMaxInputToggleButton = styled(ToggleButton)`
  ${formMixins.inputInnerToggleButton}

  --button-padding: 0 0.5rem;
  --button-backgroundColor: var(--color-accent);
  --button-textColor: var(--color-text-button);
`;
