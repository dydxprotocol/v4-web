import type { Story } from '@ladle/react';

import { ButtonAction, ButtonShape, ButtonSize, ButtonState, ButtonType } from '@/constants/buttons';

import { IconName } from '@/components/Icon';
import { IconButton, type IconButtonProps } from '@/components/IconButton';

import { StoryWrapper } from '.ladle/components';

export const IconButtonStory: Story<IconButtonProps> = (args) => {
  return (
    <StoryWrapper>
      <IconButton {...args} />
    </StoryWrapper>
  );
};

IconButtonStory.args = {
  href: '',
};

IconButtonStory.argTypes = {
  iconName: {
    options: Object.values(IconName),
    control: { type: 'select' },
    defaultValue: IconName.Caret,
  },
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
    defaultValue: ButtonShape.Circle,
  },
  isToggle: {
    options: [true, false],
    control: { type: 'select' },
    defaultValue: false,
  }
};
