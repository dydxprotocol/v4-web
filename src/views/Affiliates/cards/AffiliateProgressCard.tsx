import { AFFILIATES_REQUIRED_VOLUME_USD } from '@/constants/affiliates';

import { Output, OutputType } from '@/components/Output';

export const AffiliateProgressCard = ({
  volume,
  className,
  description,
}: {
  volume?: number;
  className?: string;
  description?: string;
}) => {
  const progressPercent = ((volume / AFFILIATES_REQUIRED_VOLUME_USD) * 100).toFixed(0).toString();
  const remaining = AFFILIATES_REQUIRED_VOLUME_USD - volume;
  return (
    <div className={className} tw="flex flex-col gap-1.5 rounded-1 p-1">
      <div tw="flex items-center justify-between">
        <div tw="flex flex-col gap-0.375">
          <div tw="font-semibold">Become an affiliate</div>
          <div tw="text-color-text-0">{description ?? 'You will need to trade more volume.'}</div>
        </div>
        <div tw="text-large font-medium">{progressPercent}%</div>
      </div>
      <div tw="flex flex-col gap-0.75">
        <div tw="flex justify-between">
          <div tw="flex items-end">
            <Output value={volume} type={OutputType.Fiat} slotRight=" traded" />
          </div>
          <div tw="text-color-text-0">
            <Output value={remaining} type={OutputType.Fiat} slotRight=" remaining" />
          </div>
        </div>
        <div tw="relative h-2.5 w-full overflow-hidden rounded-0.5 bg-color-layer-7">
          <div tw="absolute h-full bg-color-accent" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    </div>
  );
};
