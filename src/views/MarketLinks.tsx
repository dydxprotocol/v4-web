import { shallowEqual, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';

import { ButtonType } from '@/constants/buttons';
import { layoutMixins } from '@/styles/layoutMixins';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';

import { getCurrentMarketAssetData } from '@/state/assetsSelectors';

export const MarketLinks = () => {
  const { resources } = useSelector(getCurrentMarketAssetData, shallowEqual) || {};
  const { coinMarketCapsLink, websiteLink, whitepaperLink } = resources || {};

  const linkItems = [
    {
      href: coinMarketCapsLink,
      icon: IconName.CoinMarketCap,
    },
    {
      href: whitepaperLink,
      icon: IconName.Whitepaper,
    },
    {
      href: websiteLink,
      icon: IconName.Website,
    },
  ].filter(({ href }) => href);

  return (
    <Styled.MarketLinks>
      {linkItems.map(
        ({ href, icon }) =>
          href && <IconButton key={href} href={href} iconName={icon} type={ButtonType.Link} />
      )}
    </Styled.MarketLinks>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.MarketLinks = styled.div`
  ${layoutMixins.row}

  margin-left: auto;
  gap: 0.5rem;
`;
