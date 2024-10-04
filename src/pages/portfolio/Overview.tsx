import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, PortfolioRoute } from '@/constants/routes';
import { StatsigDynamicConfigs, StatsigFlags } from '@/constants/statsig';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useShouldShowTriggers } from '@/hooks/useShouldShowTriggers';
import { useAllStatsigDynamicConfigValues, useStatsigGateValue } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AttachedExpandingSection, DetachedSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { AffiliatesBanner } from '@/views/AffiliatesBanner';
import { TelegramInviteBanner } from '@/views/TelegramInviteBanner';
import { PositionsTable, PositionsTableColumnKey } from '@/views/tables/PositionsTable';

import { calculateShouldRenderActionsInPositionsTable } from '@/state/accountCalculators';

import { isTruthy } from '@/lib/isTruthy';

import { MaybeUnopenedIsolatedPositionsPanel } from '../trade/UnopenedIsolatedPositions';
import { AccountDetailsAndHistory } from './AccountDetailsAndHistory';
import { AccountOverviewSection } from './AccountOverviewSection';

export const Overview = () => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();

  const { isTablet } = useBreakpoints();
  const { dydxAddress } = useAccounts();

  const dynamicConfigs = useAllStatsigDynamicConfigValues();
  const feedbackRequestWalletAddresses =
    dynamicConfigs?.[StatsigDynamicConfigs.dcHighestVolumeUsers];
  const shouldShowTelegramInvite =
    dydxAddress && feedbackRequestWalletAddresses?.includes(dydxAddress);
  const affiliatesEnabled = useStatsigGateValue(StatsigFlags.ffEnableAffiliates);

  const handleViewUnopenedIsolatedOrders = useCallback(() => {
    navigate(`${AppRoute.Portfolio}/${PortfolioRoute.Orders}`, {
      state: { from: AppRoute.Portfolio },
    });
  }, [navigate]);

  const shouldRenderTriggers = useShouldShowTriggers();
  const shouldRenderActions = useParameterizedSelector(
    calculateShouldRenderActionsInPositionsTable
  );

  return (
    <div>
      {shouldShowTelegramInvite && (
        <DetachedSection>
          <TelegramInviteBanner />
        </DetachedSection>
      )}

      <DetachedSection>
        <AccountOverviewSection />
      </DetachedSection>

      <DetachedSection>
        <AccountDetailsAndHistory />
      </DetachedSection>

      {affiliatesEnabled && dydxAddress && (
        <DetachedSection>
          <AffiliatesBanner />
        </DetachedSection>
      )}

      <AttachedExpandingSection tw="mt-1">
        <$PortfolioContentSectionHeader title={stringGetter({ key: STRING_KEYS.OPEN_POSITIONS })} />

        <PositionsTable
          columnKeys={
            isTablet
              ? [
                  PositionsTableColumnKey.Details,
                  PositionsTableColumnKey.IndexEntry,
                  PositionsTableColumnKey.PnL,
                ]
              : [
                  PositionsTableColumnKey.Market,
                  PositionsTableColumnKey.Size,
                  PositionsTableColumnKey.Margin,
                  PositionsTableColumnKey.UnrealizedPnl,
                  PositionsTableColumnKey.RealizedPnl,
                  PositionsTableColumnKey.AverageOpenAndClose,
                  PositionsTableColumnKey.LiquidationAndOraclePrice,
                  shouldRenderTriggers && PositionsTableColumnKey.Triggers,
                  shouldRenderActions && PositionsTableColumnKey.Actions,
                ].filter(isTruthy)
          }
          currentRoute={AppRoute.Portfolio}
          navigateToOrders={() =>
            navigate(`${AppRoute.Portfolio}/${PortfolioRoute.Orders}`, {
              state: { from: AppRoute.Portfolio },
            })
          }
          showClosePositionAction={shouldRenderActions}
          withOuterBorder
        />
      </AttachedExpandingSection>
      <DetachedSection>
        <$MaybeUnopenedIsolatedPositionsPanel
          header={
            <$PortfolioContentSectionHeader
              title={stringGetter({ key: STRING_KEYS.UNOPENED_ISOLATED_POSITIONS })}
            />
          }
          onViewOrders={handleViewUnopenedIsolatedOrders}
        />
      </DetachedSection>
    </div>
  );
};

const $PortfolioContentSectionHeader = styled(ContentSectionHeader)`
  h3 {
    font: var(--font-medium-medium);
  }
`;
const $MaybeUnopenedIsolatedPositionsPanel = styled(MaybeUnopenedIsolatedPositionsPanel)`
  margin-top: 1rem;
  margin-bottom: 1rem;

  > div {
    padding-left: 1rem;
  }
`;
