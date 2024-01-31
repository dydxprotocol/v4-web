import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { WithSidebar } from '@/components/WithSidebar';
import { TokenRoute } from '@/constants/routes';
import styled, { AnyStyledComponent } from 'styled-components';
import { layoutMixins } from '@/styles/layoutMixins';
import { Icon, IconName } from '@/components/Icon';
import { NavigationMenu } from '@/components/NavigationMenu';
import { useBreakpoints, useStringGetter, useTokenConfigs } from '@/hooks';
import { STRING_KEYS } from '@/constants/localization';
import { AssetIcon } from '@/components/AssetIcon';

const RewardsPage = lazy(() => import('./rewards/RewardsPage'));

export default () => {
  const { isTablet } = useBreakpoints();
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();

  const routesComponent = (
    <Suspense fallback={<LoadingSpace id="token-page" />}>
      <Routes>
        <Route path={TokenRoute.TradingRewards} element={<RewardsPage />} />
        <Route path={TokenRoute.StakingRewards} element={<div>Staking</div>} />
        <Route path={TokenRoute.Governance} element={<div>Governance</div>} />
        <Route path="*" element={<Navigate to={TokenRoute.TradingRewards} replace />} />
      </Routes>
    </Suspense>
  );

  return (
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
                      value: TokenRoute.TradingRewards,
                      slotBefore: <AssetIcon symbol={chainTokenLabel} />,
                      label: stringGetter({ key: STRING_KEYS.TRADING_REWARDS }),
                      href: TokenRoute.TradingRewards,
                    },
                    {
                      value: TokenRoute.StakingRewards,
                      slotBefore: <Styled.Icon iconName={IconName.CurrencySign} />,
                      label: 'Staking Rewards', // stringGetter({ key: STRING_KEYS.STAKING_REWARDS }),
                      href: TokenRoute.StakingRewards,
                    },
                    {
                      value: TokenRoute.Governance,
                      slotBefore: <Styled.Icon iconName={IconName.Governance} />,
                      label: stringGetter({ key: STRING_KEYS.GOVERNANCE }),
                      href: TokenRoute.Governance,
                    },
                  ],
                },
              ]}
            />
          </Styled.SideBar>
        )
      }
    >
      {routesComponent}
    </WithSidebar>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

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
