import styled, { css } from 'styled-components';

import { Icon, IconName } from '@/components/Icon';

type ElementProps = {
  iconName: IconName;
  isOpen?: boolean;
};

type StyleProps = {
  className?: string;
};

export const DropdownIcon = ({
  iconName = IconName.Triangle,
  isOpen,
  className,
}: ElementProps & StyleProps) => {
  return (
    <$DropdownIcon aria-hidden="true" isOpen={isOpen} className={className}>
      <Icon iconName={iconName} aria-hidden="true" />
    </$DropdownIcon>
  );
};

const $DropdownIcon = styled.span<{ isOpen?: boolean }>`
  display: inline-flex;
  transition: transform 0.3s var(--ease-out-expo);
  font-size: 0.375em;

  ${({ isOpen }) =>
    isOpen &&
    css`
      transform: scaleY(-1);
    `}
`;
