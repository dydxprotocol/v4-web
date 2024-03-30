import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, PortfolioRoute } from '@/constants/routes';

import { useBreakpoints, useStringGetter } from '@/hooks';

import { AttachedExpandingSection, DetachedSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { PositionsTable, PositionsTableColumnKey } from '@/views/tables/PositionsTable';

import {
  calculateShouldRenderActionsInPositionsTable,
  calculateShouldRenderTriggersInPositionsTable,
} from '@/state/accountCalculators';

import { isTruthy } from '@/lib/isTruthy';

import { AccountDetailsAndHistory } from './AccountDetailsAndHistory';

export const Overview = () => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const navigate = useNavigate();

  const shouldRenderTriggers = useSelector(calculateShouldRenderTriggersInPositionsTable);
  const shouldRenderActions = useSelector(calculateShouldRenderActionsInPositionsTable);

  return (
    <div>
      <DetachedSection>
        <AccountDetailsAndHistory />
      </DetachedSection>

      <Styled.AttachedExpandingSection>
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
                  PositionsTableColumnKey.Side,
                  PositionsTableColumnKey.Size,
                  PositionsTableColumnKey.Leverage,
                  PositionsTableColumnKey.LiquidationAndOraclePrice,
                  PositionsTableColumnKey.UnrealizedPnl,
                  PositionsTableColumnKey.RealizedPnl,
                  PositionsTableColumnKey.AverageOpenAndClose,
                  shouldRenderTriggers && PositionsTableColumnKey.Triggers,
                  // TODO: CT-503 re-enable when close positions dialog is created
                  // shouldRenderActions && PositionsTableColumnKey.Actions,
                ].filter(isTruthy)
          }
          currentRoute={AppRoute.Portfolio}
          navigateToOrders={() =>
            navigate(`${AppRoute.Portfolio}/${PortfolioRoute.Orders}`, {
              state: { from: AppRoute.Portfolio },
            })
          }
          withOuterBorder
        />
      </Styled.AttachedExpandingSection>
    </div>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.AttachedExpandingSection = styled(AttachedExpandingSection)`
  margin-top: 1rem;
`;
