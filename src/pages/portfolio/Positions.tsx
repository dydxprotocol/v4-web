import { useNavigate } from 'react-router-dom';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, PortfolioRoute } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AttachedExpandingSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { PositionsTable, PositionsTableColumnKey } from '@/views/tables/PositionsTable';

import {
  calculateShouldRenderActionsInPositionsTable,
  calculateShouldRenderTriggersInPositionsTable,
} from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';

import { isTruthy } from '@/lib/isTruthy';
import { testFlags } from '@/lib/testFlags';

export const Positions = () => {
  const stringGetter = useStringGetter();
  const { isTablet, isNotTablet } = useBreakpoints();
  const navigate = useNavigate();

  const showClosePositionAction = false;

  const shouldRenderTriggers = useAppSelector(calculateShouldRenderTriggersInPositionsTable);
  const shouldRenderActions = useParameterizedSelector(
    calculateShouldRenderActionsInPositionsTable,
    showClosePositionAction
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
                testFlags.isolatedMargin && PositionsTableColumnKey.Margin,
                PositionsTableColumnKey.UnrealizedPnl,
                !testFlags.isolatedMargin && PositionsTableColumnKey.RealizedPnl,
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
