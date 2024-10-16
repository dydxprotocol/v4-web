import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT } from '@dydxprotocol/v4-client-js';
import { Asset } from '@skip-go/client';
import { parseUnits } from 'ethers';
import type { NumberFormatValues } from 'react-number-format';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { AutoSweepConfig } from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonSize } from '@/constants/buttons';
import { isTokenCctp } from '@/constants/cctp';
import { getNobleChainId, getSolanaChainId, GRAZ_CHAINS } from '@/constants/graz';
import { STRING_KEYS } from '@/constants/localization';
import { TransferNotificationTypes } from '@/constants/notifications';
import { NumberSign, USD_DECIMALS } from '@/constants/numbers';
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
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { FormMaxInputToggleButton } from '@/components/FormMaxInputToggleButton';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { WithTooltip } from '@/components/WithTooltip';

import { getSubaccount } from '@/state/accountSelectors';
import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getTransferInputs } from '@/state/inputsSelectors';

import { isValidAddress } from '@/lib/addressUtils';
import { track } from '@/lib/analytics/analytics';
import { dd } from '@/lib/analytics/datadog';
import { MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';

import { NetworkSelectMenu } from './NetworkSelectMenu';
import { TokenSelectMenu } from './TokenSelectMenu';
import { useValidation } from './useValidation';

const DUMMY_TX_HASH = 'withdraw_dummy_tx_hash';

export const WithdrawForm = () => {
  const stringGetter = useStringGetter();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const { dydxAddress, sourceAccount, localDydxWallet, localNobleWallet } = useAccounts();
  const { freeCollateral } = useAppSelector(getSubaccount, shallowEqual) ?? {};

  // TODO: https://linear.app/dydx/issue/OTE-867/coinbase-withdrawals
  const { exchange } = useAppSelector(getTransferInputs, shallowEqual) ?? {};

  // User input
  const { usdcDenom, usdcDecimals } = useTokenConfigs();

  const {
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
    assetsForSelectedChain,
    chainsForNetwork,
  } = useTransfers();
  const { skipClient } = useSkipClient();

  const isCctp = isTokenCctp(toToken);
  const [slippage, setSlippage] = useState(isCctp ? 0 : 0.01); // 0.1% slippage
  const isValidDestinationAddress = useMemo(() => {
    const grazChainPrefix =
      GRAZ_CHAINS.find((chain) => chain.chainId === toChainId)?.bech32Config.bech32PrefixAccAddr ??
      '';
    const prefix = exchange ? 'noble' : grazChainPrefix;
    return isValidAddress({
      address: toAddress,
      network: toChainId === getSolanaChainId() ? 'solana' : prefix ? 'cosmos' : 'evm',
      prefix,
    });
  }, [exchange, toAddress, toChainId]);

  const { addOrUpdateTransferNotification } = useLocalNotifications();

  const freeCollateralBN = useMemo(() => MustBigNumber(freeCollateral?.current), [freeCollateral]);

  // Set default values for withdraw from
  // TODO: https://linear.app/dydx/issue/OTE-875/calculate-default-withdrawal-address-for-keplr
  // if wallet type is cosmos (keplr), change toAddress based on the chainid
  // B/C cosmos handles multiple chains and each have their own address
  useEffect(() => {
    setTransferType(TransferType.Withdraw);
    setFromChainId(selectedDydxChainId);
    setFromAddress(dydxAddress);
    setFromTokenDenom(usdcDenom);
    setToAddress(sourceAccount.address);
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
  ]);

  useEffect(() => {
    setToChainId(defaultChainId);
  }, [defaultChainId, setToChainId]);

  useEffect(() => {
    setToTokenDenom(defaultTokenDenom);
  }, [defaultTokenDenom, setToTokenDenom]);

  const { screenAddresses } = useDydxClient();
  const nobleChainId = getNobleChainId();

  const onSubmitComplete = useCallback(
    (txHash: string | undefined, notificationId: string) => {
      if (!txHash || !fromChainId || !toChainId) {
        throw new Error('No transaction hash returned');
      }
      setAmount('');

      const notificationParams = {
        id: notificationId,
        txHash,
        type: TransferNotificationTypes.Withdrawal,
        toChainId,
        fromChainId,
        toAmount: Number(debouncedAmount),
        triggeredAt: Date.now(),
        isCctp,
        isExchange: Boolean(exchange),
        requestId: undefined,
      };
      addOrUpdateTransferNotification({ ...notificationParams, txHash, isDummy: false });
      const transferWithdrawContext = {
        chainId: toChainId,
        tokenAddress: toToken?.denom ?? undefined,
        tokenSymbol: toToken?.symbol ?? undefined,
        slippage: slippage ?? undefined,
        gasFee: undefined,
        bridgeFee: Number(route?.usdAmountIn) - Number(route?.usdAmountOut),
        exchangeRate: undefined,
        estimatedRouteDuration: route?.estimatedRouteDurationSeconds ?? undefined,
        toAmount: Number(route?.amountOut) ?? undefined,
        toAmountMin: Number(route?.estimatedAmountOut) ?? undefined,
        txHash,
      };
      track(AnalyticsEvents.TransferWithdraw(transferWithdrawContext));
      dd.info('Transfer withdraw submitted', transferWithdrawContext);
    },
    [
      addOrUpdateTransferNotification,
      debouncedAmount,
      exchange,
      fromChainId,
      isCctp,
      route,
      setAmount,
      slippage,
      toChainId,
      toToken,
    ]
  );
  const submitCCTPWithdrawal = useCallback(
    async (notificationId: string) => {
      if (!route || !dydxAddress || !toAddress || !toChainId || !localNobleWallet?.address) return;
      AutoSweepConfig.disable_autosweep = true;
      await skipClient.executeRoute({
        route,
        getCosmosSigner: async (chainID) => {
          if (chainID === getNobleChainId()) {
            if (!localNobleWallet?.offlineSigner) {
              throw new Error('No local noblewallet offline signer. Cannot submit tx');
            }
            return localNobleWallet?.offlineSigner;
          }
          if (!localDydxWallet?.offlineSigner)
            throw new Error('No local dydxwallet offline signer. Cannot submit tx');
          return localDydxWallet?.offlineSigner;
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
        // TODO: think about building this dynamically
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
          // TODO: enable transfer notifications. This does not work yet
          if (chainID === toChainId) onSubmitComplete(txHash, notificationId);
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
      skipClient,
      debouncedAmount,
      usdcDecimals,
      selectedDydxChainId,
      localDydxWallet?.offlineSigner,
      onSubmitComplete,
    ]
  );

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      const notificationId = crypto?.randomUUID() ?? Date.now().toString();

      try {
        e.preventDefault();

        if (!txs || !debouncedAmount || !toAddress || !dydxAddress) {
          throw new Error('Invalid request payload');
        }

        setIsLoading(true);
        setError(undefined);

        const screenResults = await screenAddresses({
          addresses: [toAddress, dydxAddress],
        });

        if (screenResults?.[dydxAddress]) {
          setError(
            stringGetter({
              key: STRING_KEYS.WALLET_RESTRICTED_WITHDRAWAL_TRANSFER_ORIGINATION_ERROR_MESSAGE,
            })
          );
        } else if (screenResults?.[toAddress]) {
          setError(
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
          setError(stringGetter({ key: STRING_KEYS.RATE_LIMIT_REACHED_ERROR_MESSAGE }));
        } else {
          setError(
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
        setIsLoading(false);
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

  const onChangeAddress = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setToAddress(e.target.value);
    },
    [setToAddress]
  );

  const onChangeAmount = useCallback(
    ({ value }: NumberFormatValues) => {
      setAmount(value);
      setError(undefined);
    },
    [setAmount]
  );

  const onSetSlippage = useCallback(
    (newSlippage: number) => {
      setSlippage(newSlippage);
    },
    [setSlippage]
  );

  const onClickMax = useCallback(() => {
    setAmount(freeCollateralBN.toString());
  }, [freeCollateralBN, setAmount]);

  useEffect(() => {
    if (sourceAccount?.walletInfo?.name === WalletType.Privy) {
      // TODO: https://linear.app/dydx/issue/OTE-867/coinbase-withdrawals
      // abacusStateManager.setTransferValue({
      //   field: TransferInputField.exchange,
      //   value: 'coinbase',
      // });
    }
  }, [sourceAccount, nobleChainId, setToChainId]);

  const onSelectNetwork = useCallback(
    (chainID: string, type: 'chain' | 'exchange') => {
      if (chainID) {
        setAmount('');
        if (type === 'chain') {
          setToChainId(chainID);
        }
      }
    },
    [setAmount, setToChainId]
  );

  const onSelectToken = useCallback((asset: Asset) => {
    if (asset) {
      setToTokenDenom(asset.denom);
      setAmount('');
    }
  }, []);

  const amountInputReceipt = [
    {
      key: 'freeCollateral',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.FREE_COLLATERAL })} <Tag>USDC</Tag>
        </span>
      ),
      value: (
        <DiffOutput
          type={OutputType.Fiat}
          value={freeCollateral?.current}
          newValue={(freeCollateral?.current ?? 0) + Number(route?.usdAmountOut ?? 0)}
          sign={NumberSign.Negative}
          hasInvalidNewValue={MustBigNumber(debouncedAmount).minus(freeCollateralBN).isNegative()}
          withDiff={
            Boolean(debouncedAmount) && !debouncedAmountBN.isNaN() && !debouncedAmountBN.isZero()
          }
          tw="[--diffOutput-valueWithDiff-fontSize:1em]"
        />
      ),
    },
  ];

  const { errorMessage, alertType } = useValidation({
    isCctp,
    debouncedAmountBN,
    toAddress,
    isValidDestinationAddress,
    error,
    toChainId,
    toToken,
    freeCollateralBN,
  });

  const isDisabled =
    !!errorMessage ||
    !toToken ||
    (!toChainId && !exchange) ||
    debouncedAmountBN.isNaN() ||
    debouncedAmountBN.isZero() ||
    isLoading ||
    !isValidDestinationAddress;

  return (
    <$Form onSubmit={onSubmit}>
      <div tw="text-color-text-0">
        {stringGetter({
          key: STRING_KEYS.LOWEST_FEE_WITHDRAWALS_SKIP,
          params: {
            LOWEST_FEE_TOKENS_TOOLTIP: (
              <WithTooltip tooltip="lowest-fees">
                {stringGetter({
                  key: STRING_KEYS.SELECT_CHAINS,
                })}
              </WithTooltip>
            ),
          },
        })}
      </div>
      <NetworkSelectMenu
        selectedExchange={exchange ?? undefined}
        selectedChain={toChainId ?? undefined}
        onSelect={onSelectNetwork}
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
          toAddress && Boolean(exchange) && !isValidDestinationAddress
            ? {
                type: AlertType.Error,
                message: stringGetter({ key: STRING_KEYS.NOBLE_ADDRESS_VALIDATION }),
              }
            : undefined
        }
      />
      <TokenSelectMenu
        selectedToken={toToken ?? undefined}
        onSelectToken={onSelectToken}
        isExchange={Boolean(exchange)}
        assets={assetsForSelectedChain}
      />
      <WithDetailsReceipt
        side="bottom"
        detailItems={amountInputReceipt}
        tw="[--withReceipt-backgroundColor:--color-layer-2]"
      >
        <FormInput
          type={InputType.Number}
          decimals={USD_DECIMALS}
          onChange={onChangeAmount}
          value={debouncedAmount}
          label={stringGetter({ key: STRING_KEYS.AMOUNT })}
          slotRight={
            <FormMaxInputToggleButton
              size={ButtonSize.XSmall}
              isInputEmpty={debouncedAmount === ''}
              isLoading={isLoading}
              onPressedChange={(isPressed: boolean) => (isPressed ? onClickMax() : setAmount(''))}
            />
          }
        />
      </WithDetailsReceipt>
      {errorMessage && (
        <AlertMessage type={alertType ?? AlertType.Error} tw="inline">
          {errorMessage}
        </AlertMessage>
      )}
      <$Footer>{/* TODO [onboarding-rewrite]: add preview */}</$Footer>
    </$Form>
  );
};
const $Form = styled.form`
  ${formMixins.transfersForm}
`;

const $Footer = styled.footer`
  ${formMixins.footer}
  --stickyFooterBackdrop-outsetY: var(--dialog-content-paddingBottom);
`;
