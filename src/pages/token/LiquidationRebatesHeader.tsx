import { useEffect, useMemo, useState } from 'react';

import { Duration } from 'luxon';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';

import { LIQUIDATION_REBATES_DETAILS } from '@/hooks/rewards/util';
import { useNow } from '@/hooks/useNow';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { Panel } from '@/components/Panel';
import { SuccessTag, TagSize } from '@/components/Tag';

export const LiquidationRebatesHeader = () => {
  const stringGetter = useStringGetter();

  // Calculate the last millisecond of the current UTC month
  const now = new Date();
  const endOfCurrentMonth = (() => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0)); // first ms of next month
    date.setTime(date.getTime() - 1); // last ms of this month
    return date.toISOString();
  })();

  return (
    <$Panel>
      <div tw="flex gap-3 pb-0.25 pt-0.5">
        <div tw="flex flex-col gap-1.5">
          <div tw="flex flex-col gap-0.5">
            <div tw="flex items-center gap-0.5">
              <div tw="font-medium-bold">
                <span tw="font-bold">
                  {stringGetter({
                    key: STRING_KEYS.LIQUIDATION_REBATES_HEADLINE,
                    params: {
                      REBATE_AMOUNT: LIQUIDATION_REBATES_DETAILS.rebateAmount,
                    },
                  })}
                </span>
              </div>
              <SuccessTag size={TagSize.Medium}>
                {stringGetter({ key: STRING_KEYS.ACTIVE })}
              </SuccessTag>
            </div>
            <div>
              <p tw="mb-0.5 text-color-text-0">
                {stringGetter({
                  key: STRING_KEYS.LIQUIDATION_REBATES_BODY,
                })}
              </p>
              <p tw="text-color-text-0">
                {stringGetter({
                  key: STRING_KEYS.LIQUIDATION_REBATES_SUB_BODY,
                  params: {
                    LOSS_REBATES_LINK: (
                      <Link
                        href="https://dydx.forum/t/drc-realized-losses-rebate-pilot-program/4828/2"
                        isInline
                      >
                        {stringGetter({ key: STRING_KEYS.LOSS_REBATES })}
                      </Link>
                    ),
                    CHECK_ELIGIBILITY_LINK: (
                      <Link href="https://www.dydx.xyz/liquidation-rebates" isInline>
                        {stringGetter({ key: STRING_KEYS.HERE })}
                      </Link>
                    ),
                  },
                })}
              </p>
            </div>
          </div>
          <div tw="flex items-center gap-0.25 self-start rounded-3 bg-color-layer-1 px-0.875 py-0.5">
            <Icon iconName={IconName.Clock} size="1.25rem" tw="text-color-accent" />
            <div tw="flex gap-0.375">
              <div tw="text-color-accent">
                {stringGetter({
                  key: STRING_KEYS.MONTH_COUNTDOWN,
                })}
                :
              </div>
              {/* Countdown to end of current month */}
              <MinutesCountdown endTime={endOfCurrentMonth} />
            </div>
          </div>
        </div>
      </div>
    </$Panel>
  );
};

const MinutesCountdown = ({ endTime }: { endTime: string }) => {
  const targetMs = Date.parse(endTime);
  const now = useNow();
  const [msLeft, setMsLeft] = useState(Math.max(0, Math.floor(targetMs - Date.now())));

  useEffect(() => {
    if (now > targetMs) {
      return;
    }

    const newMsLeft = Math.max(0, Math.floor(targetMs - now));
    setMsLeft(newMsLeft);
  }, [now, targetMs]);

  const formattedMsLeft = useMemo(() => {
    return Duration.fromMillis(msLeft)
      .shiftTo('days', 'hours', 'minutes', 'seconds')
      .toFormat("d'd' h'h' m'm' s's'", { floor: true });
  }, [msLeft]);

  return <div>{formattedMsLeft}</div>;
};

const $Panel = tw(Panel)`bg-color-layer-3 w-full`;
