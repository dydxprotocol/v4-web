import { useState } from 'react';

import type { Story } from '@ladle/react';
import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { TabGroup, type TabOption } from '@/components/TabGroup';

import { StoryWrapper } from '.ladle/components';

enum TabType {
  SPOT = 'spot',
  PERPETUALS = 'perpetuals',
  VAULTS = 'vaults',
}

const tabOptions: TabOption<TabType>[] = [
  { label: 'Spot', value: TabType.SPOT },
  { label: 'Perpetuals', value: TabType.PERPETUALS },
  { label: 'Vaults', value: TabType.VAULTS },
];

export const TabGroupStory: Story<Parameters<typeof TabGroup<TabType>>[0]> = (args) => {
  const { value } = args;
  const [selectedTab, setSelectedTab] = useState<TabType>(value);

  return (
    <StoryWrapper>
      <$Container>
        <TabGroup {...args} value={selectedTab} onTabChange={setSelectedTab} />
        <$Content>
          Selected tab: <strong>{selectedTab}</strong>
        </$Content>
      </$Container>
    </StoryWrapper>
  );
};

TabGroupStory.args = {
  value: TabType.PERPETUALS,
  options: tabOptions,
  onTabChange: () => {},
};

TabGroupStory.argTypes = {
  value: {
    options: Object.values(TabType),
    control: { type: 'select' },
    defaultValue: TabType.PERPETUALS,
  },
};

const $Container = styled.section`
  background: var(--color-layer-3);
  width: 400px;

  ${layoutMixins.container}

  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const $Content = styled.div`
  color: var(--color-text-1);
  font-size: 0.875rem;
`;
