import { Suspense, lazy } from 'react';

import { Navigate, Route, Routes } from 'react-router-dom';
import styled from 'styled-components';

import { TokenRoute } from '@/constants/routes';

import { layoutMixins } from '@/styles/layoutMixins';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

const RewardsPage = lazy(() => import('./rewards/RewardsPage'));

const Token = () => {
  const routesComponent = (
    <Suspense fallback={<LoadingSpace id="token-page" />}>
      <Routes>
        <Route path={TokenRoute.TradingRewards} element={<RewardsPage />} />
        <Route path="*" element={<Navigate to={TokenRoute.TradingRewards} replace />} />
      </Routes>
    </Suspense>
  );

  return (
    // <WithSidebar
    //   sidebar={
    //     isTablet || isStakingEnabled ? null : (
    //       <$SideBar>
    //         <$NavigationMenu
    //           items={[
    //             {
    //               group: 'views',
    //               groupLabel: stringGetter({ key: STRING_KEYS.VIEWS }),
    //               items: [
    //                 {
    //                   value: TokenRoute.TradingRewards,
    //                   slotBefore: (
    //                     <$IconContainer>
    //                       <Icon iconName={IconName.Token} />
    //                     </$IconContainer>
    //                   ),
    //                   label: stringGetter({ key: STRING_KEYS.TRADING_REWARDS }),
    //                   href: TokenRoute.TradingRewards,
    //                 },
    //                 {
    //                   value: TokenRoute.StakingRewards,
    //                   slotBefore: (
    //                     <$IconContainer>
    //                       <Icon iconName={IconName.CurrencySign} />
    //                     </$IconContainer>
    //                   ),
    //                   label: stringGetter({ key: STRING_KEYS.STAKING_REWARDS }),
    //                   href: TokenRoute.StakingRewards,
    //                   tag: stringGetter({ key: STRING_KEYS.NEW }),
    //                 },
    //                 {
    //                   value: TokenRoute.Governance,
    //                   slotBefore: (
    //                     <$IconContainer>
    //                       <Icon iconName={IconName.Governance} />
    //                     </$IconContainer>
    //                   ),
    //                   label: stringGetter({ key: STRING_KEYS.GOVERNANCE }),
    //                   href: TokenRoute.Governance,
    //                 },
    //               ],
    //             },
    //           ]}
    //         />
    //       </$SideBar>
    //     )
    //   }
    // >
    <$Page>{routesComponent}</$Page>
    // </WithSidebar>
  );
};
export default Token;

const $Page = styled.div`
  ${layoutMixins.contentContainerPage};
`;
