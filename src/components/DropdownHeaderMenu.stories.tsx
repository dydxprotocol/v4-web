import { useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import type { Story } from '@ladle/react';

import { DropdownHeaderMenu } from '@/components/DropdownHeaderMenu';

import { StoryWrapper } from '.ladle/components';
import { layoutMixins } from '@/styles/layoutMixins';

export const DropdownHeaderMenuStory: Story<Parameters<typeof DropdownHeaderMenu>> = (args) => {
  const [view, setView] = useState<string | undefined>();

  const exampleItems = [
    {
      value: 'Positions',
      label: 'Positions',
      description: 'Monitor your exposure & risk',
      onSelect: () => setView('Positions'),
    },
    {
      value: 'Orders',
      label: 'Orders',
      description: 'Track an order through its lifecycle',
      onSelect: () => setView('Orders'),
    },
    {
      value: 'Fills',
      label: 'Fills',
      description: 'All fee-generating trading activity',
      onSelect: () => setView('Fills'),
    },
    {
      value: 'Transfers',
      label: 'Transfers',
      description: 'Movements into & out of your account',
      onSelect: () => setView('Transfers'),
    },
    {
      value: 'Fees',
      label: 'Fees',
      description: 'See how much you spent trading',
      onSelect: () => setView('Fees'),
    },
  ];

  return (
    <StoryWrapper>
      <Styled.Container>
        <DropdownHeaderMenu items={exampleItems}>{view ?? 'Overview'}</DropdownHeaderMenu>
      </Styled.Container>
    </StoryWrapper>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Container = styled.section`
  ${layoutMixins.container}
`;
