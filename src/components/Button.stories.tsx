import type { Story } from '@ladle/react';

import { ButtonAction, ButtonShape, ButtonSize, ButtonState, ButtonType } from '@/constants/buttons';

import { Button, type ButtonProps } from '@/components/Button';

import { StoryWrapper } from '.ladle/components';

export const ButtonStory: Story<ButtonProps> = (args) => {
  return (
    <StoryWrapper>
      <Button {...args} />
    </StoryWrapper>
  );
};

ButtonStory.args = {
  children: 'Hello there!',
  href: '',
};

ButtonStory.argTypes = {
  type: {
    options: Object.values(ButtonType),
    control: { type: 'select' },
    defaultValue: ButtonType.Button,
  },
  action: {
    options: Object.values(ButtonAction),
    control: { type: 'select' },
    defaultValue: ButtonAction.Primary,
  },
  state: {
    options: Object.values(ButtonState),
    control: { type: 'select' },
    defaultValue: ButtonState.Default,
  },
  size: {
    options: Object.values(ButtonSize),
    control: { type: 'select' },
    defaultValue: ButtonSize.Base,
  },
  shape: {
    options: Object.values(ButtonShape),
    control: { type: 'select' },
    defaultValue: ButtonShape.Rectangle,
  },
};
