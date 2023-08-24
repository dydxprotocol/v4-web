import styled, { type AnyStyledComponent } from 'styled-components';
import { shallowEqual, useSelector } from 'react-redux';

import { TransferType } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { useStringGetter } from '@/hooks';

import { SearchSelectMenu } from '@/components/SearchSelectMenu';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { getTransferInputs } from '@/state/inputsSelectors';

type ElementProps = {
  label?: string;
  selectedChain?: string;
  onSelectChain: (chain: string) => void;
};

export const ChainSelectMenu = ({
  label,
  selectedChain,
  onSelectChain,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const { type, depositOptions, withdrawalOptions, resources } =
    useSelector(getTransferInputs, shallowEqual) || {};
  const chains =
    (type === TransferType.deposit ? depositOptions : withdrawalOptions)?.chains?.toArray() || [];

  const chainItems = Object.values(chains).map((chain) => ({
    value: chain.type,
    label: chain.stringKey,
    onSelect: () => {
      onSelectChain(chain.type);
    },
    slotBefore: <Styled.Img src={chain.iconUrl} alt="" />,
  }));

  const selectedOption = chains.find((item) => item.type === selectedChain); 

  return (
    <SearchSelectMenu
      items={[
        {
          group: 'chains',
          groupLabel: stringGetter({ key: STRING_KEYS.CHAINS }),
          items: chainItems,
        },
      ]}
      label={label || (type === TransferType.deposit ? 'Source' : 'Destination')}
    >
      <Styled.ChainRow>
        {selectedChain ? (
          <>
            <Styled.Img src={selectedOption?.iconUrl} alt="" /> {selectedOption?.stringKey}
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