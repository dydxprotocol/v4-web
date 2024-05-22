import type { Story } from '@ladle/react';
import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { SearchInput } from '@/components/SearchInput';

import { InputType } from './Input';
import { StoryWrapper } from '.ladle/components';

export const SearchInputStory: Story<Parameters<typeof SearchInput>[0]> = () => (
  <StoryWrapper>
    <$Container>
      <SearchInput placeholder="Search something..." type={InputType.Search} />
    </$Container>
  </StoryWrapper>
);
const $Container = styled.section`
  background: var(--color-layer-3);

  ${layoutMixins.container}
  width: 300px;
`;
