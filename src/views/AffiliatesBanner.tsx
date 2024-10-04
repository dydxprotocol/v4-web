import { css } from 'styled-components';
import { styled } from 'twin.macro';

import { AFFILIATES_EARN_PER_MONTH, AFFILIATES_FEE_DISCOUNT } from '@/constants/affiliates';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getGridBackground } from '@/state/configsSelectors';
import { openDialog } from '@/state/dialogs';

export const AffiliatesBanner = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const { affiliateProgram } = useURLConfigs();

  const background = useAppSelector(getGridBackground);

  const titleString = stringGetter({
    key: STRING_KEYS.EARN_FOR_EACH_TRADER,
    params: { AMOUNT_USD: AFFILIATES_EARN_PER_MONTH.toLocaleString() },
  });

  const description = (
    <>
      {stringGetter({
        key: STRING_KEYS.REFER_FOR_DISCOUNTS_FIRST_ORDER,
        params: {
          AMOUNT_USD: `$${AFFILIATES_FEE_DISCOUNT.toLocaleString()}`,
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
    </>
  );

  if (isTablet) {
    return (
      <$Background backgroundImagePath={background} tw="mt-1 bg-color-layer-1 p-1">
        <div tw="column items-start gap-1">
          <div tw="font-bold text-color-text-2">{titleString}</div>
          <div tw="">{description}</div>
          <Button
            action={ButtonAction.Primary}
            slotLeft={<Icon iconName={IconName.Giftbox} />}
            onClick={() => {
              dispatch(openDialog(DialogTypes.ShareAffiliate()));
            }}
          >
            {stringGetter({ key: STRING_KEYS.INVITE_FRIENDS })}
          </Button>
        </div>
      </$Background>
    );
  }

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
              {titleString}
            </div>
          </div>
          <div tw="ml-0.5">{description}</div>
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

  @media ${breakpoints.tablet} {
    background-position-x: 0;
    background-size: cover;
  }
`;

const $Triangle = styled.div`
  width: 0;
  height: 0;

  border-top: 0.5rem solid transparent;
  border-bottom: 0.5rem solid transparent;
  border-right: 0.5rem solid var(--color-layer-6);
`;
