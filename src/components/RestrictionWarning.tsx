import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { Link } from './Link';
import { TermsOfUseLink } from './TermsOfUseLink';

export const RestrictionWarning = () => {
  const stringGetter = useStringGetter();
  const { help } = useURLConfigs();

  return (
    <$RestrictedWarning>
      {stringGetter({
        key: STRING_KEYS.BLOCKED_BANNER_MESSAGE,
        params: {
          TERMS_OF_USE_LINK: <TermsOfUseLink isInline />,
          HELP_LINK: (
            <Link href={help} isInline>
              {stringGetter({ key: STRING_KEYS.HELP_CENTER })}
            </Link>
          ),
        },
      })}
    </$RestrictedWarning>
  );
};

const $RestrictedWarning = styled.div`
  ${layoutMixins.sticky}
  --stickyArea-totalInsetTop: var(--page-currentHeaderHeight);

  grid-area: RestrictionWarning;
  z-index: 1;
  padding: 0.5rem 1rem;

  font: var(--font-small-book);
  background-color: var(--color-red);
  color: var(--color-text-2);

  a {
    color: var(--color-text-2);
    text-decoration: underline;
  }
`;
