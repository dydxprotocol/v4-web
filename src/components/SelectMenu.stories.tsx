import { useState } from 'react';

import type { Story } from '@ladle/react';
import styled, { AnyStyledComponent } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { SelectItem, SelectMenu } from '@/components/SelectMenu';

import { StoryWrapper } from '.ladle/components';

const exampleItems: { value: string; label: string }[] = [
  {
    value: '1',
    label: 'Item 1',
  },
  {
    value: '2',
    label: 'Item 2',
  },
  {
    value: '3',
    label: 'Item 3',
  },
  {
    value: '4',
    label: 'Item 4',
  },
];

export const SelectMenuStory: Story<Parameters<typeof SelectMenu>[0]> = (args) => {
  const [value, setValue] = useState(exampleItems[0].value);
  const [value2, setValue2] = useState(exampleItems[2].value);

  return (
    <StoryWrapper>
      <$Container>
        <SelectMenu value={value} onValueChange={setValue}>
          {exampleItems.map(({ value, label }) => (
            <SelectItem key={value} value={value} label={label} />
          ))}
        </SelectMenu>

        <SelectMenu value={value2} onValueChange={setValue2}>
          {exampleItems.map(({ value, label }) => (
            <SelectItem key={value} value={value} label={label} />
          ))}
        </SelectMenu>
      </$Container>
    </StoryWrapper>
  );
};
const $Container = styled.section`
  background: var(--color-layer-3);

  ${layoutMixins.container}

  padding: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
`;
