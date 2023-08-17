import type { Story } from '@ladle/react';
import styled, { AnyStyledComponent } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { Tabs } from '@/components/Tabs';

import { StoryWrapper } from '.ladle/components';

enum TabItem {
  Item1 = 'Item1',
  Item2 = 'Item2',
  Item3 = 'Item3',
}

const TabItems = [
  {
    value: TabItem.Item1,
    label: 'Item 1',
    content: <div>Item 1 Content</div>,
  },
  {
    value: TabItem.Item2,
    label: 'Item 2',
    content: <div>Item 2 Content</div>,
  },
  {
    value: TabItem.Item3,
    label: 'Item 3',
    content: <div>Item 3 Content</div>,
  },
];

export const TabsStory: Story<Parameters<typeof Tabs>> = (args) => {
  return (
    <StoryWrapper>
      <Styled.Container>
        <Tabs items={TabItems} {...args} />
      </Styled.Container>
    </StoryWrapper>
  );
};

TabsStory.args = {
  fullWidthTabs: false,
};

TabsStory.argTypes = {
  defaultValue: {
    options: Object.values(TabItem),
    control: { type: 'select' },
    defaultValue: TabItem.Item1,
  },
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Container = styled.section`
  background: var(--color-layer-3);
  width: 400px;

  ${layoutMixins.container}

  padding: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
`;
