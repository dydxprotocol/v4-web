import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { SearchInput } from '@/components/SearchInput';
import { VerticalSeparator } from '@/components/Separator';
import { ToggleGroup } from '@/components/ToggleGroup';

export enum VaultsFilter {
  ALL = 'ALL',
  MINE = 'MINE',
}

export const VaultFilter = ({
  selectedFilter,
  onChangeFilter,
  onSearchTextChange,
}: {
  selectedFilter: VaultsFilter;
  onChangeFilter: (filter: VaultsFilter) => void;
  onSearchTextChange?: (filter: string) => void;
}) => {
  const stringGetter = useStringGetter();

  return (
    <$VaultFilter>
      <SearchInput
        placeholder={stringGetter({ key: STRING_KEYS.SEARCH_VAULTS })}
        onTextChange={onSearchTextChange}
      />
      <$VerticalSeparator />
      <$ToggleGroupContainer>
        <ToggleGroup
          items={[
            { value: VaultsFilter.ALL, label: stringGetter({ key: STRING_KEYS.ALL_VAULTS }) },
            { value: VaultsFilter.MINE, label: stringGetter({ key: STRING_KEYS.MY_VAULTS }) },
          ]}
          value={selectedFilter}
          onValueChange={onChangeFilter}
        />
      </$ToggleGroupContainer>
    </$VaultFilter>
  );
};
const $VaultFilter = styled.div`
  display: flex;
  flex-direction: 'row-reverse';
  gap: 0.75rem;
  flex: 1;
  overflow: hidden;

  @media ${breakpoints.mobile} {
    flex-direction: column;
  }
`;

const $VerticalSeparator = styled(VerticalSeparator)`
  &&& {
    height: 1.5rem;
  }
`;
const $ToggleGroupContainer = styled.div`
  ${layoutMixins.row}
  justify-content: space-between;
  overflow-x: auto;

  & button {
    --button-toggle-off-backgroundColor: ${({ theme }) => theme.toggleBackground};
    --button-toggle-off-textColor: ${({ theme }) => theme.textSecondary};
    --border-color: ${({ theme }) => theme.layer6};
    --button-height: 2rem;
    --button-padding: 0 0.625rem;
    --button-font: var(--font-small-book);
  }
`;
