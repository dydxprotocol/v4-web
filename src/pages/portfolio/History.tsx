import { Outlet } from 'react-router-dom';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { HistoryRoute } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { AttachedExpandingSection } from '@/components/ContentSection';
import { NavigationMenu } from '@/components/NavigationMenu';
import { ExportHistoryDropdown } from '@/views/ExportHistoryDropdown';

export const History = () => {
  const stringGetter = useStringGetter();
  const { isNotTablet } = useBreakpoints();

  return (
    <AttachedExpandingSection>
      {isNotTablet && (
        <$NavigationMenu
          orientation="horizontal"
          slotAfter={<Styled.ExportButton />}
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
const Styled: Record<string, AnyStyledComponent> = {};

Styled.ExportButton = styled(ExportHistoryDropdown)`
  margin-left: auto;
`;

const $NavigationMenu = styled(NavigationMenu)`
  --header-horizontal-padding: 1rem;

  ${layoutMixins.contentSectionDetached}

  padding: 1rem var(--header-horizontal-padding);

  h3 {
    font-size: 1.25em;
  }
`;
