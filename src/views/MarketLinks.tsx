import { BonsaiHelpers } from '@/bonsai/ontology';
import styled from 'styled-components';

import { ButtonType } from '@/constants/buttons';

import { useMetadataServiceAssetFromId } from '@/hooks/useMetadataService';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';

import { useAppSelector } from '@/state/appTypes';

import { orEmptyObj } from '@/lib/typeUtils';

export const MarketLinks = ({ launchableMarketId }: { launchableMarketId?: string }) => {
  const { urls: marketUrls } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );
  const {
    cmc: coinMarketCapsLink,
    website: websiteLink,
    technicalDoc: whitepaperLink,
  } = orEmptyObj(marketUrls);

  const launchableAsset = useMetadataServiceAssetFromId(launchableMarketId);
  const { urls } = orEmptyObj(launchableAsset);

  const linkItems = [
    {
      key: 'coinmarketcap',
      href: urls?.cmc ?? coinMarketCapsLink,
      icon: IconName.CoinMarketCap,
    },
    {
      key: 'whitepaper',
      href: urls?.technicalDoc ?? whitepaperLink,
      icon: IconName.Whitepaper,
    },
    {
      key: 'project-website',
      href: urls?.website ?? websiteLink,
      icon: IconName.Website,
    },
  ].filter(({ href }) => href);

  return (
    <div tw="row ml-auto gap-0.5">
      {linkItems.map(
        ({ key, href, icon }) =>
          href && <$IconButton key={key} href={href} iconName={icon} type={ButtonType.Link} />
      )}
    </div>
  );
};

const $IconButton = styled(IconButton)`
  --button-icon-size: 1.3em;
  --button-textColor: var(--color-text-0);
  --button-backgroundColor: transparent;
  --button-border: none;
`;
