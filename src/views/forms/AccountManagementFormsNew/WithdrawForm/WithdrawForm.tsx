import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT } from '@dydxprotocol/v4-client-js';
import { parseUnits } from 'ethers';
import type { NumberFormatValues } from 'react-number-format';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { AutoSweepConfig } from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { isTokenCctp } from '@/constants/cctp';
import { getNobleChainId, getSolanaChainId, GRAZ_CHAINS } from '@/constants/graz';
import { STRING_KEYS } from '@/constants/localization';
import { TransferNotificationTypes } from '@/constants/notifications';
import { USD_DECIMALS } from '@/constants/numbers';
import { TransferType } from '@/constants/transfers';
import { WalletType } from '@/constants/wallets';

import { useSkipClient } from '@/hooks/transfers/skipClient';
import { useTransfers } from '@/hooks/transfers/useTransfers';
import { useAccounts } from '@/hooks/useAccounts';
import { useDydxClient } from '@/hooks/useDydxClient';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { formMixins } from '@/styles/formMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { ArrowIcon } from '@/components/ArrowIcon';
import { Button } from '@/components/Button';
import { FormInput } from '@/components/FormInput';
import { FormMaxInputToggleButton } from '@/components/FormMaxInputToggleButton';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';

import { getSubaccount } from '@/state/accountSelectors';
import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { isValidAddress } from '@/lib/addressUtils';
import { track } from '@/lib/analytics/analytics';
import { dd } from '@/lib/analytics/datadog';
import { MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';

import { NetworkSelectMenu } from './NetworkSelectMenu';
import { WithdrawButtonAndReceipt } from './WithdrawButtonAndReceipt';
import { useWithdrawFormValidation } from './useWithdrawFormValidation';

const DUMMY_TX_HASH = 'withdraw_dummy_tx_hash';

export const WithdrawForm = () => {
  const stringGetter = useStringGetter();
  const [onSubmitErrorMessage, setOnSubmitErrorMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const { dydxAddress, sourceAccount, localDydxWallet, localNobleWallet } = useAccounts();
  const { freeCollateral } = useAppSelector(getSubaccount, shallowEqual) ?? {};

  // User input
  const { usdcDenom, usdcDecimals } = useTokenConfigs();

  const {
    exchangeName,
    setExchangeName,
    setFromTokenDenom,
    defaultTokenDenom,
    setToTokenDenom,
    defaultChainId,
    fromChainId,
    setFromChainId,
    toChainId,
    setToChainId,
    toAddress,
    setToAddress,
    setFromAddress,
    debouncedAmount,
    debouncedAmountBN,
    setAmount,
    setTransferType,
    route,
    txs,
    toToken,
    chainsForNetwork,
    routeLoading,
    cosmosChainAddresses,
  } = useTransfers();
  const { skipClient } = useSkipClient();

  const isCctp = isTokenCctp(toToken);
  const isValidDestinationAddress = useMemo(() => {
    const grazChainPrefix =
      GRAZ_CHAINS.find((chain) => chain.chainId === toChainId)?.bech32Config.bech32PrefixAccAddr ??
      '';
    const prefix = exchangeName ? 'noble' : grazChainPrefix;
    return isValidAddress({
      address: toAddress,
      network: toChainId === getSolanaChainId() ? 'solana' : prefix ? 'cosmos' : 'evm',
      prefix,
    });
  }, [exchangeName, toAddress, toChainId]);

  const { addOrUpdateTransferNotification } = useLocalNotifications();

  const freeCollateralBN = useMemo(() => MustBigNumber(freeCollateral?.current), [freeCollateral]);

  // TODO [onboarding-rewrite]: https://linear.app/dydx/issue/OTE-869/optimize-usetransfers
  // Stop doing this. This is pretty slow and requires multiple render cycles to set initial state
  // Set default values for withdraw form
  useEffect(() => {
    setTransferType(TransferType.Withdraw);
    setFromChainId(selectedDydxChainId);
    setFromAddress(dydxAddress);
    setFromTokenDenom(usdcDenom);
    // Cosmos chains connect to the keplr wallet, which has a unique address per chain id
    const calculatedCosmosAddress = toChainId && cosmosChainAddresses[toChainId];
    // If there is an exchange, we cannot know what to populate the address as
    setToAddress(exchangeName ? undefined : calculatedCosmosAddress ?? sourceAccount.address);
  }, [
    setTransferType,
    setFromChainId,
    selectedDydxChainId,
    setFromAddress,
    dydxAddress,
    setFromTokenDenom,
    usdcDenom,
    setToAddress,
    sourceAccount.address,
    toChainId,
    cosmosChainAddresses,
  ]);

  useEffect(() => {
    setToChainId(defaultChainId);
  }, [defaultChainId, setToChainId]);

  useEffect(() => {
    setToTokenDenom(defaultTokenDenom);
  }, [defaultTokenDenom, setToTokenDenom]);

  const { screenAddresses } = useDydxClient();
  const nobleChainId = getNobleChainId();

  const submitCCTPWithdrawal = useCallback(
    async (notificationId: string) => {
      if (
        !route ||
        !dydxAddress ||
        !toAddress ||
        !toChainId ||
        !localNobleWallet?.address ||
        !toToken
      )
        return;
      AutoSweepConfig.disable_autosweep = true;
      await skipClient.executeRoute({
        route,
        getCosmosSigner: async (chainID) => {
          if (chainID === getNobleChainId()) {
            if (!localNobleWallet.offlineSigner) {
              throw new Error('No local noblewallet offline signer. Cannot submit tx');
            }
            return localNobleWallet.offlineSigner;
          }
          if (!localDydxWallet?.offlineSigner)
            throw new Error('No local dydxwallet offline signer. Cannot submit tx');
          return localDydxWallet.offlineSigner;
        },
        beforeMsg: {
          msg: JSON.stringify({
            sender: {
              owner: dydxAddress,
              number: 0,
            },
            recipient: dydxAddress,
            assetId: 0,
            quantums: parseUnits(debouncedAmount, usdcDecimals),
          }),
          msgTypeURL: TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT,
        },
        // TODO [onboarding-rewrite]: think about building this dynamically
        // Right now we don't need to because every withdrawal follows the same cctp route
        // dydx -> noble -> final destination
        userAddresses: [
          { chainID: selectedDydxChainId, address: dydxAddress },
          {
            chainID: getNobleChainId(),
            address: localNobleWallet?.address,
          },
          {
            chainID: toChainId,
            address: toAddress,
          },
        ],
        onTransactionBroadcast: async ({ txHash, chainID }) => {
          // TODO [onboarding-rewrite]: enable transfer notifications. This does not work yet
          // https://linear.app/dydx/issue/OTE-868/transfer-status-notifications
          if (chainID === toChainId) {
            const notificationParams = {
              id: notificationId,
              txHash,
              type: TransferNotificationTypes.Withdrawal,
              toChainId,
              fromChainId,
              toAmount: Number(debouncedAmount),
              triggeredAt: Date.now(),
              isCctp,
              isExchange: Boolean(exchangeName),
              requestId: undefined,
            };
            addOrUpdateTransferNotification({ ...notificationParams, txHash, isDummy: false });
            const transferWithdrawContext = {
              chainId: toChainId,
              tokenAddress: toToken.denom,
              tokenSymbol: toToken.symbol,
              slippage: undefined,
              // TODO [onboarding-rewrite]: connect slippage
              bridgeFee:
                route.usdAmountIn && route.usdAmountOut
                  ? Number(route.usdAmountIn) - Number(route.usdAmountOut)
                  : undefined,
              exchangeRate: undefined,
              estimatedRouteDuration: route.estimatedRouteDurationSeconds,
              toAmount: route.amountOut ? Number(route.amountOut) : undefined,
              toAmountMin: route.estimatedAmountOut ? Number(route.estimatedAmountOut) : undefined,
              txHash,
            };
            track(AnalyticsEvents.TransferWithdraw(transferWithdrawContext));
            dd.info('Transfer withdraw submitted', transferWithdrawContext);
          }
        },
        onTransactionCompleted: async (chainID) => {
          // once the transaction in noble is complete, we can be confident that
          // there are no more funds in the noble wallet that need to be transferred
          if (chainID === getNobleChainId()) {
            AutoSweepConfig.disable_autosweep = false;
          }
        },
      });
    },
    [
      route,
      dydxAddress,
      toAddress,
      toChainId,
      localNobleWallet?.address,
      localNobleWallet?.offlineSigner,
      toToken,
      skipClient,
      debouncedAmount,
      usdcDecimals,
      selectedDydxChainId,
      localDydxWallet?.offlineSigner,
      fromChainId,
      isCctp,
      exchangeName,
      addOrUpdateTransferNotification,
    ]
  );

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      const notificationId = crypto.randomUUID();

      try {
        e.preventDefault();

        if (!txs || !debouncedAmount || !toAddress || !dydxAddress) {
          throw new Error('Invalid request payload');
        }

        setIsSubmitting(true);
        setOnSubmitErrorMessage(undefined);

        const screenResults = await screenAddresses({
          addresses: [toAddress, dydxAddress],
        });

        if (screenResults?.[dydxAddress]) {
          setOnSubmitErrorMessage(
            stringGetter({
              key: STRING_KEYS.WALLET_RESTRICTED_WITHDRAWAL_TRANSFER_ORIGINATION_ERROR_MESSAGE,
            })
          );
        } else if (screenResults?.[toAddress]) {
          setOnSubmitErrorMessage(
            stringGetter({
              key: STRING_KEYS.WALLET_RESTRICTED_WITHDRAWAL_TRANSFER_DESTINATION_ERROR_MESSAGE,
            })
          );
        } else {
          if (!isCctp) {
            throw new Error('Only cctp routes are eligible for withdrawal');
          }
          await submitCCTPWithdrawal(notificationId);
        }
      } catch (err) {
        log('WithdrawForm/onSubmit', err);
        if (err?.code === 429) {
          setOnSubmitErrorMessage(
            stringGetter({ key: STRING_KEYS.RATE_LIMIT_REACHED_ERROR_MESSAGE })
          );
        } else {
          setOnSubmitErrorMessage(
            err.message
              ? stringGetter({
                  key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
                  params: {
                    ERROR_MESSAGE: err.message || stringGetter({ key: STRING_KEYS.UNKNOWN_ERROR }),
                  },
                })
              : stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG })
          );
        }
        // if error update dummy notification with error
        addOrUpdateTransferNotification({
          id: notificationId,
          txHash: DUMMY_TX_HASH,
          status: { error: stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG }) },
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      txs,
      debouncedAmount,
      toAddress,
      dydxAddress,
      screenAddresses,
      stringGetter,
      isCctp,
      submitCCTPWithdrawal,
      addOrUpdateTransferNotification,
    ]
  );

  const onChangeAddress = (e: ChangeEvent<HTMLInputElement>) => {
    setToAddress(e.target.value);
  };

  const onChangeAmount = ({ value }: NumberFormatValues) => {
    setAmount(value);
    setOnSubmitErrorMessage(undefined);
  };

  const onClickMax = () => {
    setAmount(freeCollateralBN.toString());
  };

  useEffect(() => {
    if (sourceAccount?.walletInfo?.name === WalletType.Privy) {
      // TODO [onboarding-rewrite]: https://linear.app/dydx/issue/OTE-867/coinbase-withdrawals
      // abacusStateManager.setTransferValue({
      //   field: TransferInputField.exchange,
      //   value: 'coinbase',
      // });
    }
  }, [sourceAccount, nobleChainId, setToChainId]);

  const onSelectNetwork = useCallback(
    (chainID: string) => {
      setAmount('');
      setToChainId(chainID);
      setExchangeName(undefined);
    },
    [setAmount, setToChainId]
  );

  const { errorMessage, alertType } = useWithdrawFormValidation({
    isCctp,
    debouncedAmountBN,
    toAddress,
    isValidDestinationAddress,
    onSubmitErrorMessage,
    toChainId,
    toToken,
    freeCollateralBN,
  });

  const onSelectExchange = useCallback(
    (_exchangeName: string) => {
      setAmount('');
      setToChainId(undefined);
      setExchangeName(_exchangeName);
    },
    [setAmount, setToChainId, setExchangeName]
  );

  const isDisabled =
    !!errorMessage ||
    !toToken ||
    (!toChainId && !exchangeName) ||
    debouncedAmountBN.isNaN() ||
    debouncedAmountBN.isZero() ||
    isSubmitting ||
    !isValidDestinationAddress;

  const [isPreviewing, setIsPreviewing] = useState(false);
  if (isPreviewing) {
    return (
      <$Form onSubmit={onSubmit}>
        <div tw="text-color-text-0">
          {/* TODO [onboarding-rewrite]: localize */}
          Make sure everything looks correct with your withdrawal before confirming
        </div>
        <WithdrawButtonAndReceipt
          withdrawToken={toToken}
          route={route}
          isDisabled={isDisabled}
          isLoading={isSubmitting}
        />

        <button type="button" onClick={() => setIsPreviewing(false)}>
          Go Back
        </button>
      </$Form>
    );
  }

  return (
    <$Form>
      <NetworkSelectMenu
        selectedExchange={exchangeName ?? undefined}
        selectedChain={toChainId ?? undefined}
        onSelectNetwork={onSelectNetwork}
        onSelectExchange={onSelectExchange}
        chains={chainsForNetwork}
      />
      <FormInput
        type={InputType.Text}
        placeholder={stringGetter({ key: STRING_KEYS.ADDRESS })}
        onChange={onChangeAddress}
        value={toAddress ?? ''}
        label={
          <span>
            {stringGetter({ key: STRING_KEYS.DESTINATION })}{' '}
            {isValidDestinationAddress ? (
              <Icon
                iconName={IconName.Check}
                tw="mx-[1ch] my-0 text-[0.625rem] text-color-success"
              />
            ) : null}
          </span>
        }
        validationConfig={
          toAddress && !!exchangeName && !isValidDestinationAddress
            ? {
                type: AlertType.Error,
                message: stringGetter({ key: STRING_KEYS.NOBLE_ADDRESS_VALIDATION }),
              }
            : undefined
        }
        slotRight={
          <FormMaxInputToggleButton
            size={ButtonSize.XSmall}
            isInputEmpty={false}
            isLoading={isSubmitting}
            onPressedChange={() => setToAddress('')}
          />
        }
      />
      <FormInput
        type={InputType.Number}
        decimals={USD_DECIMALS}
        onChange={onChangeAmount}
        value={debouncedAmount}
        label={
          <div tw="flex">
            <div>{stringGetter({ key: STRING_KEYS.AMOUNT })}</div>
            <div tw="ml-0.25 mr-0.25"> • </div>
            <div>{freeCollateral?.current?.toFixed(2)} USDC Held</div>
          </div>
        }
        slotRight={
          <FormMaxInputToggleButton
            size={ButtonSize.XSmall}
            isInputEmpty={debouncedAmount === ''}
            isLoading={isSubmitting}
            onPressedChange={(isPressed: boolean) => (isPressed ? onClickMax() : setAmount(''))}
          />
        }
      />
      <ArrowContainer tw="z-1 mx-auto -mb-1.25 -mt-1.25 flex h-1.5 w-1.5 items-center justify-center rounded-0.25 border-color-layer-7 bg-color-layer-4">
        <ArrowIcon direction="down" color="--color-layer-8" />
      </ArrowContainer>
      <FormInput
        type={InputType.Number}
        decimals={USD_DECIMALS}
        onChange={onChangeAmount}
        value={route?.usdAmountOut ?? 0}
        label={stringGetter({ key: STRING_KEYS.EXPECTED_AMOUNT_RECEIVED })}
        disabled
        backgroundColorOverride="var(--color-layer-2)"
      />
      {errorMessage && (
        <AlertMessage type={alertType ?? AlertType.Error} tw="inline">
          {errorMessage}
        </AlertMessage>
      )}
      <div tw="grid">
        <Button
          action={ButtonAction.Primary}
          state={{
            isDisabled,
            isLoading: routeLoading || isSubmitting,
          }}
          onClick={() => setIsPreviewing(true)}
        >
          Preview
        </Button>
      </div>
    </$Form>
  );
};
const $Form = styled.form`
  ${formMixins.transfersForm}
`;

const ArrowContainer = styled.div`
  border: solid var(--border-width) var(--color-layer-6);
  background-color: var(--color-layer-4);
  justify-content: center;
  z-index: 1;
  margin-bottom: -1.25;
  margin-top: -1.25;
  display: flex;
  width: 1.5;
`;
