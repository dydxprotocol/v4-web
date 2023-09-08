import type { Story } from '@ladle/react';

import { Details } from '@/components/Details';

import { StoryWrapper } from '.ladle/components';

import styled, { type AnyStyledComponent } from 'styled-components';
import { layoutMixins } from '@/styles/layoutMixins';

export const DetailsStory: Story<Parameters<typeof Details>> = () => (
  <StoryWrapper>
    <Styled.Resizable>
      <Details
        items={[
          {
            key: 'item-1',
            label: 'Item 1',
            tooltip: 'leverage',
            value: 'Value 1',
          },
          {
            key: 'item-2',
            label: 'Really really really long item name 2',
            tooltip: 'liquidation-price',
            value: 'Value 2',
          },
          {
            key: 'item-3',
            label: 'Item 3',
            tooltip: 'realized-pnl',
            value: 'Value 3',
          },
        ]}
      />
    </Styled.Resizable>
  </StoryWrapper>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Resizable = styled.section`
  ${layoutMixins.container}
  resize: horizontal;
  overflow: hidden;
  width: 14rem;

  padding: 1rem;
  background-color: var(--color-layer-3);
`;
