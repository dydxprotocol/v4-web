import { useState } from 'react';

import type { Story } from '@ladle/react';
import styled from 'styled-components';

import { Switch } from '@/components/Switch';

import { StoryWrapper } from '.ladle/components';

export const SwitchStory: Story<Parameters<typeof Switch>[0]> = (args) => {
  const [checked, setChecked] = useState(false);
  return (
    <StoryWrapper>
      <Switch {...args} checked={checked} onCheckedChange={setChecked} />
      <Switch {...args} checked={checked} onCheckedChange={setChecked} tw="ml-[1em] text-[2em]" />
    </StoryWrapper>
  );
};
SwitchStory.args = {
  disabled: false,
};
