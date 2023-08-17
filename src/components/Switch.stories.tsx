import { useState } from 'react';
import type { Story } from '@ladle/react';
import styled from 'styled-components';

import { StoryWrapper } from '.ladle/components';

import { Switch } from '@/components/Switch';

type SwitchProps = Parameters<typeof Switch>;

export const SwitchStory: Story<SwitchProps> = (args: SwitchProps) => {
  const [checked, setChecked] = useState(false);
  return (
    <StoryWrapper>
      <Switch checked={checked} onCheckedChange={setChecked} {...args} />
      <StyledSwitch checked={checked} onCheckedChange={setChecked} {...args} />
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
