import type { Story } from '@ladle/react';

import { Icon, IconName } from '@/components/Icon';

import { StoryWrapper } from '.ladle/components';

export const IconStory: Story<Parameters<typeof Icon>> = (args) => {
  return (
    <StoryWrapper>
      <Icon {...args} />
    </StoryWrapper>
  );
};

const iconNames = Object.values(IconName);

IconStory.argTypes = {
  iconName: {
    options: iconNames,
    control: { type: 'select' },
    defaultValue: iconNames[0],
  },
};
