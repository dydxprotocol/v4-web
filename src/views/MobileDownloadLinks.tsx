import styled from 'styled-components';

import { ButtonShape, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Link } from '@/components/Link';
import { VerticalSeparator } from '@/components/Separator';

export const MobileDownloadLinks = ({ withBadges }: { withBadges?: boolean }) => {
  const stringGetter = useStringGetter();

  const androidUrl = document
    .querySelector('meta[name="smartbanner:button-url-google"]')
    ?.getAttribute('content');
  const iosUrl = document
    .querySelector('meta[name="smartbanner:button-url-apple"]')
    ?.getAttribute('content');

  if (!androidUrl && !iosUrl) return null;

  if (withBadges) {
    return (
      <$DownloadLinksInDropdown>
        <$Download>{stringGetter({ key: STRING_KEYS.GET_DYDX_ON_PHONE })}</$Download>
        {androidUrl && (
          <Link href={androidUrl}>
            <img src="/play-store.png" alt="google-play" />
          </Link>
        )}
        {iosUrl && (
          <Link href={iosUrl}>
            <img src="/app-store.png" alt="app-store" />
          </Link>
        )}
      </$DownloadLinksInDropdown>
    );
  }

  return (
    <>
      <$DownloadLinks>
        <$Download>{stringGetter({ key: STRING_KEYS.DOWNLOAD })}</$Download>
        {androidUrl && (
          <$AppLink
            type={ButtonType.Link}
            href={androidUrl}
            shape={ButtonShape.Rectangle}
            iconName={IconName.GooglePlay}
          />
        )}
        {iosUrl && (
          <$AppLink
            type={ButtonType.Link}
            href={iosUrl}
            shape={ButtonShape.Rectangle}
            iconName={IconName.Apple}
          />
        )}
      </$DownloadLinks>

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

const $DownloadLinks = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
`;

const $Download = styled.span`
  grid-area: label;
  font: var(--font-small-medium);
  color: var(--color-text-0);
`;

const $AppLink = styled(IconButton)`
  --button-icon-size: 1rem;
  --button-padding: 0 0.5em;

  // apple logo is white.
  svg {
    fill: var(--color-white);
  }
`;
