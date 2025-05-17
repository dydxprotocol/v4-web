import { BonsaiHelpers } from '@/bonsai/ontology';
import styled from 'styled-components';

import { ButtonShape, ButtonStyle, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { SimpleUiDropdownMenu } from '@/components/SimpleUiDropdownMenu';

import { useAppSelector } from '@/state/appTypes';

import { getAssetFromMarketId } from '@/lib/assetUtils';
import { mapIfPresent } from '@/lib/do';
import { orEmptyObj } from '@/lib/typeUtils';

export const MarketLinks = ({
  className,
  launchableMarketId,
  type = 'icons',
}: {
  className?: string;
  launchableMarketId?: string;
  type?: 'icons' | 'menu';
}) => {
  const stringGetter = useStringGetter();
  const { urls: marketUrls } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );
  const {
    cmc: coinMarketCapsLink,
    website: websiteLink,
    technicalDoc: whitepaperLink,
  } = orEmptyObj(marketUrls);

  const launchableAsset = useAppSelectorWithArgs(
    BonsaiHelpers.assets.selectAssetInfo,
    mapIfPresent(launchableMarketId, getAssetFromMarketId)
  );
  const { urls } = orEmptyObj(launchableAsset);

  const linkItems = [
    {
      key: 'coinmarketcap',
      label: 'Coinmarketcap',
      href: urls?.cmc ?? coinMarketCapsLink,
      icon: IconName.CoinMarketCap,
    },
    {
      key: 'whitepaper',
      label: stringGetter({ key: STRING_KEYS.WHITEPAPER }),
      href: urls?.technicalDoc ?? whitepaperLink,
      icon: IconName.Whitepaper,
    },
    {
      key: 'project-website',
      label: stringGetter({ key: STRING_KEYS.WEBSITE }),
      href: urls?.website ?? websiteLink,
      icon: IconName.Website,
    },
  ].filter(({ href }) => href);

  if (type === 'menu') {
    return (
      <SimpleUiDropdownMenu
        className={className}
        align="end"
        items={linkItems.map(({ key, href, icon, label }) => ({
          key,
          href,
          icon: <Icon iconName={icon} />,
          label,
          value: href ?? '',
          onSelect: () => {
            if (href) {
              window.open(href, '_blank');
            }
          },
        }))}
      >
        <IconButton
          shape={ButtonShape.Square}
          buttonStyle={ButtonStyle.WithoutBackground}
          iconName={IconName.ThreeDot}
        />
      </SimpleUiDropdownMenu>
    );
  }

  return (
    <div tw="row ml-auto gap-0.5" className={className}>
      {linkItems.map(
        ({ key, href, icon }) =>
          href && <$IconButton key={key} href={href} iconName={icon} type={ButtonType.Link} />
      )}
    </div>
  );
};

const $IconButton = styled(IconButton)`
  --button-icon-size: var('--market-link-icon-size', 1.3em);
  --button-textColor: var('--market-link-textColor', var(--color-text-0));
  --button-backgroundColor: transparent;
  --button-border: none;
`;
