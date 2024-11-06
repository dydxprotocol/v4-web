import styled from 'styled-components';
import tw from 'twin.macro';

import { IProgramStats } from '@/constants/affiliates';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { OutputType } from '@/components/Output';

import { BorderStatCell, StatCell } from '../StatBox';

interface IProgramStatsProps {
  className?: string;
  programStats: IProgramStats;
}

const MobileView = ({ programStats }: { programStats: IProgramStats }) => {
  const stringGetter = useStringGetter();

  return (
    <div className="flex flex-wrap items-center justify-between">
      <MobileStatsHeader className="flex w-full justify-between gap-1 divide-y p-1">
        <StatCell
          valueSize="large"
          className="relative"
          title={stringGetter({ key: STRING_KEYS.AFFILIATE_EARNINGS })}
          outputType={OutputType.CompactFiat}
          value={programStats?.totalEarnings}
        />

        <StatCell
          valueSize="large"
          title={stringGetter({ key: STRING_KEYS.TOTAL_AFFILIATES })}
          outputType={OutputType.Number}
          value={programStats?.totalAffiliates}
        />
      </MobileStatsHeader>
      <div className="flex w-full flex-wrap justify-between">
        <BorderStatCell
          border={['bottom', 'right']}
          className="w-6/12 p-1"
          title={stringGetter({ key: STRING_KEYS.VOLUME_REFERRED })}
          outputType={OutputType.CompactFiat}
          value={programStats?.referredVolume}
        />
        <BorderStatCell
          border={['bottom']}
          className="w-6/12 p-1"
          title={stringGetter({ key: STRING_KEYS.FEES_REFERRED })}
          outputType={OutputType.CompactFiat}
          value={programStats?.referredFees}
        />
        <BorderStatCell
          border={['right']}
          className="w-6/12 p-1"
          title={stringGetter({ key: STRING_KEYS.USERS_REFERRED })}
          outputType={OutputType.Number}
          value={programStats?.totalReferredUsers}
        />
        <StatCell
          className="w-6/12 p-1"
          title={stringGetter({ key: STRING_KEYS.TRADES_REFERRED })}
          outputType={OutputType.Number}
          value={programStats?.referredTrades}
        />
      </div>
    </div>
  );
};

const DesktopView = ({ programStats }: { programStats: IProgramStats }) => {
  const stringGetter = useStringGetter();

  return (
    <div className="flex flex-col gap-y-1 p-1">
      <div className="flex gap-x-8">
        <StatCell
          valueSize="large"
          className="relative"
          title={stringGetter({ key: STRING_KEYS.AFFILIATE_EARNINGS })}
          outputType={OutputType.CompactFiat}
          value={programStats?.totalEarnings}
        />

        <StatCell
          valueSize="large"
          title={stringGetter({ key: STRING_KEYS.TOTAL_AFFILIATES })}
          outputType={OutputType.Number}
          value={programStats?.totalAffiliates}
        />
      </div>
      <div className="flex gap-1">
        <BorderStatCell
          tw="pr-1"
          border={['right']}
          outputType={OutputType.CompactFiat}
          title={stringGetter({ key: STRING_KEYS.VOLUME_REFERRED })}
          value={programStats?.referredVolume}
        />
        <BorderStatCell
          tw="pr-1"
          border={['right']}
          title={stringGetter({ key: STRING_KEYS.FEES_REFERRED })}
          outputType={OutputType.CompactFiat}
          value={programStats?.referredFees}
        />
        <BorderStatCell
          tw="pr-1"
          border={['right']}
          title={stringGetter({ key: STRING_KEYS.USERS_REFERRED })}
          outputType={OutputType.Number}
          value={programStats?.totalReferredUsers}
        />
        <StatCell
          title={stringGetter({ key: STRING_KEYS.TRADES_REFERRED })}
          outputType={OutputType.Number}
          value={programStats?.referredTrades}
        />
      </div>
    </div>
  );
};

export const ProgramStatsCard = ({ className, programStats }: IProgramStatsProps) => {
  const { isNotTablet } = useBreakpoints();

  return (
    <$Container className={className}>
      {isNotTablet ? (
        <DesktopView programStats={programStats} />
      ) : (
        <MobileView programStats={programStats} />
      )}
    </$Container>
  );
};

const $Container = tw.div`rounded-0.625 bg-color-layer-3`;

const MobileStatsHeader = styled.div`
  border-bottom: 1px solid var(--color-border);
`;
