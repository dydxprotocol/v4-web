import { useMemo, useRef, useState } from 'react';

import { logBonsaiError } from '@/bonsai/logs';
import { formatUnits } from 'viem';

import { AMOUNT_RESERVED_FOR_GAS_USDC } from '@/constants/account';
import { AlertType } from '@/constants/alerts';
import { ButtonAction } from '@/constants/buttons';
import { DialogProps, InjectiveDepositDialogProps } from '@/constants/dialogs';
import { getInjectiveChainId } from '@/constants/graz';
import { STRING_KEYS } from '@/constants/localization';
import { timeUnits } from '@/constants/time';
import { IS_GAS_SPONSORSHIP_ENABLED } from '@/constants/transfers';

import { useSkipClient } from '@/hooks/transfers/skipClient';
import { useInjectiveBalances } from '@/hooks/transfers/useInjectiveBalances';
import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useAccounts } from '@/hooks/useAccounts';
import { useEndpointsConfig } from '@/hooks/useEndpointsConfig';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Output, OutputType } from '@/components/Output';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';
import { selectIsKeplrConnected } from '@/state/walletSelectors';

import { GasSponsorshipGrant, requestGasSponsorship } from '@/lib/gasSponsorship';
import { getInjectiveIbcTransferFee, sendInjectiveUsdcToDydx } from '@/lib/injectiveTx';
import { MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';
import { sleep } from '@/lib/timeUtils';

import { DepositSteps } from './DepositDialog2/DepositForm/DepositSteps';

type StepResult = { success: true } | { success: false; errorMessage: string };

type InjectiveDepositStep = {
  type: 'ibc-transfer' | 'subaccount';
  executeStep: () => Promise<StepResult>;
};

const INJ_DECIMALS = 18;
const AUTO_DEPOSIT_POLL_INTERVAL = 3 * timeUnits.second;
const AUTO_DEPOSIT_TIMEOUT = 2 * timeUnits.minute;

/**
 * Completes a deposit whose USDC has arrived on Injective: sends it to the dYdX chain over IBC,
 * then into the trading account.
 */
export const InjectiveDepositDialog = ({ setIsOpen }: DialogProps<InjectiveDepositDialogProps>) => {
  const stringGetter = useStringGetter();
  const { skipClient } = useSkipClient();
  const { indexer, injectiveValidator } = useEndpointsConfig();
  const { dydxAddress, localInjectiveWallet } = useAccounts();
  const { deposit } = useSubaccount();
  const isKeplr = useAppSelector(selectIsKeplrConnected);

  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const { usdcDenom } = useTokenConfigs();
  const { refetchQuery: refetchDydxUsdcBalance } = useAccountBalance({
    chainId: selectedDydxChainId,
    isCosmosChain: true,
    addressOrDenom: usdcDenom,
  });

  const {
    injectiveAddress,
    usdc,
    usdcAmount,
    hasPendingInjectiveDeposit,
    isLoading: isLoadingBalances,
    refetch: refetchInjectiveBalances,
  } = useInjectiveBalances();

  const [depositAmount, setDepositAmount] = useState<string>();
  const [currentStep, setCurrentStep] = useState(-1);
  const [currentStepError, setCurrentStepError] = useState<string>();
  const [isRunning, setIsRunning] = useState(false);

  const ibcTxHashRef = useRef<string>();

  const steps: InjectiveDepositStep[] = useMemo(
    () => [
      {
        type: 'ibc-transfer',
        executeStep: async () => {
          try {
            if (!ibcTxHashRef.current) {
              if (!injectiveAddress || !dydxAddress || !localInjectiveWallet?.offlineSigner) {
                return { success: false, errorMessage: 'Wallet not connected' };
              }

              const { data: balances } = await refetchInjectiveBalances();
              if (!balances || balances.usdc === BigInt(0)) {
                return { success: false, errorMessage: 'No USDC found on Injective' };
              }

              let sponsorship: GasSponsorshipGrant | undefined;
              const fee = getInjectiveIbcTransferFee();
              if (balances.inj < fee) {
                const notEnoughInjMessage = `Not enough INJ to pay for gas. Send at least ${formatUnits(fee, INJ_DECIMALS)} INJ to ${injectiveAddress}.`;
                if (!IS_GAS_SPONSORSHIP_ENABLED) {
                  return { success: false, errorMessage: notEnoughInjMessage };
                }

                try {
                  sponsorship = await requestGasSponsorship({
                    indexerUrl: indexer.api,
                    dydxAddress,
                    injectiveAddress,
                  });
                } catch (error) {
                  logBonsaiError('InjectiveDepositDialog/gasSponsorship', error);
                  return { success: false, errorMessage: notEnoughInjMessage };
                }
              }

              ibcTxHashRef.current = await sendInjectiveUsdcToDydx({
                rpcUrl: injectiveValidator,
                signer: localInjectiveWallet.offlineSigner,
                injectiveAddress,
                dydxAddress,
                amount: balances.usdc.toString(),
                // Fees are paid from the sponsor's allowance, priced to fit within it
                feeGranter: sponsorship?.granter,
                gasLimit: sponsorship && BigInt(sponsorship.gasLimit),
                gasPrice: sponsorship && BigInt(sponsorship.gasPrice),
              });
            }

            await skipClient.waitForTransaction({
              chainId: getInjectiveChainId(),
              txHash: ibcTxHashRef.current,
            });

            refetchInjectiveBalances();
            return { success: true };
          } catch (error) {
            log('InjectiveDepositDialog/ibcTransfer', error);
            return { success: false, errorMessage: error.message };
          }
        },
      },
      {
        type: 'subaccount',
        executeStep: async () => {
          try {
            const deadline = Date.now() + AUTO_DEPOSIT_TIMEOUT;
            while (Date.now() < deadline) {
              // eslint-disable-next-line no-await-in-loop
              const { data } = await refetchDydxUsdcBalance();
              const amountToDeposit = MustBigNumber(data as string | undefined).minus(
                AMOUNT_RESERVED_FOR_GAS_USDC
              );
              if (amountToDeposit.lt(0.01)) return { success: true };

              if (isKeplr) {
                // eslint-disable-next-line no-await-in-loop
                await deposit(amountToDeposit.toNumber());
                return { success: true };
              }

              // eslint-disable-next-line no-await-in-loop
              await sleep(AUTO_DEPOSIT_POLL_INTERVAL);
            }

            return {
              success: false,
              errorMessage:
                'Your funds are on dYdX and will be added to your trading account shortly.',
            };
          } catch (error) {
            log('InjectiveDepositDialog/depositToSubaccount', error);
            return { success: false, errorMessage: error.message };
          }
        },
      },
    ],
    [
      deposit,
      dydxAddress,
      indexer.api,
      injectiveAddress,
      injectiveValidator,
      isKeplr,
      localInjectiveWallet,
      refetchDydxUsdcBalance,
      refetchInjectiveBalances,
      skipClient,
    ]
  );

  const runSteps = async (fromStep: number) => {
    setIsRunning(true);
    setCurrentStepError(undefined);
    for (let i = fromStep; i < steps.length; i += 1) {
      setCurrentStep(i);
      // eslint-disable-next-line no-await-in-loop
      const result = await steps[i]!.executeStep();
      if (!result.success) {
        setCurrentStepError(result.errorMessage);
        setIsRunning(false);
        return;
      }
    }
    setCurrentStep(steps.length);
    setIsRunning(false);
  };

  const onStart = () => {
    setDepositAmount(usdcAmount);
    runSteps(0);
  };

  const hasStarted = currentStep >= 0;
  const isComplete = currentStep === steps.length;
  const displayAmount = depositAmount ?? usdcAmount;

  return (
    <Dialog isOpen setIsOpen={setIsOpen} title="Complete your deposit">
      <div tw="flex flex-col gap-1">
        {!hasStarted && !isLoadingBalances && !hasPendingInjectiveDeposit ? (
          <AlertMessage type={AlertType.Info}>No USDC is waiting on Injective.</AlertMessage>
        ) : (
          <>
            <div tw="text-color-text-0">
              {isComplete
                ? 'Your deposit is complete.'
                : 'Your USDC has arrived on Injective. Send it to dYdX to finish your deposit.'}
            </div>

            <div tw="flex items-center justify-between">
              <div tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.AMOUNT })}</div>
              <Output
                type={OutputType.Fiat}
                value={displayAmount}
                isLoading={displayAmount == null && usdc == null}
                slotRight=" USDC"
              />
            </div>

            <DepositSteps
              steps={steps}
              currentStep={currentStep}
              currentStepError={currentStepError}
              onRetry={() => runSteps(currentStep)}
            />
          </>
        )}

        {isComplete || (!hasStarted && !hasPendingInjectiveDeposit && !isLoadingBalances) ? (
          <Button action={ButtonAction.Primary} onClick={() => setIsOpen(false)}>
            {stringGetter({ key: STRING_KEYS.CLOSE })}
          </Button>
        ) : (
          !hasStarted && (
            <Button
              action={ButtonAction.Primary}
              onClick={onStart}
              state={{ isLoading: isLoadingBalances || isRunning }}
            >
              {stringGetter({ key: STRING_KEYS.CONTINUE })}
            </Button>
          )
        )}
      </div>
    </Dialog>
  );
};
