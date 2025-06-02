import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';
import { IndexerHistoricalBlockTradingReward } from '@/types/indexer/indexerApiGen';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { AccentTag } from '@/components/Tag';

import { TradeNotificationRow } from './TradeNotificationRow';

export const BlockRewardNotificationRow = ({
  className,
  blockReward,
  isUnseen,
}: {
  className?: string;
  blockReward: IndexerHistoricalBlockTradingReward;
  isUnseen: boolean;
}) => {
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();

  const slotLeft = (
    <>
      <span tw="overflow-hidden text-ellipsis whitespace-nowrap leading-[1rem] text-color-text-2 font-base-book">
        {stringGetter({ key: STRING_KEYS.TRADING_REWARD })}
      </span>

      <span tw="leading-[0] text-color-text-0 font-tiny-book">
        {stringGetter({ key: STRING_KEYS.BLOCK_REWARD })}
      </span>
    </>
  );

  const slotRight = (
    <>
      <span tw="inline text-color-text-0 font-mini-book">
        {stringGetter({ key: STRING_KEYS.RECEIVE })}
      </span>

      <Output
        withSignColor
        tw="inline text-color-text-2 font-small-book"
        type={OutputType.Number}
        value={blockReward.tradingReward}
        fractionDigits={TOKEN_DECIMALS}
        showSign={ShowSign.Both}
        slotRight={<AccentTag tw="ml-0.25 rounded-1 px-0.5">{chainTokenLabel}</AccentTag>}
      />
    </>
  );

  return (
    <TradeNotificationRow
      className={className}
      logo={null}
      iconName={IconName.RewardStars}
      slotLeft={slotLeft}
      slotRight={slotRight}
      isUnseen={isUnseen}
    />
  );
};
