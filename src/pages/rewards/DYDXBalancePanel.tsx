import type { ElementType } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

import { layoutMixins } from '@/styles/layoutMixins';
import { useAccountBalance, useAccounts, useTokenConfigs, useStringGetter } from '@/hooks';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { wallets, WalletType } from '@/constants/wallets';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';
import { Toolbar } from '@/components/Toolbar';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { openDialog } from '@/state/dialogs';
import { calculateCanAccountTrade } from '@/state/accountCalculators';

export const DYDXBalancePanel = () => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();

  const { walletType } = useAccounts();
  const canAccountTrade = useSelector(calculateCanAccountTrade, shallowEqual);
  const { nativeTokenBalance, nativeStakingBalance } = useAccountBalance();
  const { chainTokenLabel } = useTokenConfigs();

  return (
    <Panel
      slotHeader={
        <Styled.Header>
          <Styled.Title>
            {/* <AssetIcon symbol="DYDX" /> */}
            {chainTokenLabel}
          </Styled.Title>
          <Styled.ReceiveAndTransferButtons>
            {!canAccountTrade ? (
              <OnboardingTriggerButton size={ButtonSize.Small} />
            ) : (
              <>
                <Styled.ReceiveButton
                  slotLeft={<Icon iconName={IconName.Qr} />}
                  size={ButtonSize.Small}
                  onClick={() => dispatch(openDialog({ type: DialogTypes.Receive }))}
                >
                  {stringGetter({ key: STRING_KEYS.RECEIVE })}
                </Styled.ReceiveButton>
                <Button
                  slotLeft={<Icon iconName={IconName.Send} />}
                  size={ButtonSize.Small}
                  action={ButtonAction.Primary}
                  onClick={() => dispatch(openDialog({ type: DialogTypes.Transfer }))}
                >
                  {stringGetter({ key: STRING_KEYS.TRANSFER })}
                </Button>
              </>
            )}
          </Styled.ReceiveAndTransferButtons>
        </Styled.Header>
      }
    >
      <Styled.Content>
        <Styled.WalletAndStakedBalance
          layout="grid"
          items={[
            {
              key: 'wallet',
              label: (
                <Styled.Label>
                  <h4>{stringGetter({ key: STRING_KEYS.WALLET })}</h4>
                  <Styled.IconContainer>
                    <Icon
                      iconComponent={
                        wallets[walletType || WalletType.OtherWallet].icon as ElementType
                      }
                    />
                  </Styled.IconContainer>
                </Styled.Label>
              ),

              value: <Output type={OutputType.Asset} value={nativeTokenBalance} />,
            },
            {
              key: 'staked',
              label: (
                <Styled.Label>
                  <h4>{stringGetter({ key: STRING_KEYS.STAKED })}</h4>
                  <Styled.IconContainer>
                    <Icon iconName={IconName.Lock} />
                  </Styled.IconContainer>
                </Styled.Label>
              ),

              value: <Output type={OutputType.Asset} value={nativeStakingBalance} />,
            },
          ]}
        />
        <Styled.TotalBalance
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
      </Styled.Content>
    </Panel>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Header = styled.div`
  ${layoutMixins.spacedRow}
  padding: 1rem 1.5rem 0;
`;

Styled.Title = styled.h3`
  ${layoutMixins.inlineRow}
  font: var(--font-medium-book);
  color: var(--color-text-2);

  img {
    font-size: 1.5rem;
  }
`;

Styled.ReceiveAndTransferButtons = styled(Toolbar)`
  ${layoutMixins.inlineRow}
  --stickyArea-topHeight: max-content;
  gap: 0.5rem;
  padding: 0;
`;

Styled.ReceiveButton = styled(Button)`
  --button-textColor: var(--color-text-2);
  --button-backgroundColor: var(--color-layer-5);
  --button-border: solid var(--border-width) var(--color-layer-6);
`;

Styled.Content = styled.div`
  ${layoutMixins.flexColumn}
  gap: 0.75rem;
`;

Styled.IconContainer = styled.div`
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

Styled.WalletAndStakedBalance = styled(Details)`
  --details-item-backgroundColor: var(--color-layer-6);

  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;

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

Styled.Label = styled.div`
  ${layoutMixins.spacedRow}

  font: var(--font-base-book);
  color: var(--color-text-1);
`;

Styled.TotalBalance = styled(Details)`
  div {
    --scrollArea-height: auto;
  }

  output {
    color: var(--color-text-1);
  }
`;
