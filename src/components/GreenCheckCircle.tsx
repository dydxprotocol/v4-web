import styled, { AnyStyledComponent } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';

export const GreenCheckCircle = ({ className }: { className?: string }) => (
  <Styled.GreenCheckCircle className={className}>
    <Icon iconName={IconName.Check} />
  </Styled.GreenCheckCircle>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.GreenCheckCircle = styled.div`
  ${layoutMixins.stack}

  --icon-size: 1.25rem;
  --icon-border-width: 3px;

  width: var(--icon-size);
  height: var(--icon-size);
  border-radius: 50%;

  align-items: center;

  &:before {
    content: '';
    width: calc(var(--icon-size) - var(--icon-border-width) * 2);
    height: calc(var(--icon-size) - var(--icon-border-width) * 2);
    border: solid var(--icon-border-width) var(--color-positive);
    border-radius: 50%;
    opacity: 0.6;
  }

  svg {
    width: calc(var(--icon-size) / 3);
    height: calc(var(--icon-size) / 3);

    color: var(--color-positive);
    justify-self: center;
  }
`;
