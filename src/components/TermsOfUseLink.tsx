import styled, { css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, BASE_ROUTE } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Link } from '@/components/Link';

type StyleProps = {
  isInline?: boolean;
  className?: string;
};

export const TermsOfUseLink = ({ isInline = false, className }: StyleProps) => {
  const stringGetter = useStringGetter();

  return (
    <$Link href={`${BASE_ROUTE}${AppRoute.Terms}`} isInline={isInline} className={className}>
      {stringGetter({ key: STRING_KEYS.TERMS_OF_USE })}
    </$Link>
  );
};

const $Link = styled(Link)<{ isInline: boolean }>`
  --link-color: var(--color-text-1);
  color: var(--link-color);

  text-decoration: underline;

  ${({ isInline }) =>
    isInline &&
    css`
      display: inline;
    `}
`;
