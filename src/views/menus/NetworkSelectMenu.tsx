import styled, { type AnyStyledComponent } from 'styled-components';

import { useSelectedNetwork } from '@/hooks';
import { headerMixins } from '@/styles/headerMixins';

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
      disabled={import.meta.env.MODE === 'production'}
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
`;
