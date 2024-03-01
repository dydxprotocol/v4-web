import { useDispatch, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';

import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { DEFAULT_MARKETID } from '@/constants/markets';
import { AppRoute } from '@/constants/routes';

import { useShouldShowFooter, useStringGetter } from '@/hooks';

import { BellIcon, MarketsIcon, PortfolioIcon, ProfileIcon } from '@/icons';
import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { NavigationMenu } from '@/components/NavigationMenu';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { openDialog } from '@/state/dialogs';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

export const FooterMobile = () => {
  const dispatch = useDispatch();

  const stringGetter = useStringGetter();

  const canAccountTrade = useSelector(calculateCanAccountTrade);

  const marketId = useSelector(getCurrentMarketId);

  if (!useShouldShowFooter()) return null;

  return (
    <Styled.MobileNav>
      <Styled.NavigationMenu
        items={[
          {
            group: 'navigation',
            items: [
              canAccountTrade
                ? {
                    value: 'trade',
                    label: stringGetter({ key: STRING_KEYS.TRADE }),
                    slotBefore: (
                      <Styled.StartIcon>
                        <Icon iconName={IconName.Trade} />
                      </Styled.StartIcon>
                    ),
                    href: `${AppRoute.Trade}/${marketId ?? DEFAULT_MARKETID}`,
                  }
                : {
                    value: 'onboarding',
                    label: stringGetter({ key: STRING_KEYS.ONBOARDING }),
                    slotBefore: (
                      <Styled.StartIcon>
                        <Icon iconName={IconName.Play} />
                      </Styled.StartIcon>
                    ),
                    onClick: () => dispatch(openDialog({ type: DialogTypes.Onboarding })),
                  },
              {
                value: 'portfolio',
                label: stringGetter({ key: STRING_KEYS.PORTFOLIO }),
                slotBefore: <Styled.Icon iconComponent={PortfolioIcon} />,
                href: AppRoute.Portfolio,
              },
              {
                value: 'markets',
                label: stringGetter({ key: STRING_KEYS.MARKETS }),
                slotBefore: <Styled.Icon iconComponent={MarketsIcon} />,
                href: AppRoute.Markets,
              },
              {
                value: 'alerts',
                label: stringGetter({ key: STRING_KEYS.ALERTS }),
                slotBefore: <Styled.Icon iconComponent={BellIcon} />,
                href: AppRoute.Alerts,
              },
              {
                value: 'profile',
                label: stringGetter({ key: STRING_KEYS.PROFILE }),
                slotBefore: <Styled.Icon iconComponent={ProfileIcon} />,
                href: AppRoute.Profile,
              },
            ],
          },
        ]}
        orientation="horizontal"
        itemOrientation="vertical"
      />
    </Styled.MobileNav>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.MobileNav = styled.footer`
  grid-area: Footer;

  ${layoutMixins.stickyFooter}
`;

Styled.NavigationMenu = styled(NavigationMenu)`
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

Styled.IconButton = styled(IconButton)`
  margin-top: -0.25rem;
`;

Styled.Icon = styled(Icon)`
  font-size: 1.5rem;
`;

Styled.StartIcon = styled.div`
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
