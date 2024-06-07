import { useCallback } from 'react';

import styled from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { SMALL_USD_DECIMALS } from '@/constants/numbers';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { Panel } from '@/components/Panel';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { BigNumberish } from '@/lib/numbers';

type ElementProps = {
  usdcRewards: BigNumberish;
};

export const StakingRewardPanel = ({ usdcRewards }: ElementProps) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const openStakingRewardDialog = useCallback(
    () =>
      dispatch(
        openDialog({
          type: DialogTypes.StakingReward,
          dialogProps: { usdcRewards },
        })
      ),
    [dispatch, usdcRewards]
  );

  return (
    <$Panel
      slotHeader={
        <$Title>
          {stringGetter({
            key: STRING_KEYS.STAKING_REWARDS_AVAILABLE,
          })}
        </$Title>
      }
      slotRight={
        <$Button action={ButtonAction.Primary} onClick={openStakingRewardDialog}>
          {stringGetter({ key: STRING_KEYS.CLAIM })}
        </$Button>
      }
    >
      <$InlineRow>
        <$PositiveOutput
          type={OutputType.Asset}
          value={usdcRewards}
          showSign={ShowSign.Both}
          fractionDigits={SMALL_USD_DECIMALS}
        />
        <AssetIcon symbol="USDC" />
      </$InlineRow>
    </$Panel>
  );
};

const $Title = styled.h3`
  padding: var(--panel-paddingY) var(--panel-paddingX) 0;
  font: var(--font-medium-book);

  z-index: 1;
`;

const $Panel = styled(Panel)`
  --gradient-start-color: var(--color-layer-5);

  background: url('/chart-dots-background-dark.svg'),
    linear-gradient(254deg, var(--color-green-dark), var(--gradient-start-color) 60%);
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
    mask-image: linear-gradient(254deg, transparent, var(--gradient-start-color) 60%);
  }
`;

const $Button = styled(Button)`
  margin-right: var(--panel-paddingX);

  z-index: 1;
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
