import styled, { AnyStyledComponent } from 'styled-components';
import type { Story } from '@ladle/react';

import { Link } from '@/components/Link';

import { StoryWrapper } from '.ladle/components';
import { layoutMixins } from '@/styles/layoutMixins';

export const LinkStory: Story<Parameters<typeof Link>> = (args) => {
  return (
    <StoryWrapper>
      <Styled.Container>
        <Link {...args}>Trade Now</Link>
      </Styled.Container>
    </StoryWrapper>
  );
};

LinkStory.args = {
  href: 'https://trade.dydx.exchange',
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Container = styled.section`
  background: var(--color-layer-3);

  ${layoutMixins.container}

  padding: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
`;
