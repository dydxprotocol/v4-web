import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, PortfolioRoute } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AttachedExpandingSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { PositionsTable, PositionsTableColumnKey } from '@/views/tables/PositionsTable';

import {
  calculateShouldRenderActionsInPositionsTable,
  calculateShouldRenderTriggersInPositionsTable,
} from '@/state/accountCalculators';

import { isTruthy } from '@/lib/isTruthy';

export const Positions = () => {
  const stringGetter = useStringGetter();
  const { isTablet, isNotTablet } = useBreakpoints();
  const navigate = useNavigate();

  const showClosePositionAction = false;

  const shouldRenderTriggers = useSelector(calculateShouldRenderTriggersInPositionsTable);
  const shouldRenderActions = useSelector(
    calculateShouldRenderActionsInPositionsTable(showClosePositionAction)
  );

  return (
    <AttachedExpandingSection>
      {isNotTablet && <ContentSectionHeader title={stringGetter({ key: STRING_KEYS.POSITIONS })} />}

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
                PositionsTableColumnKey.NetFunding,
                PositionsTableColumnKey.AverageOpenAndClose,
                PositionsTableColumnKey.LiquidationAndOraclePrice,
                shouldRenderTriggers && PositionsTableColumnKey.Triggers,
                shouldRenderActions && PositionsTableColumnKey.Actions,
              ].filter(isTruthy)
        }
        currentRoute={`${AppRoute.Portfolio}/${PortfolioRoute.Positions}`}
        withOuterBorder={isNotTablet}
        showClosePositionAction={showClosePositionAction}
        navigateToOrders={() =>
          navigate(`${AppRoute.Portfolio}/${PortfolioRoute.Orders}`, {
            state: { from: AppRoute.Portfolio },
          })
        }
      />
    </AttachedExpandingSection>
  );
};
