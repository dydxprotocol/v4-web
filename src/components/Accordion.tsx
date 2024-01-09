import styled, { keyframes, type AnyStyledComponent } from 'styled-components';

import { Root, Item, Header, Trigger, Content } from '@radix-ui/react-accordion';

import { layoutMixins } from '@/styles/layoutMixins';
import { breakpoints } from '@/styles';

import { PlusIcon } from '@/icons';

export type AccordionItem = {
  header: React.ReactNode;
  content: React.ReactNode;
};

export type AccordionProps = {
  items: AccordionItem[];
  className?: string;
};

export const Accordion = ({ items, className }: AccordionProps) => (
  <Styled.Root className={className} type="single" collapsible>
    {items.map(({ header, content }, idx) => (
      <Styled.Item key={idx} value={idx.toString()}>
        <Header>
          <Styled.Trigger>
            {header}
            <Styled.Icon>
              <PlusIcon />
            </Styled.Icon>
          </Styled.Trigger>
        </Header>
        <Styled.Content>{content}</Styled.Content>
      </Styled.Item>
    ))}
  </Styled.Root>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Root = styled(Root)`
  --accordion-paddingY: 1rem;
  --accordion-paddingX: 1rem;

  @media ${breakpoints.notTablet} {
    --accordion-paddingX: 1.5rem;
  }

  > *:not(:last-child) {
    border-bottom: var(--border-width) solid var(--border-color);
  }
`;

Styled.Item = styled(Item)``;

Styled.Icon = styled.div`
  display: inline-flex;
  justify-content: center;
  align-items: center;

  width: 2.25rem;
  height: 2.25rem;

  --color-border: var(--color-layer-6);
  color: var(--color-text-1);
  background-color: var(--color-layer-5);
  border: solid var(--border-width) var(--color-border);
  border-radius: 50%;
  font: var(--font-small-book);

  svg {
    height: 1.125em;
    width: 1.125em;
  }
`;

Styled.Trigger = styled(Trigger)`
  ${layoutMixins.spacedRow}
  width: 100%;
  padding: var(--accordion-paddingY) var(--accordion-paddingX);
  gap: 0.5rem;

  color: var(--color-text-1);
  text-align: start;

  &:hover {
    ${Styled.Icon} {
      color: var(--color-text-2);
      filter: brightness(1.1);
    }
  }

  svg {
    color: var(--color-text-0);
    transition: transform 0.3s var(--ease-out-expo);
  }

  &[data-state='open'] svg {
    transform: rotate(45deg);
  }
`;

Styled.Content = styled(Content)`
  overflow: hidden;
  margin: 0 var(--accordion-paddingX) var(--accordion-paddingY);

  color: var(--color-text-0);

  &[data-state='open'] {
    animation: ${keyframes`
      from {
        height: 0;
      }
      to {
        height: var(--radix-accordion-content-height);
      }
    `} 0.3s var(--ease-out-expo);
  }

  &[data-state='closed'] {
    animation: ${keyframes`
      from {
        height: var(--radix-accordion-content-height);
      }
      to {
        height: 0;
      }
    `} 0.1s var(--ease-in-expo);
  }
`;
