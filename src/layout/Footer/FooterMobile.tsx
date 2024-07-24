import styled from 'styled-components';
import tw from 'twin.macro';

import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { DEFAULT_MARKETID } from '@/constants/markets';
import { AppRoute } from '@/constants/routes';

import { useShouldShowFooter } from '@/hooks/useShouldShowFooter';
import { useStringGetter } from '@/hooks/useStringGetter';

import { BellIcon, MarketsIcon, PortfolioIcon, ProfileIcon } from '@/icons';
import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { NavigationMenu } from '@/components/NavigationMenu';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

export const FooterMobile = () => {
  const dispatch = useAppDispatch();

  const stringGetter = useStringGetter();

  const canAccountTrade = useAppSelector(calculateCanAccountTrade);

  const marketId = useAppSelector(getCurrentMarketId);

  if (!useShouldShowFooter()) return null;

  return (
    <$MobileNav>
      <$NavigationMenu
        items={[
          {
            group: 'navigation',
            items: [
              canAccountTrade
                ? {
                    value: 'trade',
                    label: stringGetter({ key: STRING_KEYS.TRADE }),
                    slotBefore: (
                      <$StartIcon>
                        <Icon iconName={IconName.Trade} />
                      </$StartIcon>
                    ),
                    href: `${AppRoute.Trade}/${marketId ?? DEFAULT_MARKETID}`,
                  }
                : {
                    value: 'onboarding',
                    label: stringGetter({ key: STRING_KEYS.ONBOARDING }),
                    slotBefore: (
                      <$StartIcon>
                        <Icon iconName={IconName.Play} />
                      </$StartIcon>
                    ),
                    onClick: () => dispatch(openDialog(DialogTypes.Onboarding())),
                  },
              {
                value: 'portfolio',
                label: stringGetter({ key: STRING_KEYS.PORTFOLIO }),
                slotBefore: <$Icon iconComponent={PortfolioIcon as any} />,
                href: AppRoute.Portfolio,
              },
              {
                value: 'markets',
                label: stringGetter({ key: STRING_KEYS.MARKETS }),
                slotBefore: <$Icon iconComponent={MarketsIcon as any} />,
                href: AppRoute.Markets,
              },
              {
                value: 'alerts',
                label: stringGetter({ key: STRING_KEYS.ALERTS }),
                slotBefore: <$Icon iconComponent={BellIcon as any} />,
                href: AppRoute.Alerts,
              },
              {
                value: 'profile',
                label: stringGetter({ key: STRING_KEYS.PROFILE }),
                slotBefore: <$Icon iconComponent={ProfileIcon as any} />,
                href: AppRoute.Profile,
              },
            ],
          },
        ]}
        orientation="horizontal"
        itemOrientation="vertical"
      />
    </$MobileNav>
  );
};
const $MobileNav = styled.footer`
  grid-area: Footer;

  ${layoutMixins.stickyFooter}
`;

const $NavigationMenu = styled(NavigationMenu)`
  --navigationMenu-height: var(--page-currentFooterHeight);
  --navigationMenu-item-height: var(--page-currentFooterHeight);
  --navigationMenu-item-radius: 0;

  --navigationMenu-item-checked-backgroundColor: transparent;
  --navigationMenu-item-highlighted-backgroundColor: transparent;
  --navigationMenu-item-highlighted-textColor: var(--color-text-2);
  --navigationMenu-item-radius: 0px;
  --navigationMenu-item-padding: 0px;

  font: var(--font-tiny-book);

  > section {
    flex: 1;

    ul[data-orientation='horizontal'] {
      gap: 0;

      > li {
        flex: 1;

        &[data-item='onboarding'],
        &[data-item='trade'] {
          span {
            content-visibility: hidden;
            position: absolute;

            @supports not (content-visibility: hidden) {
              opacity: 0;
              width: 0;
              overflow: hidden;
            }
          }

          + *,
          + * + * {
            order: -1;
          }
        }
      }

      > li:not(:last-child):after {
        content: '';
        position: absolute;

        width: var(--border-width);
        top: 12.5%;
        bottom: 12.5%;
        right: 0;

        background: linear-gradient(to bottom, transparent, var(--border-color), transparent);
      }
    }
  }
`;

const $Icon = tw(Icon)`text-[1.5rem]`;

const $StartIcon = styled.div`
  display: inline-flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-top: -0.25rem;

  width: 3.5rem;
  height: 3.5rem;

  color: var(--color-text-2);
  background-color: var(--color-accent);
  border: solid var(--border-width) var(--color-border-white);
  border-radius: 50%;

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`;
