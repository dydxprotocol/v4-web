import styled from 'styled-components';
import tw from 'twin.macro';
import { formatUnits } from 'viem';

import {
  DEFAULT_AFFILIATES_EARN_PER_MONTH_USD,
  DEFAULT_AFFILIATES_VIP_EARN_PER_MONTH_USD,
} from '@/constants/affiliates';
import { CriteriaDialogProps, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog, DialogPlacement } from '@/components/Dialog';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { AllTableProps, ColumnDef, Table } from '@/components/Table';
import { TableCell } from '@/components/Table/TableCell';
import { Tag } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

import { BorderStatCell, StatCell } from './StatBox';

interface ITierDefinition {
  tier: number | 'vip';
  requirements: { referredVol?: number; staked?: number };
  affiliateEarnRate: string;
}

const TIERS: ITierDefinition[] = [
  {
    tier: 0,
    requirements: { staked: 0, referredVol: 0 },
    affiliateEarnRate: '5.0%',
  },
  {
    tier: 1,
    requirements: { staked: 200, referredVol: 1000000 },
    affiliateEarnRate: '10.0%',
  },
  {
    tier: 2,
    requirements: { staked: 1000, referredVol: 5000000 },
    affiliateEarnRate: '12.5%',
  },
  {
    tier: 3,
    requirements: { staked: 5000, referredVol: 25000000 },
    affiliateEarnRate: '15.0%',
  },
  {
    tier: 'vip',
    requirements: { staked: undefined, referredVol: undefined },
    affiliateEarnRate: '50.0%',
  },
];

export const CriteriaDialog = ({
  setIsOpen,
  accountStats,
  stakedAmount,
  userTier,
}: DialogProps<CriteriaDialogProps>) => {
  const { dydxAddress } = useAccounts();
  const { affiliateProgram } = useURLConfigs();
  const { chainTokenLabel, chainTokenDecimals } = useTokenConfigs();

  const stringGetter = useStringGetter();

  const currentUserTierIdx = TIERS.findIndex((tier) => tier.tier === userTier);

  const currentUserTier = TIERS[currentUserTierIdx];

  return (
    <$Dialog
      isOpen
      setIsOpen={setIsOpen}
      placement={DialogPlacement.Default}
      title={
        !dydxAddress
          ? stringGetter({ key: STRING_KEYS.AFFILIATE_TIERS })
          : userTier === 'vip'
            ? stringGetter({
                key: STRING_KEYS.YOURE_A_VIP,
                params: {
                  VIP: (
                    <span tw="text-color-success">{stringGetter({ key: STRING_KEYS.VIP })}</span>
                  ),
                },
              })
            : stringGetter({
                key: STRING_KEYS.YOUR_TIER,
                params: {
                  TIER: currentUserTier?.tier,
                },
              })
      }
      hasHeaderBlur={false}
    >
      <$Container tw="flex flex-col gap-y-1">
        <div tw="flex flex-col gap-y-1 px-1 notTablet:p-0">
          <div tw="text-color-text-0">
            {userTier === 'vip'
              ? stringGetter({
                  key: STRING_KEYS.PROGRAM_CARD_BODY_VIP,
                  params: {
                    VIP: stringGetter({ key: STRING_KEYS.VIP_AFFILIATE }),
                  },
                })
              : stringGetter({
                  key: STRING_KEYS.CRITERIA_MODAL_VIP_DISCLAIMER,
                  params: {
                    VIP_VALUE: (
                      <span tw="text-color-text-1">
                        ${DEFAULT_AFFILIATES_VIP_EARN_PER_MONTH_USD.toLocaleString()}
                      </span>
                    ),
                    REGULAR_VALUE: (
                      <span tw="text-color-text-1">
                        ${DEFAULT_AFFILIATES_EARN_PER_MONTH_USD.toLocaleString()}
                      </span>
                    ),
                    APPLY_HERE: (
                      <Link isInline href={affiliateProgram}>
                        <span tw="text-color-accent">
                          {stringGetter({ key: STRING_KEYS.APPLY_HERE })}
                        </span>
                      </Link>
                    ),
                  },
                })}
          </div>

          {dydxAddress && (
            <div tw="my-1 flex">
              <BorderStatCell
                tw="pr-1"
                border={['right']}
                title={stringGetter({ key: STRING_KEYS.VOLUME_REFERRED })}
                outputType={OutputType.CompactFiat}
                value={accountStats?.affiliateReferredTotalVolume}
              />
              <StatCell tw="px-1" title={stringGetter({ key: STRING_KEYS.STAKED_BALANCE })}>
                <div tw="flex items-center">
                  <Output
                    type={OutputType.Asset}
                    value={
                      stakedAmount
                        ? formatUnits(stakedAmount, chainTokenDecimals).toString()
                        : undefined
                    }
                    fractionDigits={2}
                  />
                  <Tag tw="ml-0.25">{chainTokenLabel}</Tag>
                </div>
              </StatCell>
            </div>
          )}
        </div>

        <CriteriaTable tiers={TIERS} userTier={userTier} />
      </$Container>
    </$Dialog>
  );
};

const CriteriaTable = ({
  userTier,
  tiers,
}: {
  userTier?: number | 'vip';
  tiers: ITierDefinition[];
}) => {
  const stringGetter = useStringGetter();
  const { affiliateProgram } = useURLConfigs();
  const { chainTokenLabel } = useTokenConfigs();

  const columns: ColumnDef<ITierDefinition>[] = [
    {
      columnKey: 'tier',
      allowsSorting: false,
      label: stringGetter({ key: STRING_KEYS.TIER }),
      renderCell: ({ tier }) => (
        <$TableCell stacked>
          <div tw="flex items-center">
            {tier.toString().toLowerCase() === 'vip' ? (
              <span tw="text-color-success">{tier.toString().toUpperCase()}</span>
            ) : (
              tier.toString().toUpperCase()
            )}
          </div>
        </$TableCell>
      ),
    },
    {
      columnKey: 'requirements',
      label: stringGetter({ key: STRING_KEYS.REQUIREMENTS }),
      allowsSorting: false,

      renderCell: ({ tier, requirements }) =>
        tier === 'vip' && userTier !== 'vip' ? (
          <$TableCell>
            <Tag tw="bg-color-layer-5 p-0.5 text-small text-color-text-1">
              <div tw="flex flex-col gap-x-0.25 notTablet:flex-row">
                {stringGetter({
                  key: STRING_KEYS.BY_APPLICATION_ONLY,
                })}
                <div tw="flex flex-row">
                  <Link href={affiliateProgram}>
                    <span tw="capitalize text-color-accent">
                      {stringGetter({ key: STRING_KEYS.APPLY_HERE })}
                    </span>
                  </Link>
                  !
                </div>
              </div>
            </Tag>
          </$TableCell>
        ) : tier === 'vip' && userTier === 'vip' ? (
          <$TableCell tw="text-color-text-2">
            {stringGetter({
              key: STRING_KEYS.YOURE_A_VIP,
              params: {
                VIP: <>{stringGetter({ key: STRING_KEYS.VIP })}!</>,
              },
            })}
          </$TableCell>
        ) : !requirements.referredVol && !requirements.staked ? (
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
              <div tw="text-color-text-0">
                {stringGetter({ key: STRING_KEYS.OR }).toUpperCase()}
              </div>
              <div>
                <div tw="flex flex-row gap-x-0.5 notTablet:flex-col">
                  <div tw="flex items-center text-color-text-1">
                    <Output type={OutputType.CompactFiat} value={requirements.staked} />+
                  </div>
                  <div tw="flex items-center">
                    <p tw="text-small text-color-text-0">
                      {stringGetter({ key: STRING_KEYS.STAKED })}
                    </p>
                    <Tag tw="ml-0.25 w-fit">{chainTokenLabel}</Tag>
                  </div>
                </div>
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
          {tier === 'vip' ? (
            <span tw="text-color-success">{affiliateEarnRate}</span>
          ) : (
            affiliateEarnRate
          )}
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
      affiliateTierIdx={userTier === 'vip' ? 4 : userTier}
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
