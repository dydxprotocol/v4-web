import { useSelector } from 'react-redux';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, PortfolioRoute } from '@/constants/routes';

import { useBreakpoints, useStringGetter } from '@/hooks';

import { AttachedExpandingSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';

import { PositionsTable, PositionsTableColumnKey } from '@/views/tables/PositionsTable';

import { calculateShouldRenderActionsInPositionsTable } from '@/state/accountCalculators';

import { isTruthy } from '@/lib/isTruthy';

export const Positions = () => {
  const stringGetter = useStringGetter();
  const { isTablet, isNotTablet } = useBreakpoints();
  const shouldRenderActions = useSelector(calculateShouldRenderActionsInPositionsTable);

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
                PositionsTableColumnKey.Side,
                PositionsTableColumnKey.Size,
                PositionsTableColumnKey.Leverage,
                PositionsTableColumnKey.LiquidationAndOraclePrice,
                PositionsTableColumnKey.UnrealizedPnl,
                PositionsTableColumnKey.RealizedPnl,
                PositionsTableColumnKey.AverageOpenAndClose,
                shouldRenderActions && PositionsTableColumnKey.Actions
              ].filter(isTruthy)
        }
        currentRoute={`${AppRoute.Portfolio}/${PortfolioRoute.Positions}`}
        withOuterBorder={isNotTablet}
      />
    </AttachedExpandingSection>
  );
};
