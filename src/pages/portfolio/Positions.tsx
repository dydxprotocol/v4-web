import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, PortfolioRoute } from '@/constants/routes';
import { useBreakpoints, useStringGetter } from '@/hooks';

import { AttachedExpandingSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { PositionsTable, PositionsTableColumnKey } from '@/views/tables/PositionsTable';

export const Positions = () => {
  const stringGetter = useStringGetter();
  const { isTablet, isNotTablet } = useBreakpoints();

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
              ]
        }
        currentRoute={`${AppRoute.Portfolio}/${PortfolioRoute.Positions}`}
        withOuterBorder={isNotTablet}
      />
    </AttachedExpandingSection>
  );
};
