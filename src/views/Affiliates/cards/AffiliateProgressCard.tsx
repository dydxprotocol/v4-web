import { AFFILIATES_REQUIRED_VOLUME_USD } from '@/constants/affiliates';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Output, OutputType } from '@/components/Output';

export const AffiliateProgressCard = ({
  volume = 0,
  className,
}: {
  volume?: number;
  className?: string;
}) => {
  const stringGetter = useStringGetter();

  const progressRatio = volume / AFFILIATES_REQUIRED_VOLUME_USD;
  const remaining = AFFILIATES_REQUIRED_VOLUME_USD - volume;
  return (
    <div className={className} tw="flex flex-col gap-1.5 rounded-1 p-1">
      <div tw="flex items-center justify-between gap-0.5">
        <div tw="flex flex-col gap-0.375">
          <div tw="font-semibold">{stringGetter({ key: STRING_KEYS.BECOME_AN_AFFILIATE })}</div>
          <div tw="text-color-text-0">
            {stringGetter({ key: STRING_KEYS.TRADE_MORE_VOLUME_REQUIREMENT })}
          </div>
        </div>
        <div tw="text-large font-medium">
          <Output tw="inline" value={progressRatio} type={OutputType.Percent} fractionDigits={0} />
        </div>
      </div>
      <div tw="flex flex-col gap-0.75">
        <div tw="flex justify-between">
          <div tw="flex items-end">
            <Output
              value={volume}
              type={OutputType.Fiat}
              slotRight={` ${stringGetter({ key: STRING_KEYS.TRADED })}`}
            />
          </div>
          <div tw="text-color-text-0">
            <Output
              value={remaining}
              type={OutputType.Fiat}
              slotRight={` ${stringGetter({ key: STRING_KEYS.REMAINING })}`}
            />
          </div>
        </div>
        <div tw="relative h-2.5 w-full overflow-hidden rounded-0.5 bg-color-layer-7">
          <div tw="absolute h-full bg-color-accent" style={{ width: `${progressRatio * 100}%` }} />
        </div>
      </div>
    </div>
  );
};
