import { useState } from 'react';

import type { Story } from '@ladle/react';
import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { TriangleIndicator } from '@/components/TriangleIndicator';

import { MustBigNumber } from '@/lib/numbers';

import { StoryWrapper } from '.ladle/components';

export const TriangleIndicatorStory: Story<{ value: number }> = ({ value }: { value: number }) => {
  const [valueBN] = useState(MustBigNumber(value));

  return (
    <StoryWrapper>
      <$Container>
        <TriangleIndicator value={valueBN} />
      </$Container>
    </StoryWrapper>
  );
};

TriangleIndicatorStory.args = {
  value: 0,
};
const $Container = styled.section`
  background: var(--color-layer-3);

  ${layoutMixins.container}

  padding: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
`;
