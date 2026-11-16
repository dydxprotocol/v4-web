import { STRING_KEYS } from '@/constants/localization';

import { Link } from '@/components/Link';

import { useStringGetter } from './useStringGetter';

// TODO: Replace text with stringGetter and new href
const UsdcMigrationBanner = () => {
  const stringGetter = useStringGetter();

  return (
    <span>
      Upcoming USDC migration from Noble to Injective, subject to governance approval. No action
      needed for USDC already on dYdX Chain.{' '}
      <Link tw="inline-block" href="https://docs.dydx.exchange/usdc-migration">
        {stringGetter({ key: STRING_KEYS.LEARN_MORE })}
      </Link>
    </span>
  );
};

export const useInfoBanner = (): { infoBannerContent?: React.ReactNode } => {
  return { infoBannerContent: <UsdcMigrationBanner /> };
};
