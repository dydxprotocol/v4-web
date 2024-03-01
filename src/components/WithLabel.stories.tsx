import { useState } from 'react';

import type { Story } from '@ladle/react';
import styled, { type AnyStyledComponent } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { Input, InputType } from '@/components/Input';
import { WithLabel } from '@/components/WithLabel';

import { StoryWrapper } from '.ladle/components';

export const WithLabelStory: Story<Parameters<typeof WithLabel>[0]> = (args) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  return (
    <StoryWrapper>
      <Styled.Column>
        <WithLabel {...args}>
          <Input
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
            placeholder="Type something"
            type={InputType.Text}
            value={firstName}
          />
        </WithLabel>
        <WithLabel label="Last Name">
          <Input
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
            placeholder="Type something"
            type={InputType.Text}
            value={lastName}
          />
        </WithLabel>
      </Styled.Column>
    </StoryWrapper>
  );
};

WithLabelStory.args = {
  label: 'First Name',
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Column = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;
