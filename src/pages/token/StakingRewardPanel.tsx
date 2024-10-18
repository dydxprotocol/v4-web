import { useCallback } from 'react';

import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { SMALL_USD_DECIMALS } from '@/constants/numbers';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { Panel } from '@/components/Panel';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { getStakingRewards } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getChartDotBackground } from '@/state/configsSelectors';
import { openDialog } from '@/state/dialogs';

import { BigNumberish } from '@/lib/numbers';

type ElementProps = {
  usdcRewards: BigNumberish;
};

export const StakingRewardPanel = ({ usdcRewards }: ElementProps) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const canAccountTrade = useAppSelector(calculateCanAccountTrade);
  const chartDotsBackground = useAppSelector(getChartDotBackground);
  const { validators } = useAppSelector(getStakingRewards, shallowEqual) ?? {};
  const { usdcImage } = useTokenConfigs();

  const openStakingRewardDialog = useCallback(
    () =>
      dispatch(
        openDialog(
          DialogTypes.StakingReward({ validators: validators?.toArray() ?? [], usdcRewards })
        )
      ),
    [dispatch, validators, usdcRewards]
  );

  return (
    <$Panel
      backgroundImagePath={chartDotsBackground}
      slotHeader={
        <$Title>
          {stringGetter({
            key: STRING_KEYS.STAKING_REWARDS_AVAILABLE,
          })}
        </$Title>
      }
      slotRight={
        canAccountTrade && (
          <Button
            action={ButtonAction.Primary}
            size={ButtonSize.Base}
            onClick={openStakingRewardDialog}
            tw="z-[1] mr-[--panel-paddingX]"
          >
            {stringGetter({ key: STRING_KEYS.CLAIM })}
          </Button>
        )
      }
    >
      <$InlineRow>
        <$PositiveOutput
          type={OutputType.Asset}
          value={usdcRewards}
          showSign={ShowSign.Both}
          minimumFractionDigits={SMALL_USD_DECIMALS}
        />
        <AssetIcon logoUrl={usdcImage} symbol="USDC" />
      </$InlineRow>
    </$Panel>
  );
};

const $Title = styled.h3`
  padding: var(--panel-paddingY) var(--panel-paddingX) 0;
  font: var(--font-medium-book);

  z-index: 1;
`;

const $Panel = styled(Panel)<{ backgroundImagePath: string }>`
  --gradient-start-color: var(--color-layer-5);

  ${({ backgroundImagePath }) => css`
    background: url(${backgroundImagePath}),
      linear-gradient(270deg, var(--color-positive-dark), var(--gradient-start-color) 60%);
  `}
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;

    border-radius: var(--panel-border-radius);
    background: var(--gradient-start-color);
    mask-image: linear-gradient(270deg, transparent, var(--gradient-start-color) 60%);
  }
`;
const $InlineRow = styled.span`
  ${layoutMixins.inlineRow}

  height: 100%;

  img {
    font-size: 1.3rem;
  }
`;

const $PositiveOutput = styled(Output)`
  --output-sign-color: var(--color-positive);

  color: var(--color-text-2);
  font: var(--font-large-book);
`;
