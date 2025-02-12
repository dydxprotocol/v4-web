import { BonsaiCore } from '@/bonsai/ontology';
import { EquityTierSummary } from '@/bonsai/types/summaryTypes';
import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import breakpoints from '@/styles/breakpoints';

import { AttachedExpandingSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { ColumnDef, Table } from '@/components/Table';

import { useAppSelector } from '@/state/appTypes';

export const EquityTiers = () => {
  const stringGetter = useStringGetter();
  const equityTiers = useAppSelector(BonsaiCore.configs.equityTiers)?.statefulOrderEquityTiers;
  const { isNotTablet } = useBreakpoints();
  const { equityTiersLearnMore } = useURLConfigs();

  return (
    <AttachedExpandingSection>
      {isNotTablet && (
        <ContentSectionHeader title={stringGetter({ key: STRING_KEYS.EQUITY_TIERS })} />
      )}
      <div tw="flexColumn max-w-[100vw] gap-1.5">
        <$Description>
          <span>
            {stringGetter({
              key: STRING_KEYS.EQUITY_TIERS_DESCRIPTION_LONG,
            })}
          </span>{' '}
          {equityTiersLearnMore && (
            <Link href={equityTiersLearnMore}>
              {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
            </Link>
          )}
        </$Description>
        <$Table
          label={stringGetter({ key: STRING_KEYS.EQUITY_TIERS })}
          data={equityTiers ?? []}
          tableId="equity-tiers"
          getRowKey={(row: EquityTierSummary) => row.requiredTotalNetCollateralUSD}
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
                  <span tw="inlineRow">
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
                        <span tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.AND })}</span>
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
                  </span>
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
            ] satisfies ColumnDef<EquityTierSummary>[]
          }
          selectionBehavior="replace"
          paginationBehavior="showAll"
          withOuterBorder
          withInnerBorders
        />
      </div>
    </AttachedExpandingSection>
  );
};

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
    --tableStickyRow-backgroundColor: var(--color-layer-2);
  }
` as typeof Table;

const $HighlightOutput = tw(Output)`text-color-text-1`;

const $Description = styled.div`
  color: var(--color-text-0);
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
