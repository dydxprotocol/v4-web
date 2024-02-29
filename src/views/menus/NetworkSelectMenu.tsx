import styled, { type AnyStyledComponent } from 'styled-components';

import { useSelectedNetwork } from '@/hooks';

import { headerMixins } from '@/styles/headerMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { DropdownSelectMenu } from '@/components/DropdownSelectMenu';
import { useNetworks } from '@/views/menus/useNetworks';

type StyleProps = {
  align?: 'center' | 'start' | 'end';
  sideOffset?: number;
};

export const NetworkSelectMenu = ({ align, sideOffset }: StyleProps) => {
  const networks = useNetworks();
  const { switchNetwork, selectedNetwork } = useSelectedNetwork();

  return (
    <Styled.DropdownSelectMenu
      items={networks}
      value={selectedNetwork}
      onValueChange={switchNetwork}
      align={align}
      sideOffset={sideOffset}
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.DropdownSelectMenu = styled(DropdownSelectMenu)`
  ${headerMixins.dropdownTrigger}

  width: max-content;

  & > span:first-of-type {
    ${layoutMixins.textOverflow}
    max-width: 5.625rem;
    min-width: 0;
    white-space: nowrap;
  }
`;
