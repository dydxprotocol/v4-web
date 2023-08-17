import type { ChainData } from '@0xsquid/sdk';
import styled, { type AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { useStringGetter } from '@/hooks';

import { WithLabel } from '@/components/WithLabel';
import { SearchSelectMenu } from '@/components/SearchSelectMenu';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

type ElementProps = {
  chains?: ChainData[];
  currentChain?: ChainData;
  setCurrentChain: (chain: ChainData) => void;
};

export const ChainSelectMenu = ({ chains = [], currentChain, setCurrentChain }: ElementProps) => {
  const stringGetter = useStringGetter();

  const chainItems = Object.values(chains).map((chain: ChainData) => ({
    value: chain.chainId.toString(),
    label: chain.chainName,
    onSelect: () => setCurrentChain(chain),
    slotBefore: <Styled.Img src={chain.chainIconURI} alt="" />,
  }));

  return (
    <SearchSelectMenu
      items={[
        {
          group: 'chains',
          groupLabel: stringGetter({ key: STRING_KEYS.CHAINS }),
          items: chainItems,
        },
      ]}
      label="Source"
    >
      <Styled.ChainRow>
        {currentChain ? (
          <>
            <Styled.Img src={currentChain?.chainIconURI} alt="" /> {currentChain?.chainName}
          </>
        ) : (
          stringGetter({ key: STRING_KEYS.SELECT_CHAIN })
        )}
      </Styled.ChainRow>
    </SearchSelectMenu>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.DropdownContainer = styled.div`
  ${popoverMixins.item}
`;

Styled.Img = styled.img`
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
`;

Styled.ChainRow = styled.div`
  ${layoutMixins.row}
  gap: 0.5rem;
  color: var(--color-text-2);
  font: var(--font-base-book);
`;
