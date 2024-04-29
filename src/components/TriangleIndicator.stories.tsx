import { useState } from 'react';

import type { Story } from '@ladle/react';
import styled, { AnyStyledComponent } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { TriangleIndicator } from '@/components/TriangleIndicator';

import { MustBigNumber } from '@/lib/numbers';

import { StoryWrapper } from '.ladle/components';

export const TriangleIndicatorStory: Story<{ value: number }> = (args) => {
  const [valueBN] = useState(MustBigNumber(args.value));

  return (
    <StoryWrapper>
      <Styled.Container>
        <TriangleIndicator value={valueBN} />
      </Styled.Container>
    </StoryWrapper>
  );
};

TriangleIndicatorStory.args = {
  value: 0,
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
