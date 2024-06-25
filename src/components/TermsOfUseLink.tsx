import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, BASE_ROUTE } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Link } from '@/components/Link';

type StyleProps = {
  isInline?: boolean;
  isAccent?: boolean;
  className?: string;
};

export const TermsOfUseLink = ({ isInline = false, isAccent = false, className }: StyleProps) => {
  const stringGetter = useStringGetter();

  return (
    <Link
      href={`${BASE_ROUTE}${AppRoute.Terms}`}
      isInline={isInline}
      isAccent={isAccent}
      className={className}
    >
      {stringGetter({ key: STRING_KEYS.TERMS_OF_USE })}
    </Link>
  );
};
