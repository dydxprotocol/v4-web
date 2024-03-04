import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints, useStringGetter } from '@/hooks';

import { AttachedExpandingSection, DetachedSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { PositionsTable, PositionsTableColumnKey } from '@/views/tables/PositionsTable';

import { AccountDetailsAndHistory } from './AccountDetailsAndHistory';

export const Overview = () => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();

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
                ]
          }
          currentRoute={AppRoute.Portfolio}
          withGradientCardRows
        />
      </Styled.AttachedExpandingSection>
    </div>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.AttachedExpandingSection = styled(AttachedExpandingSection)`
  margin-top: 1rem;
`;
