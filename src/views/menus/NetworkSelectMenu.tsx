import styled from 'styled-components';

import { useSelectedNetwork } from '@/hooks/useSelectedNetwork';

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
    <$DropdownSelectMenu
      disabled={networks.length <= 1}
      hideIcon
      items={networks}
      value={selectedNetwork}
      onValueChange={switchNetwork}
      align={align}
      sideOffset={sideOffset}
    />
  );
};

const $DropdownSelectMenu = styled(DropdownSelectMenu)`
  ${headerMixins.dropdownTrigger}

  width: max-content;

  & > span:first-of-type {
    display: inline-block;
    max-width: 5.625rem;
    min-width: 0;
    white-space: nowrap;
  }

  &:not(:disabled) > span:first-of-type {
    ${layoutMixins.textOverflow}
  }

  &:disabled {
    cursor: default;

    > span:first-of-type {
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
` as typeof DropdownSelectMenu;
