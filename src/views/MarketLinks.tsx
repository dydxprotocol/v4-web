import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { ButtonType } from '@/constants/buttons';

import { layoutMixins } from '@/styles/layoutMixins';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';

export const MarketLinks = () => {
  const { resources } = useAppSelector(getCurrentMarketAssetData, shallowEqual) ?? {};
  const { coinMarketCapsLink, websiteLink, whitepaperLink } = resources ?? {};

  const linkItems = [
    {
      key: 'coinmarketcap',
      href: coinMarketCapsLink,
      icon: IconName.CoinMarketCap,
    },
    {
      key: 'whitepaper',
      href: whitepaperLink,
      icon: IconName.Whitepaper,
    },
    {
      key: 'project-website',
      href: websiteLink,
      icon: IconName.Website,
    },
  ].filter(({ href }) => href);

  return (
    <$MarketLinks>
      {linkItems.map(
        ({ key, href, icon }) =>
          href && <IconButton key={key} href={href} iconName={icon} type={ButtonType.Link} />
      )}
    </$MarketLinks>
  );
};
const $MarketLinks = styled.div`
  ${layoutMixins.row}

  margin-left: auto;
  gap: 0.5rem;
`;
