import { Link } from 'react-router-dom';
import { css } from 'styled-components';
import { styled } from 'twin.macro';

import {
  AFFILIATES_FEE_DISCOUNT_USD,
  DEFAULT_AFFILIATES_EARN_PER_MONTH_USD,
} from '@/constants/affiliates';
import { ButtonAction, ButtonShape, ButtonSize, ButtonStyle } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useAffiliatesInfo } from '@/hooks/useAffiliatesInfo';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getGridBackground } from '@/state/appUiConfigsSelectors';
import { openDialog } from '@/state/dialogs';
import { setDismissedAffiliateBanner } from '@/state/dismissable';

export const AffiliatesBanner = ({
  withClose = false,
  showLink = false,
}: {
  withClose?: boolean;
  showLink?: boolean;
}) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const {
    affiliateMaxEarningQuery: { data: maxEarningData },
  } = useAffiliatesInfo();

  const background = useAppSelector(getGridBackground);

  const titleString = stringGetter({
    key: STRING_KEYS.EARN_FOR_EACH_TRADER,
    params: {
      AMOUNT_USD:
        maxEarningData?.maxEarning.toLocaleString() ??
        DEFAULT_AFFILIATES_EARN_PER_MONTH_USD.toLocaleString(),
    },
  });

  const description = (
    <div tw="flex flex-col">
      <div>
        {stringGetter({
          key: STRING_KEYS.REFER_FOR_DISCOUNTS,
          params: {
            AMOUNT_USD: `${AFFILIATES_FEE_DISCOUNT_USD.toLocaleString()}`,
          },
        })}
      </div>
      {showLink && (
        <div>
          {stringGetter({
            key: STRING_KEYS.WANT_TO_VIEW_EARNINGS,
            params: {
              LINK: (
                <Link
                  to={AppRoute.Referrals}
                  tw="inline-flex text-color-accent visited:text-color-accent hover:underline"
                >
                  {stringGetter({ key: STRING_KEYS.AFFILIATES_PROGRAM })} →
                </Link>
              ),
            },
          })}
        </div>
      )}
    </div>
  );

  if (isTablet) {
    return (
      <$Background backgroundImagePath={background} tw="bg-color-layer-1 p-1">
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

  const onDismissAffiliateBanner = () => {
    dispatch(setDismissedAffiliateBanner(true));
  };

  return (
    <$Background
      backgroundImagePath={background}
      tw="row justify-between gap-0.5 bg-color-layer-1 pl-1 pr-2"
    >
      {withClose && (
        <$CloseButton
          iconName={IconName.Close}
          shape={ButtonShape.Circle}
          size={ButtonSize.XSmall}
          onClick={onDismissAffiliateBanner}
        />
      )}

      <div tw="row">
        <img src="/affiliates-hedgie.png" alt="affiliates hedgie" tw="h-8" />
        <div tw="column items-start gap-0.5">
          <div tw="row">
            <$Triangle />
            <div tw="inline-block rounded-0.5 bg-color-layer-6 px-1 py-0.5 font-bold text-color-text-2">
              {titleString}
            </div>
          </div>
          <div tw="ml-0.5 text-color-text-0 font-base-book">{description}</div>
        </div>
      </div>

      <Button
        buttonStyle={ButtonStyle.WithoutBackground}
        tw="flex flex-row items-center gap-0.5 hover:underline"
        onClick={() => {
          dispatch(openDialog(DialogTypes.ShareAffiliate()));
        }}
      >
        <span tw="font-bold text-color-text-2">
          {stringGetter({ key: STRING_KEYS.INVITE_FRIENDS })}
        </span>

        <$ArrowIcon>
          <Icon iconName={IconName.Arrow} />
        </$ArrowIcon>
      </Button>
    </$Background>
  );
};

const $Background = styled.div<{ backgroundImagePath: string }>`
  --color-border: transparent;
  ${layoutMixins.withOuterBorderClipped}

  position: relative;

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

const $CloseButton = styled(IconButton)`
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
`;

const $ArrowIcon = styled.div`
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-layer-3);
  color: var(--color-text-1);
  border-radius: 50%;
  font-size: 0.8438rem;
`;
