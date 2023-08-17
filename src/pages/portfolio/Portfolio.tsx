import { useEffect } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';
import { Navigate, Route, Routes } from 'react-router-dom';

import { STRING_KEYS } from '@/constants/localization';
import { HistoryRoute, PortfolioRoute } from '@/constants/routes';

import { useBreakpoints, useDocumentTitle, useStringGetter } from '@/hooks';

import { FillsTable, FillsTableColumnKey } from '@/views/tables/FillsTable';
import { FundingPaymentsTable } from '@/views/tables/FundingPaymentsTable';
import { Icon, IconName } from '@/components/Icon';
import { NavigationMenu } from '@/components/NavigationMenu';
import { WithSidebar } from '@/components/WithSidebar';

import { PortfolioNavMobile } from './PortfolioNavMobile';
import { Overview } from './Overview';
import { Positions } from './Positions';
import { Orders } from './Orders';
import { Fees } from './Fees';
import { History } from './History';

import { layoutMixins } from '@/styles/layoutMixins';

export default () => {
  const stringGetter = useStringGetter();
  const { isTablet, isNotTablet } = useBreakpoints();

  useDocumentTitle(stringGetter({ key: STRING_KEYS.PORTFOLIO }));

  const routesComponent = (
    <Routes>
      <Route path={PortfolioRoute.Overview} element={<Overview />} />
      <Route path={PortfolioRoute.Positions} element={<Positions />} />
      <Route path={PortfolioRoute.Orders} element={<Orders />} />
      <Route path={PortfolioRoute.Fees} element={<Fees />} />
      <Route path={PortfolioRoute.History} element={<History />}>
        <Route index path="*" element={<Navigate to={HistoryRoute.Trades} />} />
        <Route
          path={HistoryRoute.Trades}
          element={
            <FillsTable
              columnKeys={
                isTablet
                  ? [
                      FillsTableColumnKey.Time,
                      FillsTableColumnKey.TypeAmount,
                      FillsTableColumnKey.PriceFee,
                    ]
                  : [
                      FillsTableColumnKey.Time,
                      FillsTableColumnKey.Market,
                      FillsTableColumnKey.Side,
                      FillsTableColumnKey.AmountPrice,
                      FillsTableColumnKey.TotalFee,
                      FillsTableColumnKey.Type,
                      FillsTableColumnKey.Liquidity,
                    ]
              }
              withOuterBorder={isNotTablet}
            />
          }
        />
        <Route path={HistoryRoute.Transfers} element={<div />} />
        <Route
          path={HistoryRoute.Payments}
          element={<FundingPaymentsTable withOuterBorder={isNotTablet} />}
        />
      </Route>
      <Route path="*" element={<Navigate to={PortfolioRoute.Overview} replace />} />
    </Routes>
  );

  return isTablet ? (
    <Styled.PortfolioMobile>
      <PortfolioNavMobile />
      {routesComponent}
    </Styled.PortfolioMobile>
  ) : (
    <WithSidebar
      sidebar={
        isTablet ? null : (
          <Styled.NavigationMenu
            items={[
              {
                group: 'views',
                groupLabel: stringGetter({ key: STRING_KEYS.VIEWS }),
                items: [
                  {
                    value: PortfolioRoute.Overview,
                    slotBefore: <Styled.Icon iconName={IconName.Overview} />,
                    label: stringGetter({ key: STRING_KEYS.OVERVIEW }),
                    href: PortfolioRoute.Overview,
                  },
                  {
                    value: PortfolioRoute.Positions,
                    slotBefore: <Styled.Icon iconName={IconName.Cube} />,
                    label: stringGetter({ key: STRING_KEYS.POSITIONS }),
                    href: PortfolioRoute.Positions,
                  },
                  {
                    value: PortfolioRoute.Orders,
                    slotBefore: <Styled.Icon iconName={IconName.OrderPending} />,
                    label: stringGetter({ key: STRING_KEYS.ORDERS }),
                    href: PortfolioRoute.Orders,
                  },
                  {
                    value: PortfolioRoute.Fees,
                    slotBefore: <Styled.Icon iconName={IconName.Calculator} />,
                    label: stringGetter({ key: STRING_KEYS.FEES }),
                    href: PortfolioRoute.Fees,
                  },
                  {
                    value: PortfolioRoute.History,
                    slotBefore: <Styled.Icon iconName={IconName.History} />,
                    label: stringGetter({ key: STRING_KEYS.HISTORY }),
                    href: PortfolioRoute.History,
                  },
                ],
              },
              // TODO(aforaleka) Add back subitems when there are clearer designs
              // or when transfers and payments are ready
            ]}
          />
        )
      }
    >
      {routesComponent}
    </WithSidebar>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.PortfolioMobile = styled.div`
  min-height: 100%;
  ${layoutMixins.expandingColumnWithHeader}
`;

Styled.NavigationMenu = styled(NavigationMenu)`
  padding: 0.5rem;
  padding-top: 0;
`;

Styled.Icon = styled(Icon)`
  --icon-backgroundColor: var(--color-layer-4);

  width: 1em;
  height: 1em;

  margin-left: -0.25em;

  box-sizing: content-box;
  background-color: var(--icon-backgroundColor);
  border-radius: 50%;
  padding: 0.25em;
`;
