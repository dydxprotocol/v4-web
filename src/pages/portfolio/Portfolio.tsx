import { lazy, Suspense } from 'react';

import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';
import styled, { type AnyStyledComponent } from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { ButtonAction } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { HistoryRoute, PortfolioRoute } from '@/constants/routes';

import { useAccountBalance, useBreakpoints, useDocumentTitle, useStringGetter } from '@/hooks';
import { useComplianceState } from '@/hooks/useComplianceState';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { NavigationMenu } from '@/components/NavigationMenu';
import { Tag, TagType } from '@/components/Tag';
import { WithSidebar } from '@/components/WithSidebar';
import { FillsTable, FillsTableColumnKey } from '@/views/tables/FillsTable';
import { FundingPaymentsTable } from '@/views/tables/FundingPaymentsTable';
import { TransferHistoryTable } from '@/views/tables/TransferHistoryTable';

import { getOnboardingState, getSubaccount, getTradeInfoNumbers } from '@/state/accountSelectors';
import { openDialog } from '@/state/dialogs';

import { shortenNumberForDisplay } from '@/lib/numbers';

import { PortfolioNavMobile } from './PortfolioNavMobile';

const Overview = lazy(() => import('./Overview').then((module) => ({ default: module.Overview })));
const Positions = lazy(() =>
  import('./Positions').then((module) => ({ default: module.Positions }))
);
const Orders = lazy(() => import('./Orders').then((module) => ({ default: module.Orders })));
const Fees = lazy(() => import('./Fees').then((module) => ({ default: module.Fees })));
const History = lazy(() => import('./History').then((module) => ({ default: module.History })));

export default () => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();
  const { isTablet, isNotTablet } = useBreakpoints();
  const { complianceState } = useComplianceState();

  const onboardingState = useSelector(getOnboardingState);
  const { freeCollateral } = useSelector(getSubaccount, shallowEqual) || {};
  const { nativeTokenBalance } = useAccountBalance();

  const { numTotalPositions, numTotalOpenOrders } =
    useSelector(getTradeInfoNumbers, shallowEqual) || {};
  const numPositions = shortenNumberForDisplay(numTotalPositions);
  const numOrders = shortenNumberForDisplay(numTotalOpenOrders);

  const usdcBalance = freeCollateral?.current || 0;

  useDocumentTitle(stringGetter({ key: STRING_KEYS.PORTFOLIO }));

  const routesComponent = (
    <Suspense fallback={<LoadingSpace id="portfolio" />}>
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
          <Route
            path={HistoryRoute.Transfers}
            element={<TransferHistoryTable withOuterBorder={isNotTablet} />}
          />
          <Route
            path={HistoryRoute.Payments}
            element={<FundingPaymentsTable withOuterBorder={isNotTablet} />}
          />
        </Route>
        <Route path="*" element={<Navigate to={PortfolioRoute.Overview} replace />} />
      </Routes>
    </Suspense>
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
          <Styled.SideBar>
            <Styled.NavigationMenu
              items={[
                {
                  group: 'views',
                  groupLabel: stringGetter({ key: STRING_KEYS.VIEWS }),
                  items: [
                    {
                      value: PortfolioRoute.Overview,
                      slotBefore: (
                        <Styled.IconContainer>
                          <Icon iconName={IconName.Overview} />
                        </Styled.IconContainer>
                      ),
                      label: stringGetter({ key: STRING_KEYS.OVERVIEW }),
                      href: PortfolioRoute.Overview,
                    },
                    {
                      value: PortfolioRoute.Positions,
                      slotBefore: (
                        <Styled.IconContainer>
                          <Icon iconName={IconName.Positions} />
                        </Styled.IconContainer>
                      ),
                      label: (
                        <>
                          {stringGetter({ key: STRING_KEYS.POSITIONS })}
                          {numPositions &&
                            (typeof numPositions === 'string' || numPositions > 0) && (
                              <Tag type={TagType.Number}> {numPositions} </Tag>
                            )}
                        </>
                      ),
                      href: PortfolioRoute.Positions,
                    },
                    {
                      value: PortfolioRoute.Orders,
                      slotBefore: (
                        <Styled.IconContainer>
                          <Icon iconName={IconName.OrderPending} />
                        </Styled.IconContainer>
                      ),
                      label: (
                        <>
                          {stringGetter({ key: STRING_KEYS.ORDERS })}
                          {numOrders && (typeof numOrders === 'string' || numOrders > 0) && (
                            <Tag type={TagType.Number}> {numOrders} </Tag>
                          )}
                        </>
                      ),
                      href: PortfolioRoute.Orders,
                    },
                    {
                      value: PortfolioRoute.Fees,
                      slotBefore: (
                        <Styled.IconContainer>
                          <Icon iconName={IconName.Calculator} />
                        </Styled.IconContainer>
                      ),
                      label: stringGetter({ key: STRING_KEYS.FEES }),
                      href: PortfolioRoute.Fees,
                    },
                    {
                      value: PortfolioRoute.History,
                      slotBefore: (
                        <Styled.IconContainer>
                          <Icon iconName={IconName.History} />
                        </Styled.IconContainer>
                      ),
                      label: stringGetter({ key: STRING_KEYS.HISTORY }),
                      href: PortfolioRoute.History,
                    },
                  ],
                },
              ]}
            />
            {onboardingState === OnboardingState.AccountConnected && (
              <Styled.Footer>
                {complianceState === ComplianceStates.FULLACCESS && (
                  <Button
                    action={ButtonAction.Primary}
                    onClick={() => dispatch(openDialog({ type: DialogTypes.Deposit }))}
                  >
                    {stringGetter({ key: STRING_KEYS.DEPOSIT })}
                  </Button>
                )}
                {usdcBalance > 0 && (
                  <Button
                    action={ButtonAction.Base}
                    onClick={() => dispatch(openDialog({ type: DialogTypes.Withdraw }))}
                  >
                    {stringGetter({ key: STRING_KEYS.WITHDRAW })}
                  </Button>
                )}
                {(usdcBalance > 0 || nativeTokenBalance.gt(0)) && (
                  <Button
                    action={ButtonAction.Base}
                    onClick={() => dispatch(openDialog({ type: DialogTypes.Transfer }))}
                  >
                    {stringGetter({ key: STRING_KEYS.TRANSFER })}
                  </Button>
                )}
              </Styled.Footer>
            )}
          </Styled.SideBar>
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

Styled.SideBar = styled.div`
  ${layoutMixins.flexColumn}
  justify-content: space-between;

  height: 100%;
`;

Styled.Footer = styled.div`
  ${layoutMixins.row}
  flex-wrap: wrap;

  padding: 1rem;

  gap: 0.5rem;

  > button {
    flex-grow: 1;
  }
`;

Styled.NavigationMenu = styled(NavigationMenu)`
  padding: 0.5rem;
  padding-top: 0;
`;

Styled.IconContainer = styled.div`
  width: 1.5rem;
  height: 1.5rem;
  font-size: 0.75rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--color-layer-4);
  border-radius: 50%;
  margin-left: -0.25rem;
`;
