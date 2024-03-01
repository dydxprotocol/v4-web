import { useState } from 'react';

import type { Story } from '@ladle/react';
import styled from 'styled-components';

import { SearchSelectMenu } from '@/components/SearchSelectMenu';

import { StoryWrapper } from '.ladle/components';

export const SearchSelectMenuStory: Story<Parameters<typeof SearchSelectMenu>[0]> = (args) => {
  const [selectedItem, setSelectedItem] = useState<string>();

  const exampleItems = [
    {
      group: 'items',
      groupLabel: 'Group of Items',
      items: Array.from({ length: 1000 }, (_, i) => ({
        value: i.toString(),
        label: `Item ${i}`,
        onSelect: () => setSelectedItem(`Item ${i}`),
      })),
    },
  ];

  return (
    <StoryWrapper>
      <Container>
        <SearchSelectMenu {...args} items={exampleItems}>
          {!selectedItem ? <span>Search and Select</span> : <span>{selectedItem}</span>}
        </SearchSelectMenu>
      </Container>
    </StoryWrapper>
  );
};

SearchSelectMenuStory.args = {
  withSearch: true,
};

SearchSelectMenuStory.argTypes = {};

const Container = styled.div`
  width: 400px;
`;
