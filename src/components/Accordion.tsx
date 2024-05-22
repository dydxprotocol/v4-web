import { Content, Header, Item, Root, Trigger } from '@radix-ui/react-accordion';
import styled, { keyframes } from 'styled-components';

import { PlusIcon } from '@/icons';
import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

export type AccordionItem = {
  header: React.ReactNode;
  content: React.ReactNode;
};

export type AccordionProps = {
  items: AccordionItem[];
  className?: string;
};

export const Accordion = ({ items, className }: AccordionProps) => (
  <$Root className={className} type="single" collapsible>
    {items.map(({ header, content }, idx) => (
      // eslint-disable-next-line react/no-array-index-key
      <$Item key={idx} value={idx.toString()}>
        <Header>
          <$Trigger>
            {header}
            <$Icon>
              <PlusIcon />
            </$Icon>
          </$Trigger>
        </Header>
        <$Content>{content}</$Content>
      </$Item>
    ))}
  </$Root>
);
const $Root = styled(Root)`
  --accordion-paddingY: 1rem;
  --accordion-paddingX: 1rem;

  @media ${breakpoints.notTablet} {
    --accordion-paddingX: 1.5rem;
  }

  > *:not(:last-child) {
    border-bottom: var(--border-width) solid var(--border-color);
  }
`;

const $Item = styled(Item)``;

const $Icon = styled.div`
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

const $Trigger = styled(Trigger)`
  ${layoutMixins.spacedRow}
  width: 100%;
  padding: var(--accordion-paddingY) var(--accordion-paddingX);
  gap: 0.5rem;

  color: var(--color-text-1);
  text-align: start;

  &:hover {
    ${$Icon} {
      color: var(--color-text-2);
      filter: brightness(var(--hover-filter-base));
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

const $Content = styled(Content)`
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
