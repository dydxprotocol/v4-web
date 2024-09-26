import { useRef, useState } from 'react';

import styled from 'styled-components';
import tw from 'twin.macro';

import { IAffiliateStats } from '@/constants/affiliates';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { OutputType } from '@/components/Output';

import { CriteriaModal } from '../CriteriaModal';
import { BorderStatCell, StatCell } from '../StatBox';

const MobileView = ({
  accountStats,
  toggleCriteria,
}: {
  accountStats?: IAffiliateStats;
  toggleCriteria: () => void;
}) => {
  const stringGetter = useStringGetter();

  return (
    <div className="flex flex-wrap items-center justify-between">
      <MobileStatsHeader className="flex w-full justify-between gap-1 divide-y p-1">
        <StatCell
          valueSize="large"
          className="relative"
          title={stringGetter({ key: STRING_KEYS.AFFILIATE_TIER })}
          outputType={OutputType.Number}
          value={accountStats?.currentAffiliateTier}
        >
          <a href="#" onClick={toggleCriteria}>
            <p className="text-base text-color-accent">
              {stringGetter({ key: STRING_KEYS.AFFILIATE_TIERS_CRITERIA })}
            </p>
          </a>
        </StatCell>
        <StatCell
          valueSize="large"
          title={stringGetter({ key: STRING_KEYS.AFFILIATE_EARNINGS })}
          outputType={OutputType.CompactFiat}
          value={accountStats?.totalEarnings}
        >
          {/*
          TODO: Define wether this goes or not
          <p className="flex">
            +<p className="text-color-success"> 250k </p> BOOST
          </p> */}
        </StatCell>
        <StatCell
          valueSize="large"
          title={stringGetter({ key: STRING_KEYS.ALL_TIME_RANK })}
          outputType={OutputType.Number}
          value={accountStats?.rank}
        />
      </MobileStatsHeader>
      <div className="flex w-full flex-wrap justify-between">
        <BorderStatCell
          border={['bottom', 'right']}
          className="w-6/12 p-1"
          title={stringGetter({ key: STRING_KEYS.VOLUME_REFERRED })}
          outputType={OutputType.CompactFiat}
          value={accountStats?.referredVolume}
        />
        <BorderStatCell
          border={['bottom']}
          className="w-6/12 p-1"
          title={stringGetter({ key: STRING_KEYS.FEES_REFERRED })}
          outputType={OutputType.CompactFiat}
          value={accountStats?.referredFees}
        />
        <BorderStatCell
          border={['right']}
          className="w-6/12 p-1"
          title={stringGetter({ key: STRING_KEYS.USERS_REFERRED })}
          outputType={OutputType.Number}
          value={accountStats?.totalReferredUsers}
        />
        <StatCell
          className="w-6/12 p-1"
          title={stringGetter({ key: STRING_KEYS.TRADES_REFERRED })}
          outputType={OutputType.Number}
          value={accountStats?.totalReferredTrades}
        />
      </div>
    </div>
  );
};

const DesktopView = ({
  accountStats,
  toggleCriteria,
}: {
  accountStats?: IAffiliateStats;
  toggleCriteria: () => void;
}) => {
  const stringGetter = useStringGetter();
  const linkRef = useRef<HTMLAnchorElement>(null); // Reference to the button element

  return (
    <div className="flex flex-col gap-y-1 p-1">
      <div className="flex gap-x-8">
        <StatCell
          valueSize="large"
          className="relative inline-block"
          title={stringGetter({ key: STRING_KEYS.AFFILIATE_TIER })}
          outputType={OutputType.Number}
          value={accountStats?.currentAffiliateTier}
        >
          <a href="#" ref={linkRef} onClick={toggleCriteria}>
            <p className="text-base text-color-accent">
              {stringGetter({ key: STRING_KEYS.AFFILIATE_TIERS_CRITERIA })}
            </p>
          </a>
        </StatCell>
        <StatCell
          valueSize="large"
          title={stringGetter({ key: STRING_KEYS.AFFILIATE_EARNINGS })}
          outputType={OutputType.CompactFiat}
          value={accountStats?.totalEarnings}
        />
        <StatCell
          valueSize="large"
          title={stringGetter({ key: STRING_KEYS.ALL_TIME_RANK })}
          outputType={OutputType.Number}
          value={accountStats?.rank}
        />
      </div>
      <div className="flex">
        <BorderStatCell
          border={['right']}
          className="pr-1"
          title={stringGetter({ key: STRING_KEYS.VOLUME_REFERRED })}
          outputType={OutputType.CompactFiat}
          value={accountStats?.referredVolume}
        />
        <BorderStatCell
          border={['right']}
          className="px-1"
          title={stringGetter({ key: STRING_KEYS.FEES_REFERRED })}
          outputType={OutputType.CompactFiat}
          value={accountStats?.referredFees}
        />
        <BorderStatCell
          border={['right']}
          className="px-1"
          title={stringGetter({ key: STRING_KEYS.USERS_REFERRED })}
          outputType={OutputType.Number}
          value={accountStats?.totalReferredUsers}
        />

        <StatCell
          className="px-1"
          title={stringGetter({ key: STRING_KEYS.TRADES_REFERRED })}
          outputType={OutputType.Number}
          value={accountStats?.totalReferredTrades}
        />
      </div>
    </div>
  );
};

interface IAffiliateStatsProps {
  className?: string;
  accountStats?: IAffiliateStats;
  isVip: boolean;
}

export const AffiliateStatsCard = ({ className, accountStats, isVip }: IAffiliateStatsProps) => {
  const [isCriteriaVisible, setIsCriteriaVisible] = useState(false);
  const { isNotTablet } = useBreakpoints();

  const toggleCriteria = () => {
    setIsCriteriaVisible(!isCriteriaVisible);
  };

  return (
    <$Container className={className}>
      {isNotTablet ? (
        <DesktopView accountStats={accountStats} toggleCriteria={toggleCriteria} />
      ) : (
        <MobileView accountStats={accountStats} toggleCriteria={toggleCriteria} />
      )}

      {isCriteriaVisible && (
        <CriteriaModal
          isVip={isVip}
          accountStats={accountStats}
          isCriteriaVisible={isCriteriaVisible}
          toggleCriteria={toggleCriteria}
        />
      )}
    </$Container>
  );
};

const MobileStatsHeader = styled.div`
  border-bottom: 1px solid var(--color-border);
`;

const $Container = tw.div`rounded-0.625 bg-color-layer-3`;
