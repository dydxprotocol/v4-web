import { useLocation, useNavigate } from 'react-router-dom';
import styled, { type AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, HistoryRoute, PortfolioRoute } from '@/constants/routes';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { DropdownHeaderMenu } from '@/components/DropdownHeaderMenu';

export const PortfolioNavMobile = () => {
  const stringGetter = useStringGetter();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const portfolioRouteItems = [
    {
      value: `${AppRoute.Portfolio}/${PortfolioRoute.Overview}`,
      label: stringGetter({ key: STRING_KEYS.OVERVIEW }),
      description: stringGetter({ key: STRING_KEYS.OVERVIEW_DESCRIPTION }),
    },
    {
      value: `${AppRoute.Portfolio}/${PortfolioRoute.Positions}`,
      label: stringGetter({ key: STRING_KEYS.POSITIONS }),
      description: stringGetter({ key: STRING_KEYS.POSITIONS_DESCRIPTION }),
    },
    {
      value: `${AppRoute.Portfolio}/${PortfolioRoute.Orders}`,
      label: stringGetter({ key: STRING_KEYS.ORDERS }),
      description: stringGetter({ key: STRING_KEYS.ORDERS_DESCRIPTION }),
    },
    {
      value: `${AppRoute.Portfolio}/${PortfolioRoute.Fees}`,
      label: stringGetter({ key: STRING_KEYS.FEES }),
      description: stringGetter({ key: STRING_KEYS.FEE_STRUCTURE }), // TODO: get new description copy
    },
    {
      value: `${AppRoute.Portfolio}/${PortfolioRoute.History}/${HistoryRoute.Trades}`,
      label: stringGetter({ key: STRING_KEYS.TRADES }),
      description: stringGetter({ key: STRING_KEYS.TRADES_DESCRIPTION }),
    },
    {
      value: `${AppRoute.Portfolio}/${PortfolioRoute.History}/${HistoryRoute.Transfers}`,
      label: stringGetter({ key: STRING_KEYS.TRANSFERS }),
      description: stringGetter({ key: STRING_KEYS.TRANSFERS_DESCRIPTION }),
    },
    // TODO: TRCL-1693 - re-enable when Payments are ready
    // {
    //   value: `${AppRoute.Portfolio}/${PortfolioRoute.History}/${HistoryRoute.Payments}`,
    //   label: stringGetter({ key: STRING_KEYS.PAYMENTS }),
    //   description: stringGetter({ key: STRING_KEYS.PAYMENTS_DESCRIPTION }),
    // },
  ];

  const routeMap = Object.fromEntries(
    portfolioRouteItems.map(({ value, label }) => [value, { value, label }])
  );

  const currentRoute = routeMap[pathname];

  return (
    <$MobilePortfolioHeader>
      <DropdownHeaderMenu
        key="portfolioRoute"
        items={portfolioRouteItems.filter(({ value }) => value !== currentRoute?.value)}
        onValueChange={navigate}
      >
        {currentRoute?.label}
      </DropdownHeaderMenu>
    </$MobilePortfolioHeader>
  );
};
const $MobilePortfolioHeader = styled.div`
  ${layoutMixins.stickyHeader}
  ${layoutMixins.withOuterBorder}
  ${layoutMixins.row}

  padding: 1rem;
  background-color: var(--color-layer-2);
  z-index: 2;
`;
