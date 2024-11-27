import {
  AFFILIATES_FEE_DISCOUNT_USD,
  DEFAULT_AFFILIATES_EARN_PER_MONTH_USD,
  DEFAULT_AFFILIATES_VIP_EARN_PER_MONTH_USD,
} from '@/constants/affiliates';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { AffiliateProgressCard } from './cards/AffiliateProgressCard';

export const AffiliateProgress = ({ volume }: { volume?: number }) => {
  const stringGetter = useStringGetter();
  return (
    <div tw="flex flex-col gap-1">
      <AffiliateProgressCard tw="flex-1 bg-color-layer-5" volume={volume} />
      <div tw="flex flex-col gap-0.375">
        <div tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.BENEFITS })}</div>
        <ul tw="flex list-inside flex-col gap-0.375">
          <li>
            {stringGetter({
              key: STRING_KEYS.EARN_FOR_EACH_TRADER,
              params: {
                AMOUNT_USD: DEFAULT_AFFILIATES_EARN_PER_MONTH_USD.toLocaleString(),
              },
            })}
          </li>
          <li>
            {stringGetter({
              key: STRING_KEYS.VIP_AFFILIATE_EARNINGS,
              params: {
                AMOUNT_USD: DEFAULT_AFFILIATES_VIP_EARN_PER_MONTH_USD.toLocaleString(),
              },
            })}
          </li>
          <li>
            {stringGetter({
              key: STRING_KEYS.REFEREE_BENEFITS,
              params: {
                AMOUNT_USD: AFFILIATES_FEE_DISCOUNT_USD.toLocaleString(),
              },
            })}
          </li>
        </ul>
      </div>
    </div>
  );
};
