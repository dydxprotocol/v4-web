import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { Link } from '@/components/Link';

import { VaultsTable } from './VaultsTable';

const Vaults = () => {
  const stringGetter = useStringGetter();
  const { vaultsLearnMore } = useURLConfigs();

  useDocumentTitle(stringGetter({ key: STRING_KEYS.VAULTS_OVERVIEW }));

  return (
    <$Page>
      <$HeaderSection>
        <$ContentSectionHeader
          title={stringGetter({ key: STRING_KEYS.VAULTS_OVERVIEW })}
          subtitle={
            <$HeaderSubtitleContainer>
              {stringGetter({ key: STRING_KEYS.VAULT_DESCRIPTION })}{' '}
              {vaultsLearnMore != null && (
                <$Link href={vaultsLearnMore} withIcon>
                  {stringGetter({ key: STRING_KEYS.VAULT_FAQS })}
                </$Link>
              )}
            </$HeaderSubtitleContainer>
          }
        />
      </$HeaderSection>

      <$VaultsTable />
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
const $HeaderSubtitleContainer = styled.span`
  display: block;
  max-width: 34rem;
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
const $VaultsTable = styled(VaultsTable)`
  ${layoutMixins.contentSectionAttached}
`;
const $Link = styled(Link)`
  --link-color: var(--color-text-2);
  display: inline-block;
`;
export default Vaults;
