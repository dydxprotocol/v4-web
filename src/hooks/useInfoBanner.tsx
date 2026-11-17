import { STRING_KEYS } from '@/constants/localization';

import { Link } from '@/components/Link';

import { useStringGetter } from './useStringGetter';

const UsdcMigrationBanner = () => {
  const stringGetter = useStringGetter();

  return (
    <span>
      {stringGetter({ key: STRING_KEYS.USDC_MIGRATION })}{' '}
      <Link tw="inline-block" href="https://www.dydx.xyz/blog/usdc-migration-to-injective">
        {stringGetter({ key: STRING_KEYS.LEARN_MORE })}
      </Link>
    </span>
  );
};

export const useInfoBanner = (): { infoBannerContent?: React.ReactNode } => {
  return { infoBannerContent: <UsdcMigrationBanner /> };
};
