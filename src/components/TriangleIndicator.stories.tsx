import { useEffect, useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import type { Story } from '@ladle/react';

import { layoutMixins } from '@/styles/layoutMixins';

import { TriangleIndicator, TriangleIndicatorProps } from '@/components/TriangleIndicator';

import { StoryWrapper } from '.ladle/components';
import { MustBigNumber } from '@/lib/numbers';

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
