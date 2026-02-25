import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Bar3Icon, ProfileIcon, TradeIcon } from '@/icons';
import { layoutMixins } from '@/styles/layoutMixins';

import { Icon } from '@/components/Icon';
import { NavigationMenu } from '@/components/NavigationMenu';

export const FooterMobile = () => {
  const stringGetter = useStringGetter();

  return (
    <$MobileNav>
      <$NavigationMenu
        items={[
          {
            group: 'navigation',
            items: [
              {
                value: 'trade',
                label: stringGetter({ key: STRING_KEYS.MARKETS }),
                slotBefore: <$Icon size="0.75em" iconComponent={Bar3Icon as any} />,
                href: AppRoute.Trade,
              },
              {
                value: 'trade-from',
                label: stringGetter({ key: STRING_KEYS.TRADE }),
                slotBefore: <$Icon size="0.75em" iconComponent={TradeIcon as any} />,
                href: AppRoute.TradeForm,
              },
              {
                value: 'portfolio',
                label: stringGetter({ key: STRING_KEYS.ACCOUNT }),
                slotBefore: <$Icon size="0.75em" iconComponent={ProfileIcon as any} />,
                href: AppRoute.Portfolio,
              },
            ],
          },
        ]}
        orientation="horizontal"
        itemOrientation="horizontal"
      />
    </$MobileNav>
  );
};
const $MobileNav = styled.footer`
  grid-area: Footer;
  background-color: var(--color-layer-2);

  ${layoutMixins.stickyFooter}
`;

const $NavigationMenu = styled(NavigationMenu)`
  --navigationMenu-height: var(--page-currentFooterHeight);
  --navigationMenu-item-height: var(--page-currentFooterHeight);
  --navigationMenu-item-radius: 0;

  --navigationMenu-item-checked-backgroundColor: transparent;
  --navigationMenu-item-highlighted-backgroundColor: var(--color-layer-2);
  --navigationMenu-tab-item-highlighted-backgroundColor: var(--color-layer-2);
  --navigationMenu-item-checked-textColor: var(--color-accent);
  --navigationMenu-item-highlighted-textColor: var(--color-accent);
  --navigationMenu-item-radius: 0px;
  --navigationMenu-item-padding: 0px;
  --hover-filter-base: none;

  font: var(--font-tiny-book);

  > section {
    flex: 1;

    ul[data-orientation='horizontal'] {
      gap: 0;

      > li {
        flex: 1;
      }

      > li:not(:last-child):after {
        content: '';
        position: absolute;

        width: var(--border-width);
        top: 12.5%;
        bottom: 12.5%;
        right: 0;
      }
    }
  }
`;

const $Icon = tw(Icon)`text-[1.5rem]`;
