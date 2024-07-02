import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { ContentSectionHeader } from '@/components/ContentSectionHeader';

const Vault = () => {
  const stringGetter = useStringGetter();

  useDocumentTitle(stringGetter({ key: STRING_KEYS.VAULT }));

  return (
    <$Page>
      <$HeaderSection>
        <$ContentSectionHeader title={stringGetter({ key: STRING_KEYS.VAULT })} />
      </$HeaderSection>

      <div>{stringGetter({ key: STRING_KEYS.VAULT })}</div>
    </$Page>
  );
};

const $Page = styled.div`
  ${layoutMixins.contentContainerPage}
`;
const $ContentSectionHeader = styled(ContentSectionHeader)`
  margin-top: 1rem;
  padding-top: 0;
  margin-bottom: 0;

  h3 {
    font: var(--font-extra-medium);
  }

  @media ${breakpoints.tablet} {
    margin-top: 0;
    padding: 1.25rem 1.5rem 0;

    h3 {
      font: var(--font-extra-medium);
    }
  }
`;
const $HeaderSection = styled.section`
  ${layoutMixins.contentSectionDetached}

  margin-bottom: 1.5rem;

  @media ${breakpoints.tablet} {
    ${layoutMixins.flexColumn}
    gap: 1rem;

    margin-bottom: 1rem;
  }
`;

export default Vault;
