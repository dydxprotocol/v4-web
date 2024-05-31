import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { EquityTier } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { AttachedExpandingSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { ColumnDef, Table } from '@/components/Table';

import { getStatefulOrderEquityTiers } from '@/state/configsSelectors';

export const EquityTiers = () => {
  const stringGetter = useStringGetter();
  const equityTiers = useSelector(getStatefulOrderEquityTiers, shallowEqual);
  const { isNotTablet } = useBreakpoints();
  const { equityTiersLearnMore } = useURLConfigs();

  return (
    <AttachedExpandingSection>
      {isNotTablet && (
        <ContentSectionHeader title={stringGetter({ key: STRING_KEYS.EQUITY_TIERS })} />
      )}
      <$ContentWrapper>
        <$Description>
          <span>
            {stringGetter({
              key: STRING_KEYS.EQUITY_TIERS_DESCRIPTION_LONG,
            })}
          </span>
          {equityTiersLearnMore && (
            <Link href={equityTiersLearnMore}>
              {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
            </Link>
          )}
        </$Description>
        <$Table
          label={stringGetter({ key: STRING_KEYS.EQUITY_TIERS })}
          data={equityTiers ?? []}
          getRowKey={(row: EquityTier) => row.requiredTotalNetCollateralUSD}
          columns={
            [
              {
                columnKey: 'net_collateral',
                label: stringGetter({ key: STRING_KEYS.NET_COLLATERAL }),
                allowsSorting: false,
                renderCell: ({
                  requiredTotalNetCollateralUSD,
                  nextLevelRequiredTotalNetCollateralUSD,
                }) => (
                  <$NetCollateralValue>
                    {requiredTotalNetCollateralUSD > 0 && (
                      <>
                        <span>{`≥ `}</span>
                        <$HighlightOutput
                          type={OutputType.CompactFiat}
                          value={requiredTotalNetCollateralUSD}
                        />
                      </>
                    )}

                    {requiredTotalNetCollateralUSD > 0 &&
                      nextLevelRequiredTotalNetCollateralUSD && (
                        <$AndText>{stringGetter({ key: STRING_KEYS.AND })}</$AndText>
                      )}

                    {nextLevelRequiredTotalNetCollateralUSD && (
                      <>
                        <span>{`< `}</span>
                        <$HighlightOutput
                          type={OutputType.CompactFiat}
                          value={nextLevelRequiredTotalNetCollateralUSD}
                        />
                      </>
                    )}
                  </$NetCollateralValue>
                ),
              },
              {
                columnKey: 'maxOrders',
                label: stringGetter({ key: STRING_KEYS.LONG_TERM_OR_CONDITIONAL_ORDERS }),
                allowsSorting: false,
                renderCell: ({ maxOrders }) => (
                  <$HighlightOutput type={OutputType.Number} value={maxOrders} />
                ),
              },
            ] satisfies ColumnDef<EquityTier>[]
          }
          selectionBehavior="replace"
          paginationBehavior="showAll"
          withOuterBorder={isNotTablet}
          withInnerBorders
        />
      </$ContentWrapper>
    </AttachedExpandingSection>
  );
};
const $ContentWrapper = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1.5rem;
  max-width: 100vw;
`;

const $Table = styled(Table)`
  --tableCell-padding: 0.5rem 1.5rem;
  --bordered-content-border-radius: 0.625rem;
  --table-cell-align: end;

  font: var(--font-base-book);

  @media ${breakpoints.mobile} {
    --tableCell-padding: 1rem 1.25rem;
    font: var(--font-small-book);
  }

  @media ${breakpoints.notTablet} {
    --tableStickyRow-backgroundColor: var(--color-layer-1);
  }
` as typeof Table;

const $HighlightOutput = styled(Output)`
  color: var(--color-text-1);
`;

const $NetCollateralValue = styled.span`
  ${layoutMixins.inlineRow}
`;

const $AndText = styled.span`
  color: var(--color-text-0);
`;

const $Description = styled.div`
  color: var(--color-text-0);
  --link-color: var(--color-text-1);
  padding: 0 1rem;
  font: var(--font-small-book);

  @media ${breakpoints.tablet} {
    padding: 1.25rem 1.5rem 0;
  }

  span {
    ::after {
      content: ' ';
    }
  }

  a {
    display: inline-grid;
  }
`;
