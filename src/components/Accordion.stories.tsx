import type { Story } from '@ladle/react';

import { Accordion as AccordionComponent, AccordionProps } from '@/components/Accordion';

import { StoryWrapper } from '.ladle/components';

export const Accordion: Story<AccordionProps> = (args) => {
  return (
    <StoryWrapper>
      <AccordionComponent {...args} />
    </StoryWrapper>
  );
};

Accordion.args = {
  items: [
    {
      header: 'Question 1?',
      content: 'Answer 1.',
    },
    {
      header: 'Question 2?',
      content: 'Answer 2.',
    },
  ],
};