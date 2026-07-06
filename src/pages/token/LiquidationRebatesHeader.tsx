import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';

import { LIQUIDATION_REBATES_DETAILS } from '@/hooks/rewards/util';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Link } from '@/components/Link';
import { Panel } from '@/components/Panel';

export const LiquidationRebatesHeader = () => {
  const stringGetter = useStringGetter();

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
        </div>
      </div>
    </$Panel>
  );
};

const $Panel = tw(Panel)`bg-color-layer-3 w-full`;
