import type { Story } from '@ladle/react';
import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { Tabs } from '@/components/Tabs';

import { StoryWrapper } from '.ladle/components';

enum TabItem {
  Item1 = 'Item1',
  Item2 = 'Item2',
  Item3 = 'Item3',
}

export const TabsStory: Story<Parameters<typeof Tabs>[0]> = (args) => {
  return (
    <StoryWrapper>
      <$Container>
        <Tabs {...args} />
      </$Container>
    </StoryWrapper>
  );
};

TabsStory.args = {
  fullWidthTabs: false,
  items: [
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
  ],
};

TabsStory.argTypes = {
  defaultValue: {
    options: Object.values(TabItem),
    control: { type: 'select' },
    defaultValue: TabItem.Item1,
  },
};
const $Container = styled.section`
  background: var(--color-layer-3);
  width: 400px;

  ${layoutMixins.container}

  padding: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
`;
