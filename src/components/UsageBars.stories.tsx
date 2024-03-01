import type { Story } from '@ladle/react';
import styled, { AnyStyledComponent } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { UsageBars } from '@/components/UsageBars';

import { StoryWrapper } from '.ladle/components';

export const UsageBarsStory: Story<{ value: number }> = (args) => (
  <StoryWrapper>
    <Styled.Container>
      <UsageBars {...args} />
    </Styled.Container>
  </StoryWrapper>
);

UsageBarsStory.args = {
  value: 0,
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Container = styled.section`
  ${layoutMixins.container}
  background: var(--color-layer-3);

  padding: 1rem;
`;
