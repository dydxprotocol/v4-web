import type { ElementType } from 'react';

import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { WalletType, wallets } from '@/constants/wallets';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';
import { Toolbar } from '@/components/Toolbar';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

export const DYDXBalancePanel = ({ className }: { className?: string }) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const { walletType } = useAccounts();
  const canAccountTrade = useAppSelector(calculateCanAccountTrade, shallowEqual);
  const { nativeTokenBalance, nativeStakingBalance } = useAccountBalance();
  const { chainTokenLabel } = useTokenConfigs();

  return (
    <Panel
      className={className}
      slotHeader={
        <$Header>
          <$Title>
            <AssetIcon symbol={chainTokenLabel} />
            {chainTokenLabel}
          </$Title>
          <$ActionButtons>
            {!canAccountTrade ? (
              <OnboardingTriggerButton size={ButtonSize.Small} />
            ) : (
              <Button
                slotLeft={<Icon iconName={IconName.Send} />}
                size={ButtonSize.Small}
                action={ButtonAction.Primary}
                onClick={() => dispatch(openDialog(DialogTypes.Transfer({})))}
              >
                {stringGetter({ key: STRING_KEYS.TRANSFER })}
              </Button>
            )}
          </$ActionButtons>
        </$Header>
      }
    >
      <$Content>
        <$WalletAndStakedBalance
          layout="grid"
          items={[
            {
              key: 'wallet',
              label: (
                <$Label>
                  <h4>{stringGetter({ key: STRING_KEYS.WALLET })}</h4>
                  <$IconContainer>
                    <Icon
                      iconComponent={
                        wallets[walletType ?? WalletType.OtherWallet].icon as ElementType
                      }
                    />
                  </$IconContainer>
                </$Label>
              ),

              value: <Output type={OutputType.Asset} value={nativeTokenBalance} />,
            },
            {
              key: 'staked',
              label: (
                <$Label>
                  <h4>{stringGetter({ key: STRING_KEYS.STAKED })}</h4>
                  <$IconContainer>
                    <Icon iconName={IconName.Lock} />
                  </$IconContainer>
                </$Label>
              ),

              value: <Output type={OutputType.Asset} value={nativeStakingBalance} />,
            },
          ]}
        />
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

const $IconContainer = styled.div`
  ${layoutMixins.stack}

  height: 1.5rem;
  width: 1.5rem;

  background-color: var(--color-layer-3);
  border-radius: 50%;

  > svg {
    place-self: center;
    height: 0.75rem;
    width: auto;
    color: var(--color-text-0);
  }
`;

const $WalletAndStakedBalance = styled(Details)`
  --details-item-backgroundColor: var(--color-layer-6);

  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  > div {
    gap: 1rem;

    padding: 1rem;

    border-radius: 0.75em;
    background-color: var(--color-layer-5);
  }

  dt {
    width: 100%;
  }

  output {
    color: var(--color-text-2);
    font: var(--font-large-book);
  }
`;

const $Label = styled.div`
  ${layoutMixins.spacedRow}

  font: var(--font-base-book);
  color: var(--color-text-1);
`;

const $TotalBalance = styled(Details)`
  div {
    --scrollArea-height: auto;
  }

  output {
    color: var(--color-text-1);
  }
`;
