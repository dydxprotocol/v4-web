import styled from 'styled-components';
import tw from 'twin.macro';

import { ButtonShape, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useMobileAppUrl } from '@/hooks/useMobileAppUrl';
import { useStringGetter } from '@/hooks/useStringGetter';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Link } from '@/components/Link';
import { VerticalSeparator } from '@/components/Separator';

export const MobileDownloadLinks = ({ withBadges }: { withBadges?: boolean }) => {
  const stringGetter = useStringGetter();
  const { appleAppStoreUrl, googlePlayStoreUrl } = useMobileAppUrl();

  if (!appleAppStoreUrl && !googlePlayStoreUrl) return null;

  if (withBadges) {
    return (
      <$DownloadLinksInDropdown>
        <$Download>{stringGetter({ key: STRING_KEYS.GET_DYDX_ON_PHONE })}</$Download>
        {googlePlayStoreUrl && (
          <Link href={googlePlayStoreUrl}>
            <img src="/play-store.png" alt="google-play" />
          </Link>
        )}
        {appleAppStoreUrl && (
          <Link href={appleAppStoreUrl}>
            <img src="/app-store.png" alt="app-store" />
          </Link>
        )}
      </$DownloadLinksInDropdown>
    );
  }

  return (
    <>
      <div tw="flex flex-row items-center gap-0.5">
        <$Download>{stringGetter({ key: STRING_KEYS.DOWNLOAD })}</$Download>
        {googlePlayStoreUrl && (
          <$AppLink
            type={ButtonType.Link}
            href={googlePlayStoreUrl}
            shape={ButtonShape.Rectangle}
            iconName={IconName.GooglePlay}
          />
        )}
        {appleAppStoreUrl && (
          <$AppLink
            type={ButtonType.Link}
            href={appleAppStoreUrl}
            shape={ButtonShape.Rectangle}
            iconName={IconName.Apple}
          />
        )}
      </div>

      <VerticalSeparator />
    </>
  );
};

const $DownloadLinksInDropdown = styled.div`
  border-top: solid var(--border-width) var(--color-border);
  display: grid;
  grid-template:
    'label label' auto
    'android ios' 1fr
    / 1fr 1fr;

  padding: 0.75rem 0.75rem 0;
  gap: 0.5rem;

  img {
    width: 7.5rem;
  }
`;
const $Download = tw.span`text-color-text-0 font-small-medium [grid-area:label]`;

const $AppLink = styled(IconButton)`
  --button-icon-size: 1rem;
  --button-padding: 0 0.5em;

  // apple logo is white.
  svg {
    fill: var(--color-white);
  }
`;
