import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { ButtonAction, ButtonShape, ButtonSize } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useStakingAPR } from '@/hooks/useStakingAPR';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';
import { Tag, TagSign } from '@/components/Tag';
import { Toolbar } from '@/components/Toolbar';
import { WithTooltip } from '@/components/WithTooltip';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

export const StakingPanel = ({ className }: { className?: string }) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const canAccountTrade = useAppSelector(calculateCanAccountTrade, shallowEqual);
  const stakingApr = useStakingAPR();

  const { complianceState } = useComplianceState();
  const { nativeTokenBalance, nativeStakingBalance } = useAccountBalance();
  const { chainTokenLabel } = useTokenConfigs();
  const { protocolStaking } = useURLConfigs();

  const showStakingActions = canAccountTrade && complianceState === ComplianceStates.FULL_ACCESS;

  const estimatedAprTooltipString = stringGetter({
    key: STRING_KEYS.ESTIMATED_APR_DATA_BASED_ON,
    params: {
      PROTOCOL_STAKING_LINK: (
        <Link href={protocolStaking} withIcon isInline>
          {stringGetter({
            key: STRING_KEYS.PROTOCOL_STAKING,
          })}
        </Link>
      ),
    },
  });

  const aprText = stringGetter({
    key: STRING_KEYS.EST_APR,
    params: {
      PERCENTAGE: <Output type={OutputType.Percent} value={stakingApr} tw="inline-block" />,
    },
  });

  return (
    <Panel
      className={className}
      slotHeader={
        <$Header>
          <$Title>
            <AssetIcon symbol={chainTokenLabel} />
            {chainTokenLabel}
          </$Title>
          {complianceState === ComplianceStates.FULL_ACCESS && (
            <Toolbar tw="gap-0.5 p-0 inlineRow [--stickyArea-topHeight:max-content]">
              {!canAccountTrade ? (
                <OnboardingTriggerButton size={ButtonSize.Small} />
              ) : (
                <IconButton
                  iconName={IconName.Send}
                  shape={ButtonShape.Square}
                  size={ButtonSize.Small}
                  action={ButtonAction.Base}
                  onClick={() => dispatch(openDialog(DialogTypes.Transfer({})))}
                />
              )}
            </Toolbar>
          )}
        </$Header>
      }
    >
      <div tw="gap-0.75 flexColumn">
        <$BalanceRow>
          <div>
            <$Label>
              <WithTooltip tooltipString={estimatedAprTooltipString}>
                {stringGetter({
                  key: STRING_KEYS.UNSTAKED,
                })}
              </WithTooltip>
            </$Label>
            <$BalanceOutput
              type={OutputType.Asset}
              value={nativeTokenBalance}
              isPositive={nativeTokenBalance.gt(0)}
            />
          </div>
          {showStakingActions && (
            <div>
              <Button
                action={ButtonAction.Primary}
                onClick={() => dispatch(openDialog(DialogTypes.Stake()))}
              >
                {stringGetter({ key: STRING_KEYS.STAKE })}
              </Button>
            </div>
          )}
        </$BalanceRow>
        <$BalanceRow>
          <div>
            <$Label>
              <WithTooltip tooltipString={estimatedAprTooltipString}>
                {stringGetter({
                  key: STRING_KEYS.STAKED,
                })}
              </WithTooltip>
              {stakingApr && (
                <Tag sign={TagSign.Positive} tw="inline-block">
                  {aprText}
                </Tag>
              )}
            </$Label>
            <$BalanceOutput
              type={OutputType.Asset}
              value={nativeStakingBalance}
              isPositive={nativeStakingBalance > 0}
            />
          </div>
          {showStakingActions && nativeStakingBalance > 0 && (
            <div>
              <Button
                action={ButtonAction.Base}
                onClick={() => dispatch(openDialog(DialogTypes.Unstake()))}
              >
                {stringGetter({ key: STRING_KEYS.UNSTAKE })}
              </Button>
            </div>
          )}
        </$BalanceRow>
        <$TotalBalance
          items={[
            {
              key: 'totalBalance',
              label: (
                <$Label>
                  {stringGetter({ key: STRING_KEYS.TOTAL_BALANCE })}
                  <Tag>{chainTokenLabel}</Tag>
                </$Label>
              ),
              value: (
                <Output
                  type={OutputType.Asset}
                  value={nativeTokenBalance.plus(nativeStakingBalance)}
                />
              ),
            },
          ]}
        />
      </div>
    </Panel>
  );
};

const $Header = styled.div`
  ${layoutMixins.spacedRow}
  gap: 1rem;
  padding: var(--panel-paddingY) var(--panel-paddingX) 0;
`;

const $Title = styled.h3`
  ${layoutMixins.inlineRow}
  font: var(--font-medium-book);
  color: var(--color-text-2);

  img {
    font-size: 1.5rem;
  }
`;
const $TotalBalance = styled(Details)`
  div {
    --scrollArea-height: auto;
  }

  output {
    color: var(--color-text-1);
  }
`;

const $BalanceRow = styled.div`
  ${layoutMixins.spacedRow}
  box-shadow: 0 0 0 1px var(--color-border);
  border-radius: 0.625rem;

  gap: 0.5rem;
  padding: 1rem;
`;

const $Label = tw.div`gap-0.5 row`;

const $BalanceOutput = styled(Output)<{ isPositive: boolean }>`
  font-size: var(--fontSize-large);

  ${({ isPositive }) =>
    isPositive
      ? css`
          color: var(--color-text-2);
        `
      : css`
          color: var(--color-text-0);
        `}
`;
