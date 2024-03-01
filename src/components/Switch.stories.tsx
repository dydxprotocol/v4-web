import { useState } from 'react';
import type { Story } from '@ladle/react';
import styled from 'styled-components';

import { StoryWrapper } from '.ladle/components';

import { Switch } from '@/components/Switch';

export const SwitchStory: Story<Parameters<typeof Switch>[0]> = (args) => {
  const [checked, setChecked] = useState(false);
  return (
    <StoryWrapper>
      <Switch {...args} checked={checked} onCheckedChange={setChecked} />
      <StyledSwitch {...args} checked={checked} onCheckedChange={setChecked} />
    </StoryWrapper>
  );
};

const StyledSwitch = styled(Switch)`
  font-size: 2em;
  margin-left: 1em;
`;

SwitchStory.args = {
  disabled: false,
};
