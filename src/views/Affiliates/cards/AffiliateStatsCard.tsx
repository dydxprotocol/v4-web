import { useRef } from 'react';

import styled from 'styled-components';

import { IAffiliateStats } from '@/constants/affiliates';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Link } from '@/components/Link';
import { OutputType } from '@/components/Output';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { BorderStatCell, StatCell } from '../StatBox';

const MobileView = ({
  accountStats,
  toggleCriteria,
  isVip = false,
  currentAffiliateTier = 0,
}: {
  accountStats?: IAffiliateStats;
  toggleCriteria: () => void;
  isVip: boolean;
  currentAffiliateTier?: number;
}) => {
  const stringGetter = useStringGetter();

  return (
    <div tw="flex flex-wrap items-center justify-between">
      <MobileStatsHeader tw="flex w-full gap-1 divide-y p-1">
        <StatCell
          valueSize="large"
          tw="relative flex-1"
          title={stringGetter({ key: STRING_KEYS.AFFILIATE_TIER })}
          outputType={OutputType.Text}
          value={isVip ? stringGetter({ key: STRING_KEYS.VIP_AFFILIATE }) : currentAffiliateTier}
        >
          <Link
            isInline
            href="#"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCriteria();
            }}
          >
            <p tw="text-base text-color-accent">
              {stringGetter({ key: STRING_KEYS.AFFILIATE_TIERS_CRITERIA })}
            </p>
          </Link>
        </StatCell>
        <StatCell
          valueSize="large"
          title={stringGetter({ key: STRING_KEYS.AFFILIATE_EARNINGS })}
          outputType={OutputType.CompactFiat}
          value={accountStats?.affiliateEarnings}
          tw="flex-1"
        />
      </MobileStatsHeader>
      <div tw="flex w-full flex-wrap justify-between">
        <BorderStatCell
          border={['bottom', 'right']}
          tw="w-6/12 p-1"
          title={stringGetter({ key: STRING_KEYS.VOLUME_REFERRED })}
          outputType={OutputType.CompactFiat}
          value={accountStats?.affiliateReferredTotalVolume}
        />
        <BorderStatCell
          border={['bottom']}
          tw="w-6/12 p-1"
          title={stringGetter({ key: STRING_KEYS.FEES_REFERRED })}
          outputType={OutputType.CompactFiat}
          value={accountStats?.affiliateTotalReferredFees}
        />
        <BorderStatCell
          border={['right']}
          tw="w-6/12 p-1"
          title={stringGetter({ key: STRING_KEYS.USERS_REFERRED })}
          outputType={OutputType.Number}
          value={accountStats?.affiliateReferredUsers}
        />
        <StatCell
          tw="w-6/12 p-1"
          title={stringGetter({ key: STRING_KEYS.TRADES_REFERRED })}
          outputType={OutputType.Number}
          value={accountStats?.affiliateReferredTrades}
        />
      </div>
    </div>
  );
};

const DesktopView = ({
  accountStats,
  toggleCriteria,
  isVip = false,
  currentAffiliateTier = 0,
}: {
  accountStats?: IAffiliateStats;
  toggleCriteria: () => void;
  isVip: boolean;
  currentAffiliateTier?: number;
}) => {
  const stringGetter = useStringGetter();
  const linkRef = useRef<HTMLAnchorElement>(null); // Reference to the button element

  return (
    <div tw="flex flex-col gap-y-1 p-1">
      <div tw="flex gap-x-8">
        <StatCell
          valueSize="large"
          tw="relative inline-block"
          title={stringGetter({ key: STRING_KEYS.AFFILIATE_TIER })}
          outputType={OutputType.Text}
          value={isVip ? stringGetter({ key: STRING_KEYS.VIP_AFFILIATE }) : currentAffiliateTier}
        >
          <Link
            isInline
            href="#"
            ref={linkRef}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCriteria();
            }}
          >
            <p tw="text-base text-color-accent">
              {stringGetter({ key: STRING_KEYS.AFFILIATE_TIERS_CRITERIA })}
            </p>
          </Link>
        </StatCell>
        <StatCell
          valueSize="large"
          title={stringGetter({ key: STRING_KEYS.AFFILIATE_EARNINGS })}
          outputType={OutputType.CompactFiat}
          value={accountStats?.affiliateEarnings}
        />
      </div>
      <div tw="flex">
        <BorderStatCell
          border={['right']}
          tw="pr-1"
          title={stringGetter({ key: STRING_KEYS.VOLUME_REFERRED })}
          outputType={OutputType.CompactFiat}
          value={accountStats?.affiliateReferredTotalVolume}
        />
        <BorderStatCell
          border={['right']}
          tw="px-1"
          title={stringGetter({ key: STRING_KEYS.FEES_REFERRED })}
          outputType={OutputType.CompactFiat}
          value={accountStats?.affiliateTotalReferredFees}
        />
        <BorderStatCell
          border={['right']}
          tw="px-1"
          title={stringGetter({ key: STRING_KEYS.USERS_REFERRED })}
          outputType={OutputType.Number}
          value={accountStats?.affiliateReferredUsers}
        />
        <StatCell
          tw="px-1"
          title={stringGetter({ key: STRING_KEYS.TRADES_REFERRED })}
          outputType={OutputType.Number}
          value={accountStats?.affiliateReferredTrades}
        />
      </div>
    </div>
  );
};

interface IAffiliateStatsProps {
  accountStats?: IAffiliateStats;
  isVip: boolean;
  currentAffiliateTier?: number;
  stakedDydx?: bigint;
}

export const AffiliateStatsCard = ({
  accountStats,
  isVip,
  stakedDydx,
  currentAffiliateTier,
}: IAffiliateStatsProps) => {
  const { isNotTablet } = useBreakpoints();
  const dispatch = useAppDispatch();

  const toggleCriteria = () => {
    dispatch(
      openDialog(
        DialogTypes.Criteria({
          userTier: isVip ? 'vip' : currentAffiliateTier,
          accountStats,
          stakedAmount: stakedDydx,
        })
      )
    );
  };

  return (
    <div tw="flex-1 rounded-0.625 bg-color-layer-3">
      {isNotTablet ? (
        <DesktopView
          accountStats={accountStats}
          currentAffiliateTier={currentAffiliateTier}
          isVip={isVip}
          toggleCriteria={toggleCriteria}
        />
      ) : (
        <MobileView
          accountStats={accountStats}
          currentAffiliateTier={currentAffiliateTier}
          isVip={isVip}
          toggleCriteria={toggleCriteria}
        />
      )}
    </div>
  );
};

const MobileStatsHeader = styled.div`
  border-bottom: 1px solid var(--color-border);
`;
