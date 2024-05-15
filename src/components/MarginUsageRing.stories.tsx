import type { Story } from '@ladle/react';
import styled, { AnyStyledComponent } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { MarginUsageRing } from '@/components/MarginUsageRing';

import { StoryWrapper } from '.ladle/components';

export const MarginUsageRingStory: Story<{ value: number }> = (args) => {
  return (
    <StoryWrapper>
      <$Container>
        <MarginUsageRing value={args.value / 100} />
      </$Container>
    </StoryWrapper>
  );
};

MarginUsageRingStory.args = {
  value: 0,
};

export const MarginUsageRingStyled: Story<{ value: number }> = (args) => {
  return (
    <StoryWrapper>
      <$Container>
        <$MarginUsageRing value={args.value / 100} />
      </$Container>
    </StoryWrapper>
  );
};

MarginUsageRingStyled.args = {
  value: 0,
};
const $MarginUsageRing = styled(MarginUsageRing)`
  color: var(--color-accent);
`;

const $Container = styled.section`
  background: var(--color-layer-3);

  ${layoutMixins.container}

  padding: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
`;
