import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, PortfolioRoute } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AttachedExpandingSection, DetachedSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { PositionsTable, PositionsTableColumnKey } from '@/views/tables/PositionsTable';

import {
  calculateShouldRenderActionsInPositionsTable,
  calculateShouldRenderTriggersInPositionsTable,
} from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';

import { isTruthy } from '@/lib/isTruthy';

import { MaybeUnopenedIsolatedPositionsPanel } from '../trade/UnopenedIsolatedPositions';
import { MaybeVaultPositionsPanel } from '../vaults/VaultPositions';
import { AccountDetailsAndHistory } from './AccountDetailsAndHistory';

export const Overview = () => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const navigate = useNavigate();

  const handleViewUnopenedIsolatedOrders = useCallback(() => {
    navigate(`${AppRoute.Portfolio}/${PortfolioRoute.Orders}`, {
      state: { from: AppRoute.Portfolio },
    });
  }, [navigate]);

  const handleViewVault = useCallback(
    (vaultId: string) => {
      navigate(`${AppRoute.Vaults}/${vaultId}`, {
        state: { from: AppRoute.Portfolio },
      });
    },
    [navigate]
  );
  const handleViewVaults = useCallback(
    () => navigate(AppRoute.Vaults, { state: { from: AppRoute.Portfolio } }),
    [navigate]
  );

  const shouldRenderTriggers = useAppSelector(calculateShouldRenderTriggersInPositionsTable);
  const shouldRenderActions = useParameterizedSelector(
    calculateShouldRenderActionsInPositionsTable
  );

  return (
    <div>
      <DetachedSection>
        <AccountDetailsAndHistory />
      </DetachedSection>

      <$AttachedExpandingSection>
        <ContentSectionHeader title={stringGetter({ key: STRING_KEYS.OPEN_POSITIONS })} />

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
      </$AttachedExpandingSection>
      <DetachedSection>
        <$MaybeUnopenedIsolatedPositionsPanel
          header={
            <ContentSectionHeader
              title={stringGetter({ key: STRING_KEYS.UNOPENED_ISOLATED_POSITIONS })}
            />
          }
          onViewOrders={handleViewUnopenedIsolatedOrders}
        />
      </DetachedSection>
      <DetachedSection>
        <$MaybeVaultPositionsPanel
          header={
            <ContentSectionHeader
              title={stringGetter({ key: STRING_KEYS.VAULTS })}
              slotRight={
                isTablet && (
                  <$Link onClick={handleViewVaults} isAccent>
                    {stringGetter({ key: STRING_KEYS.VIEW_ALL_VAULTS })}{' '}
                    <Icon iconName={IconName.Arrow} />
                  </$Link>
                )
              }
            />
          }
          onViewVault={handleViewVault}
        />
      </DetachedSection>
    </div>
  );
};

const $AttachedExpandingSection = styled(AttachedExpandingSection)`
  margin-top: 1rem;
`;

const $MaybeUnopenedIsolatedPositionsPanel = styled(MaybeUnopenedIsolatedPositionsPanel)`
  margin-top: 1rem;
  margin-bottom: 1rem;

  > div {
    padding-left: 1rem;
  }
`;

const $MaybeVaultPositionsPanel = styled(MaybeVaultPositionsPanel)`
  margin-top: 1rem;
  margin-bottom: 1rem;

  > div {
    padding-left: 1rem;
  }
`;

const $Link = styled(Link)`
  font: var(--font-small-book);
`;
