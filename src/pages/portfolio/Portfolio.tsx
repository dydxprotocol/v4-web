import { lazy, Suspense } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { Navigate, Route, Routes } from 'react-router-dom';
import styled from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { ButtonAction } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';
import { HistoryRoute, PortfolioRoute } from '@/constants/routes';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { NavigationMenu } from '@/components/NavigationMenu';
import { Tag, TagType } from '@/components/Tag';
import { WithSidebar } from '@/components/WithSidebar';
import { TradeHistoryList } from '@/views/Lists/Trade/TradeHistoryList';
import { AccountHistoryList } from '@/views/Lists/Transfers/AccountHistoryList';
import { FundingHistoryList } from '@/views/Lists/Transfers/FundingHistoryList';
import { VaultTransferList } from '@/views/Lists/Transfers/VaultTransferList';
import { FillsTable, FillsTableColumnKey } from '@/views/tables/FillsTable';
import { TransferHistoryTable } from '@/views/tables/TransferHistoryTable';

import { getOnboardingState, getSubaccountFreeCollateral } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { shortenNumberForDisplay } from '@/lib/numbers';

import { FundingPaymentsTable } from '../funding/FundingPaymentsTable';
import { VaultTransactionsTable } from '../vaults/VaultTransactions';
import { PortfolioNavMobile } from './PortfolioNavMobile';

const Overview = lazy(() => import('./Overview').then((module) => ({ default: module.Overview })));
const Positions = lazy(() =>
  import('./Positions').then((module) => ({ default: module.Positions }))
);
const Orders = lazy(() => import('./Orders').then((module) => ({ default: module.Orders })));
const Fees = lazy(() => import('./Fees').then((module) => ({ default: module.Fees })));
const EquityTiers = lazy(() =>
  import('./EquityTiers').then((module) => ({ default: module.EquityTiers }))
);

const History = lazy(() => import('./History').then((module) => ({ default: module.History })));
const SimpleUiHistory = lazy(() =>
  import('./SimpleUiHistory').then((module) => ({ default: module.SimpleUiHistory }))
);

const PortfolioPage = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const { isTablet, isNotTablet } = useBreakpoints();
  const { complianceState } = useComplianceState();

  const initialPageSize = 20;
  const isSimpleUi = useSimpleUiEnabled();

  const onboardingState = useAppSelector(getOnboardingState);
  const freeCollateral = useAppSelector(getSubaccountFreeCollateral);
  const { nativeTokenBalance } = useAccountBalance();

  const numTotalOpenOrders = useAppSelector(BonsaiCore.account.openOrders.data).length;
  const numTotalPositions = (
    useAppSelector(BonsaiCore.account.parentSubaccountPositions.data) ?? EMPTY_ARR
  ).length;

  const numPositions = shortenNumberForDisplay(numTotalPositions);
  const numOrders = shortenNumberForDisplay(numTotalOpenOrders);

  const usdcBalance = freeCollateral ?? 0;

  useDocumentTitle(stringGetter({ key: STRING_KEYS.PORTFOLIO }));

  const routesComponent = isSimpleUi ? (
    <Suspense fallback={<LoadingSpace id="portfolio" />}>
      <Routes>
        <Route path={PortfolioRoute.History} element={<SimpleUiHistory />}>
          <Route index path="*" element={<Navigate to={HistoryRoute.Trades} />} />
          <Route path={HistoryRoute.Trades} element={<TradeHistoryList />} />
          <Route path={HistoryRoute.Transfers} element={<AccountHistoryList />} />
          <Route path={HistoryRoute.VaultTransfers} element={<VaultTransferList />} />
          <Route path={HistoryRoute.Payments} element={<FundingHistoryList />} />
        </Route>
        <Route
          path="*"
          element={<Navigate to={`${PortfolioRoute.History}/${HistoryRoute.Trades}`} replace />}
        />
      </Routes>
    </Suspense>
  ) : (
    <Suspense fallback={<LoadingSpace id="portfolio" />}>
      <Routes>
        <Route path={PortfolioRoute.Overview} element={<Overview />} />
        <Route path={PortfolioRoute.Positions} element={<Positions />} />
        <Route path={PortfolioRoute.Orders} element={<Orders />} />
        <Route path={PortfolioRoute.Fees} element={<Fees />} />
        <Route path={PortfolioRoute.EquityTiers} element={<EquityTiers />} />
        <Route path={PortfolioRoute.History} element={<History />}>
          <Route index path="*" element={<Navigate to={HistoryRoute.Trades} />} />
          <Route
            path={HistoryRoute.Trades}
            element={
              <FillsTable
                initialPageSize={initialPageSize}
                columnKeys={
                  isTablet
                    ? [
                        FillsTableColumnKey.Time,
                        FillsTableColumnKey.TypeAmount,
                        FillsTableColumnKey.PriceFee,
                      ]
                    : [
                        FillsTableColumnKey.Market,
                        FillsTableColumnKey.Time,
                        FillsTableColumnKey.Type,
                        FillsTableColumnKey.Side,
                        FillsTableColumnKey.AmountTag,
                        FillsTableColumnKey.Price,
                        FillsTableColumnKey.Total,
                        FillsTableColumnKey.Fee,
                        FillsTableColumnKey.Liquidity,
                      ]
                }
                withOuterBorder={isNotTablet}
              />
            }
          />
          <Route
            path={HistoryRoute.Transfers}
            element={
              <TransferHistoryTable
                initialPageSize={initialPageSize}
                withOuterBorder={isNotTablet}
              />
            }
          />
          <Route
            path={HistoryRoute.VaultTransfers}
            element={
              <VaultTransactionsTable
                withOuterBorders
                withTxHashLink
                emptyString={stringGetter({ key: STRING_KEYS.YOU_HAVE_NO_VAULT_BALANCE })}
              />
            }
          />
          <Route
            path={HistoryRoute.Payments}
            element={
              <FundingPaymentsTable
                initialPageSize={initialPageSize}
                withOuterBorder={isNotTablet}
              />
            }
          />
        </Route>
        <Route path="*" element={<Navigate to={PortfolioRoute.Overview} replace />} />
      </Routes>
    </Suspense>
  );

  if (isSimpleUi) {
    return routesComponent;
  }

  return isTablet ? (
    <$PortfolioMobile>
      <PortfolioNavMobile />
      <$MobileContent>{routesComponent}</$MobileContent>
    </$PortfolioMobile>
  ) : (
    <WithSidebar
      sidebar={
        <div tw="flexColumn h-full justify-between">
          <NavigationMenu
            items={[
              {
                group: 'views',
                groupLabel: stringGetter({ key: STRING_KEYS.VIEWS }),
                items: [
                  {
                    value: PortfolioRoute.Overview,
                    slotBefore: (
                      <$IconContainer>
                        <Icon iconName={IconName.Overview} />
                      </$IconContainer>
                    ),
                    label: stringGetter({ key: STRING_KEYS.OVERVIEW }),
                    href: PortfolioRoute.Overview,
                  },
                  {
                    value: PortfolioRoute.Positions,
                    slotBefore: (
                      <$IconContainer>
                        <Icon iconName={IconName.Positions} />
                      </$IconContainer>
                    ),
                    label: (
                      <>
                        {stringGetter({ key: STRING_KEYS.POSITIONS })}
                        {numPositions && (typeof numPositions === 'string' || numPositions > 0) && (
                          <Tag type={TagType.Number}> {numPositions} </Tag>
                        )}
                      </>
                    ),
                    href: PortfolioRoute.Positions,
                  },
                  {
                    value: PortfolioRoute.Orders,
                    slotBefore: (
                      <$IconContainer>
                        <Icon iconName={IconName.OrderPending} />
                      </$IconContainer>
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
                      <$IconContainer>
                        <Icon iconName={IconName.Calculator} />
                      </$IconContainer>
                    ),
                    label: stringGetter({ key: STRING_KEYS.FEES }),
                    href: PortfolioRoute.Fees,
                  },
                  {
                    value: PortfolioRoute.EquityTiers,
                    slotBefore: (
                      <$IconContainer>
                        <Icon iconName={IconName.List} />
                      </$IconContainer>
                    ),
                    label: stringGetter({ key: STRING_KEYS.EQUITY_TIERS }),
                    href: PortfolioRoute.EquityTiers,
                  },
                  {
                    value: PortfolioRoute.History,
                    slotBefore: (
                      <$IconContainer>
                        <Icon iconName={IconName.History} />
                      </$IconContainer>
                    ),
                    label: stringGetter({ key: STRING_KEYS.HISTORY }),
                    href: PortfolioRoute.History,
                  },
                ],
              },
            ]}
            tw="p-0.5 pt-0"
          />
          {onboardingState === OnboardingState.AccountConnected && (
            <$Footer>
              {complianceState === ComplianceStates.FULL_ACCESS && (
                <Button
                  action={ButtonAction.Primary}
                  onClick={() => dispatch(openDialog(DialogTypes.Deposit2({})))}
                >
                  {stringGetter({ key: STRING_KEYS.DEPOSIT })}
                </Button>
              )}
              {usdcBalance > 0 && (
                <Button
                  action={ButtonAction.Base}
                  onClick={() => dispatch(openDialog(DialogTypes.Withdraw2({})))}
                >
                  {stringGetter({ key: STRING_KEYS.WITHDRAW })}
                </Button>
              )}
              {complianceState === ComplianceStates.FULL_ACCESS &&
                (usdcBalance > 0 || nativeTokenBalance.gt(0)) && (
                  <Button
                    action={ButtonAction.Base}
                    onClick={() => dispatch(openDialog(DialogTypes.Transfer({})))}
                  >
                    {stringGetter({ key: STRING_KEYS.TRANSFER })}
                  </Button>
                )}
            </$Footer>
          )}
        </div>
      }
    >
      {routesComponent}
    </WithSidebar>
  );
};

export default PortfolioPage;

const $PortfolioMobile = styled.div`
  min-height: 100%;
  ${layoutMixins.expandingColumnWithHeader}
`;
const $Footer = styled.div`
  ${layoutMixins.row}
  flex-wrap: wrap;

  padding: 1rem;

  gap: 0.5rem;

  > button {
    flex-grow: 1;
  }
`;
const $IconContainer = styled.div`
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

const $MobileContent = styled.article`
  ${layoutMixins.contentContainerPage}
`;
