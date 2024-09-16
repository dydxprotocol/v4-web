import { useMemo } from 'react';

import styled from 'styled-components';
import tw from 'twin.macro';

import { IAffiliateStats } from '@/constants/affiliates';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useWalletConnection } from '@/hooks/useWalletConnection';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog, DialogPlacement } from '@/components/Dialog';
import { OutputType } from '@/components/Output';
import { AllTableProps, ColumnDef, Table } from '@/components/Table';
import { TableCell } from '@/components/Table/TableCell';
import { Tag } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

import { BorderStatCell, StatCell } from './StatBox';

interface ITierDefinition {
  tier: number;
  requirements: { referredVol: number; staked: number };
  affiliateEarnRate: string;
}

export const CriteriaModal = ({
  isCriteriaVisible,
  accountStats,
  toggleCriteria,
  isVip,
}: {
  isCriteriaVisible: boolean;
  toggleCriteria: () => void;
  accountStats?: IAffiliateStats;
  isVip: boolean;
}) => {
  const { isConnectedWagmi } = useWalletConnection();

  const stringGetter = useStringGetter();
  const stakedDYdX = accountStats?.account ? 500 : 0;

  const tiers: ITierDefinition[] = [
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
  ];

  const currentUserTierIdx = accountStats
    ? tiers.findIndex((tier) => tier.tier === accountStats?.currentAffiliateTier)
    : 0;

  const currentUserTier = tiers[currentUserTierIdx];

  return (
    <$Dialog
      isOpen={isCriteriaVisible}
      setIsOpen={toggleCriteria}
      placement={DialogPlacement.Default}
      title={
        !isConnectedWagmi
          ? stringGetter({ key: STRING_KEYS.AFFILIATE_TIERS })
          : isVip
            ? stringGetter({
                key: STRING_KEYS.YOUR_TIER_VIP,
                params: {
                  TIER: currentUserTier.tier,
                  VIP: (
                    <span className="text-color-success">
                      {stringGetter({ key: STRING_KEYS.VIP })}
                    </span>
                  ),
                },
              })
            : stringGetter({
                key: STRING_KEYS.YOUR_TIER,
                params: {
                  TIER: currentUserTier.tier,
                },
              })
      }
      hasHeaderBlur={false}
    >
      <$Container className="flex flex-col gap-y-1">
        <div className="flex flex-col gap-y-1 px-1 notTablet:p-0">
          <div className="text-color-text-0">
            {!isVip
              ? stringGetter({
                  key: STRING_KEYS.CRITERIA_MODAL_VIP_DISCLAIMER,
                  params: {
                    VIP_VALUE: <span className="text-color-text-1">{'{VIP Value}'}</span>,
                    APPLY_HERE: (
                      <a href="#">
                        <span className="text-color-accent">
                          {stringGetter({ key: STRING_KEYS.APPLY_HERE })}
                        </span>
                      </a>
                    ),
                  },
                })
              : stringGetter({
                  key: STRING_KEYS.PROGRAM_CARD_BODY_VIP,
                  params: {
                    VIP: stringGetter({ key: STRING_KEYS.VIP }),
                  },
                })}
          </div>

          <div className="flex">
            <BorderStatCell
              className="pr-1"
              border={['right']}
              title={stringGetter({ key: STRING_KEYS.VOLUME_REFERRED })}
              outputType={OutputType.CompactFiat}
              value={accountStats?.referredVolume}
            />
            <StatCell className="px-1" title={stringGetter({ key: STRING_KEYS.STAKED_BALANCE })}>
              <div className="flex items-center">
                {isConnectedWagmi ? stakedDYdX?.toLocaleString() : '-'}
                <Tag className="ml-0.5">{stringGetter({ key: STRING_KEYS.DYDX })}</Tag>
              </div>
            </StatCell>
          </div>
        </div>

        <CriteriaTable tiers={tiers} userTier={accountStats?.currentAffiliateTier} />
      </$Container>
    </$Dialog>
  );
};

const CriteriaTable = ({ userTier, tiers }: { userTier?: number; tiers: ITierDefinition[] }) => {
  const stringGetter = useStringGetter();

  const columns = useMemo<ColumnDef<ITierDefinition>[]>(
    () => [
      {
        columnKey: 'tier',
        allowsSorting: false,
        getCellValue: (row: ITierDefinition) => row.tier,
        label: stringGetter({ key: STRING_KEYS.TIER }),
        renderCell: ({ tier }) => (
          <$TableCell stacked>
            <div className="flex items-center">
              {tier}
              {userTier && Number(userTier) === Number(tier) && (
                <Tag className="ml-0.5 bg-color-accent">
                  {stringGetter({ key: STRING_KEYS.YOU })}
                </Tag>
              )}
            </div>
          </$TableCell>
        ),
      },
      {
        columnKey: 'requirements',
        getCellValue: (row: ITierDefinition) =>
          row.requirements?.referredVol ?? row.requirements?.staked ?? 0,
        label: stringGetter({ key: STRING_KEYS.REQUIREMENTS }),
        allowsSorting: false,

        renderCell: ({ requirements }) =>
          !requirements?.referredVol && !requirements?.staked ? (
            <$TableCell stacked>{stringGetter({ key: STRING_KEYS.NONE })}</$TableCell>
          ) : (
            <$TableCell stacked>
              <div className="flex flex-col notTablet:flex-row notTablet:items-center">
                <p className="text-color-text-2 notTablet:mr-0.5">
                  ${requirements.referredVol?.toLocaleString()}+
                </p>
                <p className="text-sm text-color-text-0">
                  {stringGetter({ key: STRING_KEYS.VOLUME_REFERRED })}
                </p>
              </div>
              <p className="text-sm text-color-text-0">or</p>
              <div className="flex flex-col notTablet:flex-row notTablet:items-center">
                <p className="text-color-text-2 notTablet:mr-0.5">
                  {requirements.staked?.toLocaleString()}+
                </p>
                <p className="text-sm text-color-text-0">
                  {stringGetter({ key: STRING_KEYS.STAKED })}
                </p>
                <Tag className="w-fit notTablet:ml-0.5">
                  {stringGetter({ key: STRING_KEYS.DYDX })}
                </Tag>
              </div>
            </$TableCell>
          ),
      },

      {
        columnKey: 'affiliate-earn-rate',
        getCellValue: (row: ITierDefinition) => row.affiliateEarnRate,
        label: (
          <WithTooltip tooltip="affiliate-commissions" side="right">
            {stringGetter({ key: STRING_KEYS.AFFILIATE_COMISSIONS })}
          </WithTooltip>
        ),
        renderCell: ({ affiliateEarnRate }) => (
          <$TableCell className="mr-1" stacked>
            {affiliateEarnRate}
          </$TableCell>
        ),
      },
    ],
    []
  );

  return (
    <$Table
      withInnerBorders
      withOuterBorder
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

const $Table = styled(Table)<AllTableProps<any>>`
  th {
    background-color: var(--color-layer-3);
  }

  tr {
    background-color: var(--color-layer-3);
  }

  @media ${breakpoints.notTablet} {
    th {
      background-color: var(--color-layer-2);
    }
  }
`;

const $Container = styled.div`
  ${layoutMixins.contentContainer}
`;
