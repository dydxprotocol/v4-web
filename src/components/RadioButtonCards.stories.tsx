import { useState } from 'react';

import type { Story } from '@ladle/react';
import styled from 'styled-components';

import { RadioButtonCards } from '@/components/RadioButtonCards';

import { StoryWrapper } from '.ladle/components';

const exampleItems = [
  {
    value: '1',
    label: 'Item 1',
    body: (
      <div>
        <div>Card with body element</div>
      </div>
    ),
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

type RadioButtonCardStoryProps = {
  bgColor?: string;
  withSlotTop?: boolean;
  withSlotBottom?: boolean;
};

export const RadioButtonCardsStory: Story<RadioButtonCardStoryProps> = ({
  bgColor,
  withSlotTop,
  withSlotBottom,
}: RadioButtonCardStoryProps) => {
  const [item, setItem] = useState(exampleItems[0].value);
  return (
    <StoryWrapper>
      <StyledRadioButtonCards
        bgColor={bgColor}
        value={item}
        onValueChange={(value) => setItem(value)}
        radioItems={exampleItems}
        slotTop={withSlotTop && <h3>Radio Button Cards Header</h3>}
        slotBottom={withSlotBottom && <h3>Radio Button Cards Footer</h3>}
      />
    </StoryWrapper>
  );
};

const StyledRadioButtonCards = styled(RadioButtonCards)<{ bgColor?: string }>`
  ${({ bgColor }) => bgColor && `background-color: var(${bgColor});`}
`;

RadioButtonCardsStory.args = {
  withSlotTop: true,
  withSlotBottom: true,
};

RadioButtonCardsStory.argTypes = {
  bgColor: {
    options: [
      undefined,
      '--color-layer-0',
      '--color-layer-1',
      '--color-layer-2',
      '--color-layer-3',
      '--color-layer-4',
      '--color-layer-5',
      '--color-layer-6',
      '--color-layer-7',
    ],
    control: { type: 'select' },
    defaultValue: undefined,
  },
};
