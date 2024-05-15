import { Outlet } from 'react-router-dom';
import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { HistoryRoute } from '@/constants/routes';

import { useBreakpoints, useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { AttachedExpandingSection } from '@/components/ContentSection';
import { NavigationMenu } from '@/components/NavigationMenu';

export const History = () => {
  const stringGetter = useStringGetter();
  const { isNotTablet } = useBreakpoints();

  return (
    <AttachedExpandingSection>
      {isNotTablet && (
        <$NavigationMenu
          orientation="horizontal"
          items={[
            {
              group: 'navigation',
              items: [
                {
                  value: HistoryRoute.Trades,
                  label: <h3>{stringGetter({ key: STRING_KEYS.TRADES })}</h3>,
                  href: HistoryRoute.Trades,
                },
                {
                  value: HistoryRoute.Transfers,
                  label: <h3>{stringGetter({ key: STRING_KEYS.TRANSFERS })}</h3>,
                  href: HistoryRoute.Transfers,
                  tag: 'USDC',
                },
                // TODO - TRCL-1693 -
                // {
                //   value: HistoryRoute.Payments,
                //   label: <h3>{stringGetter({ key: STRING_KEYS.PAYMENTS })}</h3>,
                //   href: HistoryRoute.Payments,
                // },
              ],
            },
          ]}
        />
      )}

      <Outlet />
    </AttachedExpandingSection>
  );
};
const $NavigationMenu = styled(NavigationMenu)`
  --header-horizontal-padding: 1rem;

  ${layoutMixins.contentSectionDetached}

  padding: 1rem var(--header-horizontal-padding);

  h3 {
    font-size: 1.25em;
  }
`;
