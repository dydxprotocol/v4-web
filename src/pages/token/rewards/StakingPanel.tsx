import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';
import { Tag, TagSign } from '@/components/Tag';
import { Toolbar } from '@/components/Toolbar';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

export const StakingPanel = ({ className }: { className?: string }) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const canAccountTrade = useAppSelector(calculateCanAccountTrade, shallowEqual);
  const { complianceState } = useComplianceState();
  const { nativeTokenBalance, nativeStakingBalance } = useAccountBalance();
  const { chainTokenLabel } = useTokenConfigs();

  const unstakedApr = 16.94; /* OTE-406: Hardcoded for now until I get the APY endpoint working */
  const stakedApr = 16.94; /* OTE-406: Hardcoded for now until I get the APY endpoint working */

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
            <$ActionButtons>
              {!canAccountTrade ? (
                <OnboardingTriggerButton size={ButtonSize.Small} />
              ) : (
                <Button
                  slotLeft={<Icon iconName={IconName.Send} />}
                  size={ButtonSize.Small}
                  action={ButtonAction.Primary}
                  onClick={() => dispatch(openDialog({ type: DialogTypes.Transfer }))}
                >
                  {stringGetter({ key: STRING_KEYS.TRANSFER })}
                </Button>
              )}
            </$ActionButtons>
          )}
        </$Header>
      }
    >
      <$Content>
        <$BalanceRow>
          <div>
            <$label>
              {stringGetter({
                key: STRING_KEYS.UNSTAKED,
              })}
              <Tag sign={TagSign.Positive}>
                {stringGetter({ key: STRING_KEYS.EST_APR, params: { PERCENTAGE: unstakedApr } })}
              </Tag>
            </$label>
            <$BalanceOutput type={OutputType.Asset} value={nativeTokenBalance} />
          </div>
          {canAccountTrade && (
            <div>
              <Button
                action={ButtonAction.Primary}
                onClick={() => dispatch(openDialog({ type: DialogTypes.Stake }))}
              >
                {stringGetter({ key: STRING_KEYS.STAKE })}
              </Button>
            </div>
          )}
        </$BalanceRow>
        <$BalanceRow>
          <div>
            <$label>
              {stringGetter({
                key: STRING_KEYS.STAKED,
              })}
              <Tag>
                {stringGetter({ key: STRING_KEYS.EST_APR, params: { PERCENTAGE: stakedApr } })}
              </Tag>
            </$label>
            <$BalanceOutput type={OutputType.Asset} value={nativeStakingBalance} />
          </div>
          {canAccountTrade && nativeStakingBalance > 0 && (
            <div>
              <Button
                action={ButtonAction.Base}
                onClick={() => dispatch(openDialog({ type: DialogTypes.Unstake }))}
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
              label: 'Total balance',
              value: (
                <Output
                  type={OutputType.Asset}
                  value={nativeTokenBalance.plus(nativeStakingBalance)}
                  tag={chainTokenLabel}
                />
              ),
            },
          ]}
        />
      </$Content>
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

const $ActionButtons = styled(Toolbar)`
  ${layoutMixins.inlineRow}
  --stickyArea-topHeight: max-content;
  gap: 0.5rem;
  padding: 0;
`;

const $Content = styled.div`
  ${layoutMixins.flexColumn}
  gap: 0.75rem;
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

const $label = styled.div`
  ${layoutMixins.row}

  gap: 0.25rem;
`;

const $BalanceOutput = styled(Output)`
  font-size: var(--fontSize-large);
  color: var(--color-text-0);
`;
