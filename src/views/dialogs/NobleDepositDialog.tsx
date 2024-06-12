import { useCallback, useEffect } from 'react';

import { Description } from '@radix-ui/react-dialog';
import Long from 'long';
import styled from 'styled-components';
import { formatUnits } from 'viem';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { LocalStorageKey } from '@/constants/localStorage';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { GreenCheckCircle } from '@/components/GreenCheckCircle';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';

import abacusStateManager from '@/lib/abacus';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

export const NobleDepositDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { usdcGasDenom, usdcDecimals } = useTokenConfigs();
  const { isMobile } = useBreakpoints();
  const { nobleAddress, dydxAddress } = useAccounts();
  const { deposit } = useSubaccount();
  const [step, setStep] = useLocalStorage<{
    value: 'loading' | 'ibcTransfer' | 'depositToSubaccount';
    state: 'success' | 'error' | 'waiting';
    usdcAmount: string;
  }>({
    key: LocalStorageKey.LastNobleDepositStep,
    defaultValue: {
      value: 'loading',
      state: 'waiting',
      usdcAmount: '0',
    },
  });

  const ibcFromNoble = useCallback(async () => {
    try {
      const tx = await abacusStateManager.sendNobleIBC({
        msgTypeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
        msg: {
          sourcePort: 'transfer',
          sourceChannel: isMainnet ? 'channel-33' : 'channel-21',
          sender: nobleAddress,
          receiver: dydxAddress,
          token: {
            denom: usdcGasDenom,
            amount: step.usdcAmount,
          },
          timeoutTimestamp: Long.fromNumber(Math.floor(Date.now() / 1000) * 1e9 + 10 * 60 * 1e9),
        },
      });

      if (tx !== undefined) {
        const parsedTx = JSON.parse(tx);

        if (parsedTx.error !== undefined || parsedTx.code !== 0) {
          throw new Error(parsedTx.error);
        }
        setStep((prev) => ({ ...prev, value: 'depositToSubaccount', state: 'waiting' }));
      }
    } catch {
      setStep((prev) => ({ ...prev, state: 'error' }));
    }
  }, [dydxAddress, nobleAddress, step.usdcAmount, usdcGasDenom]);

  const depositToSubaccount = useCallback(async () => {
    const amount = parseFloat(formatUnits(BigInt(step.usdcAmount), usdcDecimals));

    if (amount > 0) {
      try {
        const tx = await deposit(amount);

        if (tx !== undefined) {
          const txHash = Buffer.from(tx.hash).toString('hex');

          setStep((prev) => ({ ...prev, state: 'success' }));
        } else {
          throw new Error('Transaction failed');
        }
      } catch {
        setStep((prev) => ({ ...prev, state: 'error' }));
      }
    }
  }, [step.usdcAmount, usdcDecimals]);

  useEffect(() => {
    if (step.value === 'loading') {
      setStep((prev) => ({ ...prev, value: 'ibcTransfer', state: 'waiting' }));
    }
  }, [step.value]);

  useEffect(() => {
    if (step.state === 'waiting') {
      if (step.value === 'ibcTransfer') {
        ibcFromNoble();
      }
      if (step.value === 'depositToSubaccount') {
        depositToSubaccount();
      }
    }
  }, [step.state, step.value, depositToSubaccount, ibcFromNoble]);

  const onRetry = () => {
    setStep((prev) => ({
      ...prev,
      state: 'waiting',
    }));
  };

  const onClose = () => {
    setIsOpen?.(false);
  };

  const stepItems = [
    {
      step: 1,
      title: 'Send USDC',
      description: 'Send IBC from Noble. USDC’s native chain.',
      showStepNumber: step.value === 'loading',
      isWaiting: step.value === 'ibcTransfer' && step.state === 'waiting',
      isSuccess: step.value === 'depositToSubaccount',
      isError: step.value === 'ibcTransfer' && step.state === 'error',
    },
    {
      step: 2,
      title: 'Confirm Deposit',
      description: 'Fund your dYdX subaccount balance once your IBC transfer has been received.',
      showStepNumber: step.value === 'ibcTransfer',
      isWaiting: step.value === 'depositToSubaccount' && step.state === 'waiting',
      isSuccess: step.value === 'depositToSubaccount' && step.state === 'success',
      isError: step.value === 'depositToSubaccount' && step.state === 'error',
    },
  ];

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.DEPOSIT })}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <$Content>
        {stepItems.map((stepItem) => (
          <$StepItemContainer key={stepItem.step}>
            <$StepItem>
              <$Icon>
                {stepItem.showStepNumber && <$StepNumber>{stepItem.step}</$StepNumber>}
                {stepItem.isWaiting && <$LoadingSpinner />}
                {stepItem.isSuccess && <$GreenCheckCircle />}
                {stepItem.isError && <$WarningIcon iconName={IconName.Warning} />}
              </$Icon>
              <div>
                <$Title>{stepItem.title}</$Title>
                <$Description>{stepItem.description}</$Description>
              </div>
            </$StepItem>
            {/* 상하 아이콘 사이에 세로 줄 생성 */}
            {stepItem.step < stepItems.length && <$VerticalLine />}
          </$StepItemContainer>
        ))}

        <$Button
          action={step.state === 'success' ? ButtonAction.Primary : ButtonAction.Secondary}
          type={ButtonType.Button}
          disabled={step.state === 'waiting'}
          onClick={step.state === 'error' ? onRetry : onClose}
        >
          {step.state === 'error'
            ? 'Try Again'
            : step.state === 'success'
            ? 'Done'
            : 'Waiting for Deposit'}
        </$Button>
      </$Content>
    </Dialog>
  );
};

const $Content = styled.div`
  ${layoutMixins.column}
  margin-top: 0.5rem;
`;

const $Icon = styled.div`
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
`;

const $StepItemContainer = styled.div`
  ${layoutMixins.column}
`;

const $StepItem = styled.div`
  ${layoutMixins.row}
  align-items: start;
  gap: 1rem;
`;

const $GreenCheckCircle = styled(GreenCheckCircle)`
  --icon-size: 2rem;
`;

const $WarningIcon = styled(Icon)`
  color: var(--color-warning);
  font-size: 2rem;
`;

const $LoadingSpinner = styled(LoadingSpinner)`
  --spinner-width: 2rem;
`;

const $StepNumber = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: var(--color-layer-5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-2);
  flex-shrink: 0;
`;

const $Title = styled.h3`
  font: var(--font-small-bold);
  color: var(--color-text-2);
  padding-top: 6px;
`;

const $Description = styled(Description)`
  margin-top: 0.5rem;
  color: var(--color-text-0);
  font: var(--font-base-book);
`;

const $VerticalLine = styled.div`
  height: 2rem;
  width: 2px;
  background-color: var(--color-border);
  margin-left: 1rem;
  margin-bottom: 0.5rem;
  margin-top: -0.5rem;
`;

const $Button = styled(Button)`
  margin-top: 2rem;
`;
