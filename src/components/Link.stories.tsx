import type { Story } from '@ladle/react';
import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { Link } from '@/components/Link';

import { StoryWrapper } from '.ladle/components';

export const LinkStory: Story<Parameters<typeof Link>[0]> = (args) => {
  return (
    <StoryWrapper>
      <$Container>
        <Link {...args}>Trade Now</Link>
      </$Container>
    </StoryWrapper>
  );
};

LinkStory.args = {
  href: 'https://trade.dydx.exchange',
};
const $Container = styled.section`
  background: var(--color-layer-3);

  ${layoutMixins.container}

  padding: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
`;
