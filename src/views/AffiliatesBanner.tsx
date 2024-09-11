import { css } from 'styled-components';
import { styled } from 'twin.macro';

import { AFFILIATES_EARN_PER_MONTH, AFFILIATES_FEE_DISCOUNT } from '@/constants/affiliates';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getBackground, BackgroundType } from '@/state/configsSelectors';
import { openDialog } from '@/state/dialogs';

export const AffiliatesBanner = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const { affiliateProgram } = useURLConfigs();

  const background = useAppSelector(getBackground)(BackgroundType.Grid);

  return (
    <$Background
      backgroundImagePath={background}
      tw="row mb-1 mt-1 justify-between gap-0.5 bg-color-layer-1 pl-1 pr-2"
    >
      <div tw="row">
        <img src="/affiliates-hedgie.png" alt="affiliates hedgie" tw="mt-1 h-8" />
        <div tw="column items-start gap-0.5">
          <div tw="row">
            <$Triangle />
            <div tw="inline-block rounded-0.5 bg-color-layer-6 px-1 py-0.5 font-bold text-color-text-2">
              {stringGetter({
                key: STRING_KEYS.EARN_FOR_EACH_TRADER,
                params: { AMOUNT_USD: AFFILIATES_EARN_PER_MONTH.toLocaleString() },
              })}
            </div>
          </div>
          <div tw="ml-0.5">
            {stringGetter({
              key: STRING_KEYS.REFER_FOR_DISCOUNTS_FIRST_ORDER,
              params: {
                AMOUNT_USD: AFFILIATES_FEE_DISCOUNT.toLocaleString(),
              },
            })}{' '}
            <br />
            {stringGetter({
              key: STRING_KEYS.WANT_TO_VIEW_EARNINGS,
              params: {
                LINK: (
                  <Link href={affiliateProgram} isInline isAccent>
                    {stringGetter({ key: STRING_KEYS.AFFILIATES_PROGRAM })} →
                  </Link>
                ),
              },
            })}
          </div>
        </div>
      </div>
      <div>
        <Button
          action={ButtonAction.Primary}
          slotLeft={<Icon iconName={IconName.Giftbox} />}
          size={ButtonSize.Medium}
          onClick={() => {
            dispatch(openDialog(DialogTypes.ShareAffiliate()));
          }}
        >
          {stringGetter({ key: STRING_KEYS.INVITE_FRIENDS })}
        </Button>
      </div>
    </$Background>
  );
};

const $Background = styled.div<{ backgroundImagePath: string }>`
  --color-border: transparent;
  ${layoutMixins.withOuterBorderClipped}

  ${({ backgroundImagePath }) => css`
    background: url(${backgroundImagePath});
  `}

  background-repeat: no-repeat;
  background-position-x: 100%;
  background-size: contain;
`;

const $Triangle = styled.div`
  width: 0;
  height: 0;

  border-top: 0.5rem solid transparent;
  border-bottom: 0.5rem solid transparent;
  border-right: 0.5rem solid var(--color-layer-6);
`;
