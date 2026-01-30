import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { ButtonAction } from '@/constants/buttons';
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

import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { Tag, TagSign } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

export const Stake = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const canAccountTrade = useAppSelector(calculateCanAccountTrade);
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
            key: STRING_KEYS.MINTSCAN,
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
    <div tw="flexColumn gap-0.75">
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
        <div tw="min-w-px">
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
  );
};

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

const $Label = tw.div`row gap-0.5`;

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
