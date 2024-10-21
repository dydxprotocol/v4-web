import styled from 'styled-components';
import tw from 'twin.macro';

import {
  DEFAULT_AFFILIATES_EARN_PER_MONTH_USD,
  DEFAULT_AFFILIATES_VIP_EARN_PER_MONTH_USD,
} from '@/constants/affiliates';
import { CriteriaModalProps, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';
import { useWalletConnection } from '@/hooks/useWalletConnection';

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
  requirements: { referredVol: number; staked: number };
  affiliateEarnRate: string;
}

export const CriteriaModal = ({
  setIsOpen,
  accountStats,
  // toggleCriteria,
  stakedAmount,
  userTier,
}: DialogProps<CriteriaModalProps>) => {
  const { isConnectedWagmi } = useWalletConnection();
  const { affiliateProgram } = useURLConfigs();

  const stringGetter = useStringGetter();
  const stakedDYdX = stakedAmount ?? '0';

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
    {
      tier: 'vip',
      requirements: {} as { referredVol: number; staked: number },
      affiliateEarnRate: '50.0%',
    },
  ];

  const currentUserTierIdx = tiers.findIndex((tier) => tier.tier === userTier);

  const currentUserTier = tiers[currentUserTierIdx];

  return (
    <$Dialog
      isOpen
      {...{ setIsOpen }}
      placement={DialogPlacement.Default}
      title={
        !isConnectedWagmi
          ? stringGetter({ key: STRING_KEYS.AFFILIATE_TIERS })
          : userTier === 'vip'
            ? stringGetter({
                key: STRING_KEYS.YOURE_A_VIP,
                params: {
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
            {userTier === 'vip'
              ? stringGetter({
                  key: STRING_KEYS.PROGRAM_CARD_BODY_VIP,
                  params: {
                    VIP: stringGetter({ key: STRING_KEYS.VIP }),
                  },
                })
              : stringGetter({
                  key: STRING_KEYS.CRITERIA_MODAL_VIP_DISCLAIMER,
                  params: {
                    VIP_VALUE: (
                      <span className="text-color-text-1">
                        ${DEFAULT_AFFILIATES_VIP_EARN_PER_MONTH_USD.toLocaleString()}
                      </span>
                    ),
                    REGULAR_VALUE: (
                      <span className="text-color-text-1">
                        ${DEFAULT_AFFILIATES_EARN_PER_MONTH_USD.toLocaleString()}
                      </span>
                    ),
                    APPLY_HERE: (
                      <Link isInline href={affiliateProgram}>
                        <span className="text-color-accent">
                          {stringGetter({ key: STRING_KEYS.APPLY_HERE })}
                        </span>
                      </Link>
                    ),
                  },
                })}
          </div>

          {userTier === 'vip' && (
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
                  <Tag className="ml-0.25">DYDX</Tag>
                </div>
              </StatCell>
            </div>
          )}
        </div>

        <CriteriaTable tiers={tiers} userTier={userTier} />
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

  const columns: ColumnDef<ITierDefinition>[] = [
    {
      columnKey: 'tier',
      allowsSorting: false,
      label: stringGetter({ key: STRING_KEYS.TIER }),
      renderCell: ({ tier }) => (
        <$TableCell stacked>
          <div className="flex items-center">
            {tier.toString().toLowerCase() === 'vip' ? (
              <span className="text-color-success">{tier.toString().toUpperCase()}</span>
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
            <Tag className="bg-color-layer-5 p-0.5 text-small text-color-text-1">
              <div className="flex flex-col gap-x-0.25 notTablet:flex-row">
                {stringGetter({
                  key: STRING_KEYS.BY_APPLICATION_ONLY,
                })}
                <div className="flex flex-row">
                  <Link href={affiliateProgram}>
                    <span className="capitalize text-color-accent">
                      {stringGetter({ key: STRING_KEYS.APPLY_HERE })}
                    </span>
                  </Link>
                  !
                </div>
              </div>
            </Tag>
          </$TableCell>
        ) : tier === 'vip' && userTier === 'vip' ? (
          <$TableCell className="text-color-text-2">
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
            <div className="flex flex-col gap-y-0.5 notTablet:flex-row notTablet:items-center notTablet:gap-x-1">
              <div className="flex flex-row gap-x-0.5 notTablet:flex-col">
                <div className="flex items-center text-color-text-1">
                  <Output type={OutputType.CompactFiat} value={requirements.referredVol} />+
                </div>
                <p className="text-sm text-break text-color-text-0">
                  {stringGetter({ key: STRING_KEYS.VOLUME_REFERRED })}
                </p>
              </div>
              <div className="text-color-text-0">
                {stringGetter({ key: STRING_KEYS.OR }).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-row gap-x-0.5 notTablet:flex-col">
                  <div className="flex items-center text-color-text-1">
                    <Output type={OutputType.CompactFiat} value={requirements.staked} />+
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm text-color-text-0">
                      {stringGetter({ key: STRING_KEYS.STAKED })}
                    </p>
                    <Tag className="ml-0.25 w-fit">DYDX</Tag>
                  </div>
                </div>
              </div>
            </div>
          </$TableCell>
        ),
    },

    {
      columnKey: 'affiliate-earn-rate',
      allowsSorting: true,
      getCellValue: (row: ITierDefinition) => row.affiliateEarnRate,
      label: (
        <WithTooltip tooltip="affiliate-commissions" side="right">
          {/* {stringGetter({ key: STRING_KEYS.AFFILIATE_COMISSIONS })} */}
          Comissions
        </WithTooltip>
      ),
      renderCell: ({ tier, affiliateEarnRate }) => (
        <$TableCell className="align-center w-full justify-between">
          {tier === 'vip' ? (
            <span className="text-color-success">{affiliateEarnRate}</span>
          ) : (
            affiliateEarnRate
          )}
          {userTier?.toString().toLowerCase() === tier.toString().toLowerCase() && (
            <Tag className="bg-color-accent">
              <span className="text-color-text-2">{stringGetter({ key: STRING_KEYS.YOU })}</span>
            </Tag>
          )}
        </$TableCell>
      ),
    },
  ];

  return (
    <$Table
      affiliateTierIdx={userTier === 'vip' ? 4 : userTier ?? 0}
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

const $Table = styled(Table)<AllTableProps<ITierDefinition> & { affiliateTierIdx: number }>`
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
  tr:nth-child(${affiliateTierIdx + 1}) {
    background-color: var(--color-layer-5);
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
