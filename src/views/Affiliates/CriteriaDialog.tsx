import styled from 'styled-components';
import tw from 'twin.macro';

import { CriteriaDialogProps, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Details } from '@/components/Details';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { Output, OutputType } from '@/components/Output';
import { AllTableProps, ColumnDef, Table } from '@/components/Table';
import { TableCell } from '@/components/Table/TableCell';
import { Tag } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

interface ITierDefinition {
  tier: number;
  requirements: { referredVol?: number };
  affiliateEarnRate: string;
}

const TIERS: ITierDefinition[] = [
  {
    tier: 0,
    requirements: { referredVol: 0 },
    affiliateEarnRate: '30.0%',
  },
  {
    tier: 1,
    requirements: { referredVol: 1_000_000 },
    affiliateEarnRate: '40.0%',
  },
  {
    tier: 2,
    requirements: { referredVol: 10_000_000 },
    affiliateEarnRate: '50.0%',
  },
];

export const CriteriaDialog = ({
  setIsOpen,
  accountStats,
  userTier,
}: DialogProps<CriteriaDialogProps>) => {
  const { dydxAddress } = useAccounts();
  const stringGetter = useStringGetter();
  const currentUserTierIdx = TIERS.findIndex((tier) => tier.tier === userTier);
  const currentUserTier = TIERS[currentUserTierIdx];

  return (
    <$Dialog
      isOpen
      setIsOpen={setIsOpen}
      placement={DialogPlacement.Default}
      title={<span>{stringGetter({ key: STRING_KEYS.AFFILIATE_TIERS })}</span>}
      hasHeaderBlur={false}
    >
      <$Container tw="flex flex-col gap-y-1">
        <$Details
          layout="rowColumns"
          withSeparators
          items={[
            {
              key: 'tier',
              label: stringGetter({ key: STRING_KEYS.AFFILIATE_TIER }),
              value: (
                <span>
                  {dydxAddress
                    ? currentUserTier?.tier.toString().toUpperCase()
                    : stringGetter({ key: STRING_KEYS.NONE })}
                </span>
              ),
            },
            {
              key: 'volume-referred',
              label: stringGetter({ key: STRING_KEYS.VOLUME_REFERRED }),
              value: (
                <Output
                  type={OutputType.CompactFiat}
                  value={accountStats?.affiliateReferredTotalVolume}
                />
              ),
            },
          ]}
        />

        <CriteriaTable tiers={TIERS} userTier={userTier} />
      </$Container>
    </$Dialog>
  );
};

const CriteriaTable = ({ userTier, tiers }: { userTier?: number; tiers: ITierDefinition[] }) => {
  const stringGetter = useStringGetter();

  const columns: ColumnDef<ITierDefinition>[] = [
    {
      columnKey: 'tier',
      allowsSorting: false,
      label: stringGetter({ key: STRING_KEYS.TIER }),
      renderCell: ({ tier }) => (
        <$TableCell stacked>
          <div tw="flex items-center">{tier.toString().toUpperCase()}</div>
        </$TableCell>
      ),
    },
    {
      columnKey: 'requirements',
      label: stringGetter({ key: STRING_KEYS.REQUIREMENTS }),
      allowsSorting: false,

      renderCell: ({ requirements }) =>
        !requirements.referredVol ? (
          <$TableCell stacked>{stringGetter({ key: STRING_KEYS.NONE })}</$TableCell>
        ) : (
          <$TableCell stacked>
            <div tw="flex flex-col gap-y-0.5 notTablet:flex-row notTablet:items-center notTablet:gap-x-1">
              <div tw="flex flex-row gap-x-0.5 notTablet:flex-col">
                <div tw="flex items-center text-color-text-1">
                  <Output type={OutputType.CompactFiat} value={requirements.referredVol} />+
                </div>
                <p tw="text-small text-color-text-0">
                  {stringGetter({ key: STRING_KEYS.VOLUME_REFERRED })}
                </p>
              </div>
            </div>
          </$TableCell>
        ),
    },
    {
      columnKey: 'affiliate-earn-rate',
      allowsSorting: false,
      label: (
        <WithTooltip tooltip="affiliate-commissions" side="right">
          {stringGetter({ key: STRING_KEYS.COMMISSIONS })}
        </WithTooltip>
      ),
      renderCell: ({ tier, affiliateEarnRate }) => (
        <$TableCell tw="w-full items-center justify-between">
          {affiliateEarnRate}
          {userTier?.toString().toLowerCase() === tier.toString().toLowerCase() && (
            <Tag tw="bg-color-accent">
              <span tw="text-color-text-2">{stringGetter({ key: STRING_KEYS.YOU })}</span>
            </Tag>
          )}
        </$TableCell>
      ),
    },
  ];

  return (
    <$Table
      affiliateTierIdx={userTier}
      withInnerBorders
      withOuterBorder
      tableId="criteria"
      getRowKey={(row) => row.tier}
      columns={columns}
      data={tiers}
    />
  );
};

const $Dialog = styled(Dialog)`
  width: 100%;
  max-width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;

  --dialog-paddingX: 0rem;
  --dialog-header-paddingLeft: 1.5rem;
  --dialog-header-paddingRight: 1.5rem;
  --dialog-header-background: var(--color-layer-3);

  @media ${breakpoints.notTablet} {
    margin: auto;
    max-width: 560px;
    --dialog-paddingX: 1.5rem;
  }
`;

const $Details = styled(Details)`
  > :first-child {
    padding-left: 0.5rem;
  }

  --details-value-font: var(--font-base-bold);

  dt {
    font: var(--font-small-book);
  }
`;

const $TableCell = tw(TableCell)`py-0.5`;

const $Table = styled(Table)<AllTableProps<ITierDefinition> & { affiliateTierIdx?: number }>`
  th {
    background-color: var(--color-layer-3);
  }

  th:last-child {
    text-align: left;
  }

  tr {
    background-color: var(--color-layer-3);
  }

  ${({ affiliateTierIdx }) => `
  ${
    affiliateTierIdx !== undefined &&
    `tr:nth-child(${affiliateTierIdx + 1}) {
    background-color: var(--color-layer-5);
}`
  }
`}

  @media ${breakpoints.notTablet} {
    th {
      background-color: var(--color-layer-2);
    }
  }
`;

const $Container = styled.div`
  ${layoutMixins.contentContainer}
`;
