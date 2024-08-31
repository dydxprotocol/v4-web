import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, BASE_ROUTE } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Link } from '@/components/Link';

type StyleProps = {
  isInline?: boolean;
  isAccent?: boolean;
  className?: string;
};

type ElementProps = {
  hrefOverride?: string;
};

export const TermsOfUseLink = ({
  hrefOverride,
  isInline = false,
  isAccent = false,
  className,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();

  return (
    <Link
      href={hrefOverride ?? `${BASE_ROUTE}${AppRoute.Terms}`}
      isInline={isInline}
      isAccent={isAccent}
      className={className}
    >
      {stringGetter({ key: STRING_KEYS.TERMS_OF_USE })}
    </Link>
  );
};
