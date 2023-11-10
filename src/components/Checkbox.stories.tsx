import { useState } from 'react';
import type { Story } from '@ladle/react';

import { Checkbox, CheckboxProps } from '@/components/Checkbox';

import { StoryWrapper } from '.ladle/components';

export const Checkboxes: Story<CheckboxProps> = (args) => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <StoryWrapper>
      <Checkbox
        {...args}
        checked={isChecked}
        onCheckedChange={setIsChecked}
        id="story-checkbox"
        label="example label"
      />
    </StoryWrapper>
  );
};

Checkboxes.args = {};
