/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Asset } from '@skip-go/client';
import { camelCase } from 'lodash';
import type { NumberFormatValues } from 'react-number-format';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { AutoSweepConfig, TransferInputField } from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonSize } from '@/constants/buttons';
import { isTokenCctp } from '@/constants/cctp';
import {
  getNeutronChainId,
  getNobleChainId,
  getOsmosisChainId,
  getSolanaChainId,
  GRAZ_CHAINS,
} from '@/constants/graz';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { TransferNotificationTypes } from '@/constants/notifications';
import {
  MAX_CCTP_TRANSFER_AMOUNT,
  MAX_PRICE_IMPACT,
  MIN_CCTP_TRANSFER_AMOUNT,
  NumberSign,
  TOKEN_DECIMALS,
  USD_DECIMALS,
} from '@/constants/numbers';
import { TransferType } from '@/constants/transfers';
import { WalletType } from '@/constants/wallets';

import { useTransfers } from '@/hooks/transfers/useTransfers';
import { useAccounts } from '@/hooks/useAccounts';
import { useDebounce } from '@/hooks/useDebounce';
import { useDydxClient } from '@/hooks/useDydxClient';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';
import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useRestrictions } from '@/hooks/useRestrictions';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';
import { useWithdrawalInfo } from '@/hooks/useWithdrawalInfo';

import { formMixins } from '@/styles/formMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { FormMaxInputToggleButton } from '@/components/FormMaxInputToggleButton';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { formatNumberOutput, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { WithTooltip } from '@/components/WithTooltip';

import { getSubaccount } from '@/state/accountSelectors';
import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getTransferInputs } from '@/state/inputsSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';

import abacusStateManager from '@/lib/abacus';
import { isValidAddress } from '@/lib/addressUtils';
import { track } from '@/lib/analytics/analytics';
import { dd } from '@/lib/analytics/datadog';
import { getRouteErrorMessageOverride } from '@/lib/errors';
import { MustBigNumber } from '@/lib/numbers';
import { skipClient } from '@/lib/skip';
import { log } from '@/lib/telemetry';
import { sleep } from '@/lib/timeUtils';
import { hashFromTx } from '@/lib/txUtils';

import { NetworkSelectMenu } from './NetworkSelectMenu';
import { TokenSelectMenu } from './TokenSelectMenu';
import { WithdrawButtonAndReceipt } from './WithdrawForm/WithdrawButtonAndReceipt';

const DUMMY_TX_HASH = 'withdraw_dummy_tx_hash';

export const WithdrawForm = () => {
  const stringGetter = useStringGetter();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const { dydxAddress, connectedWallet, localDydxWallet, localNobleWallet } = useAccounts();
  const { subaccountClient, withdraw, sendSkipWithdrawFromSubaccount } = useSubaccount();
  const { freeCollateral } = useAppSelector(getSubaccount, shallowEqual) ?? {};

  const { exchange } = useAppSelector(getTransferInputs, shallowEqual) ?? {};

  // User input
  const { usdcLabel, usdcDenom, usdcDecimals } = useTokenConfigs();
  const { usdcWithdrawalCapacity } = useWithdrawalInfo({ transferType: 'withdrawal' });

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
    amount,
    setAmount,
    setTransferType,
    route,
    toToken,
  } = useTransfers();
  const debouncedAmount = useDebounce<string>(amount, 500);
  const debouncedAmountBN = MustBigNumber(debouncedAmount);

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

  // Async Data
  const freeCollateralBN = useMemo(
    () => MustBigNumber(freeCollateral?.current),
    [freeCollateral?.current]
  );
  const isKeplr = connectedWallet?.name === WalletType.Keplr;

  useEffect(() => {
    if (isKeplr && dydxAddress) {
      setFromAddress(dydxAddress);
    }

    setTransferType(TransferType.Withdraw);
  }, [dydxAddress, connectedWallet]);

  useEffect(() => {
    setTransferType(TransferType.Withdraw);
    setFromChainId(selectedDydxChainId);
    setFromAddress(dydxAddress);
    setFromTokenDenom(usdcDenom);
    setToAddress('7AFKEVD1Q2wWTG78w7UEQcQs6Bvpt7SCRSytCgUknbnr');
  }, [
    setTransferType,
    setFromChainId,
    selectedDydxChainId,
    setFromAddress,
    dydxAddress,
    setFromTokenDenom,
    usdcDenom,
    setToAddress,
  ]);

  // maybe make shared hook `useDefaultTransferOptions`
  useEffect(() => {
    setToChainId(defaultChainId);
  }, [defaultChainId, setToChainId]);

  useEffect(() => {
    setToTokenDenom(defaultTokenDenom);
  }, [defaultTokenDenom, setToTokenDenom]);

  const { screenAddresses, getAccountBalance } = useDydxClient();
  const nobleChainId = getNobleChainId();
  const osmosisChainId = getOsmosisChainId();
  const neutronChainId = getNeutronChainId();

  const firstTx = route?.txs?.[0];
  // should always be a cosmosTx
  const isCosmosTx = firstTx && 'cosmosTx' in firstTx;
  const cosmosTxMsgs = isCosmosTx && firstTx.cosmosTx.msgs;
  const cosmosMsg = (cosmosTxMsgs || [])[0] ?? {};
  const cosmosMsgPayload = JSON.parse(cosmosMsg.msg ?? '{}');
  const cosmosMsgToSend = {
    ...cosmosMsg,
    msg: Object.keys(cosmosMsgPayload).reduce((a, b) => {
      return { ...a, [camelCase(b)]: cosmosMsgPayload[b] };
    }, {}),
  };

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
        toAmount: Number(amount),
        triggeredAt: Date.now(),
        isCctp,
        isExchange: Boolean(exchange),
        requestId: undefined,
      };
      addOrUpdateTransferNotification({ ...notificationParams, txHash, isDummy: false });
      const transferWithdrawContext = {
        chainId: toChainId,
        tokenAddress: toToken?.denom || undefined,
        tokenSymbol: toToken?.symbol || undefined,
        slippage: slippage || undefined,
        gasFee: undefined,
        bridgeFee:
          Number(route?.route.usdAmountIn) - Number(route?.route.usdAmountOut) || undefined,
        exchangeRate: undefined,
        estimatedRouteDuration: route?.route.estimatedRouteDurationSeconds || undefined,
        toAmount: Number(route?.route.amountOut) || undefined,
        toAmountMin: Number(route?.route.estimatedAmountOut) || undefined,
        txHash,
      };
      track(AnalyticsEvents.TransferWithdraw(transferWithdrawContext));
      dd.info('Transfer withdraw submitted', transferWithdrawContext);
    },
    [
      addOrUpdateTransferNotification,
      amount,
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

  /**
   * Submits a multiTx route to the dydx chain
   * TODO: maybe move this to useTransfers
   */
  const submitWithdrawToDydxChain = useCallback(
    async (notificationId: string) => {
      if (!route || !dydxAddress || !toAddress || !toChainId || !localNobleWallet?.address) return;
      await skipClient.executeRoute({
        route: route?.route,
        getCosmosSigner: async (chainID) => {
          if (chainID === 'noble-1') {
            if (!localNobleWallet?.offlineSigner) {
              throw new Error('No local noblewallet offline signer. Cannot submit tx');
            }
            return localNobleWallet?.offlineSigner;
          }
          if (!localDydxWallet?.offlineSigner)
            throw new Error('No local dydxwallet offline signer. Cannot submit tx');
          return localDydxWallet?.offlineSigner;
        },
        // TODO: think about building this dynamically
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
      selectedDydxChainId,
      localNobleWallet,
      localDydxWallet,
      onSubmitComplete,
    ]
  );

  /**
   * Polls for the withdraw to from subaccount to hit main account
   * Locks the execution thread until fresh funds have hit the main account
   * TODO: lock the thread until main account has at least as much funds as necessary to execute tx
   */
  const withdrawFromSubaccount = useCallback(async () => {
    const initialBalance = (await getAccountBalance(dydxAddress as string, usdcDenom))?.amount;
    let currentBalance = initialBalance;
    let iterCount = 0;
    await withdraw(Number(amount));
    while (currentBalance === initialBalance) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(1000);
      // we are polling so no need to parallelize the awaits
      currentBalance =
        // eslint-disable-next-line no-await-in-loop
        (await getAccountBalance(dydxAddress as string, usdcDenom))?.amount || initialBalance;
      iterCount += 1;
      if (iterCount > 20) {
        throw new Error('Balance update timed out');
      }
    }
  }, [getAccountBalance, dydxAddress, usdcDenom, withdraw, amount]);

  const submitCctpWithdraw = async (notificationId: string) => {
    if (!route || !dydxAddress || !toAddress || !toChainId) return;
    AutoSweepConfig.disable_autosweep = true;
    await withdrawFromSubaccount();
    await submitWithdrawToDydxChain(notificationId);
  };

  const submitNonCctpWithdraw = useCallback(
    async (payload: string) => {
      if (!subaccountClient) {
        return undefined;
      }

      // If the dYdX USDC balance is less than the amount to IBC transfer, the signature cannot be made,
      // so disable the balance check only for this tx.
      if (isKeplr && window.keplr) {
        window.keplr.defaultOptions = {
          sign: {
            disableBalanceCheck: true,
          },
        };
      }
      const tx = await sendSkipWithdrawFromSubaccount({
        subaccountClient,
        amount: Number(amount),
        payload,
      });

      // Reset the default options after the tx is sent.
      if (isKeplr && window.keplr) {
        window.keplr.defaultOptions = {};
      }
      return hashFromTx(tx.hash);
    },
    [subaccountClient, isKeplr, sendSkipWithdrawFromSubaccount, amount]
  );

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      const notificationId = crypto?.randomUUID() ?? Date.now().toString();

      try {
        e.preventDefault();

        if (!cosmosTxMsgs || !amount || !toAddress || !dydxAddress) {
          throw new Error('Invalid request payload');
        }

        if (isCctp && !abacusStateManager.chainTransactions.isNobleClientConnected) {
          throw new Error('Noble RPC endpoint unaccessible');
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
          if (isCctp) {
            // TODO: figure out withdrawal notifications
            await submitCctpWithdraw(notificationId);
          } else {
            const txHash = await submitNonCctpWithdraw(JSON.stringify(cosmosMsgToSend));
            if (txHash) onSubmitComplete(txHash, notificationId);
            else throw new Error('No transaction hash returned');
          }
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
        if (isCctp) {
          // if error update the dummy notification with error
          addOrUpdateTransferNotification({
            id: notificationId,
            txHash: DUMMY_TX_HASH,
            status: { error: stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG }) },
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      debouncedAmountBN,
      toChainId,
      toAddress,
      selectedDydxChainId,
      exchange,
      toToken,
      screenAddresses,
      stringGetter,
      addOrUpdateTransferNotification,
    ]
  );

  const onChangeAddress = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setToAddress(e.target.value);
  }, []);

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
    [setSlippage, debouncedAmount]
  );

  const onClickMax = useCallback(() => {
    setAmount(freeCollateralBN.toString());
  }, [freeCollateralBN, setAmount]);

  useEffect(() => {
    if (connectedWallet?.name === WalletType.Privy) {
      abacusStateManager.setTransferValue({
        field: TransferInputField.exchange,
        value: 'coinbase',
      });
    }
    if (connectedWallet?.name === WalletType.Keplr) {
      setToChainId(nobleChainId);
    }
  }, [connectedWallet, nobleChainId]);

  const onSelectNetwork = useCallback(
    (chainID: string, type: 'chain' | 'exchange') => {
      if (chainID) {
        setAmount('');
        if (type === 'chain') {
          setToChainId(chainID);
        }
      }
    },
    [neutronChainId, osmosisChainId]
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
          newValue={freeCollateral?.postOrder}
          sign={NumberSign.Negative}
          hasInvalidNewValue={MustBigNumber(amount).minus(freeCollateralBN).isNegative()}
          withDiff={Boolean(amount) && !debouncedAmountBN.isNaN() && !debouncedAmountBN.isZero()}
          tw="[--diffOutput-valueWithDiff-fontSize:1em]"
        />
      ),
    },
  ];

  const { sanctionedAddresses } = useRestrictions();
  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();
  const selectedLocale = useAppSelector(getSelectedLocale);

  const { alertType, errorMessage } = useMemo(() => {
    if (isCctp) {
      if (debouncedAmountBN.gte(MAX_CCTP_TRANSFER_AMOUNT)) {
        return {
          errorMessage: stringGetter({
            key: STRING_KEYS.MAX_CCTP_TRANSFER_LIMIT_EXCEEDED,
            params: {
              MAX_CCTP_TRANSFER_AMOUNT,
            },
          }),
        };
      }
      if (
        !debouncedAmountBN.isZero() &&
        MustBigNumber(debouncedAmountBN).lte(MIN_CCTP_TRANSFER_AMOUNT)
      ) {
        return {
          errorMessage: stringGetter({
            key: STRING_KEYS.AMOUNT_MINIMUM_ERROR,
            params: {
              NUMBER: MIN_CCTP_TRANSFER_AMOUNT,
              TOKEN: usdcLabel,
            },
          }),
        };
      }
    }
    if (error) {
      return {
        errorMessage: error,
      };
    }

    if (!toAddress) {
      return {
        alertType: AlertType.Warning,
        errorMessage: stringGetter({ key: STRING_KEYS.WITHDRAW_MUST_SPECIFY_ADDRESS }),
      };
    }

    if (sanctionedAddresses.has(toAddress))
      return {
        errorMessage: stringGetter({
          key: STRING_KEYS.TRANSFER_INVALID_DYDX_ADDRESS,
        }),
      };

    if (!isValidDestinationAddress) {
      return {
        errorMessage: stringGetter({
          key: STRING_KEYS.ENTER_VALID_ADDRESS,
        }),
      };
    }

    if (route?.code) {
      const routeErrorMessageOverride = getRouteErrorMessageOverride(route?.code, route?.message);
      const routeErrorContext = {
        transferType: TransferType.Withdraw,
        errorMessage: routeErrorMessageOverride ?? undefined,
        amount: debouncedAmount,
        chainId: toChainId ?? undefined,
        assetAddress: toToken?.denom ?? undefined,
        assetSymbol: toToken?.symbol ?? undefined,
        assetName: toToken?.name ?? undefined,
        assetId: toToken?.toString() ?? undefined,
      };
      track(AnalyticsEvents.RouteError(routeErrorContext));
      dd.info('Route error received', routeErrorContext);
      return {
        errorMessage: routeErrorMessageOverride
          ? stringGetter({
              key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
              params: { ERROR_MESSAGE: routeErrorMessageOverride },
            })
          : stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG }),
      };
    }

    if (debouncedAmountBN) {
      if (!toChainId && !exchange) {
        return {
          errorMessage: stringGetter({ key: STRING_KEYS.WITHDRAW_MUST_SPECIFY_CHAIN }),
        };
      }
      if (!toToken) {
        return {
          errorMessage: stringGetter({ key: STRING_KEYS.WITHDRAW_MUST_SPECIFY_ASSET }),
        };
      }
    }

    if (debouncedAmountBN.gt(MustBigNumber(freeCollateralBN))) {
      return {
        errorMessage: stringGetter({ key: STRING_KEYS.WITHDRAW_MORE_THAN_FREE }),
      };
    }

    if (isMainnet && MustBigNumber(summary?.aggregatePriceImpact).gte(MAX_PRICE_IMPACT)) {
      return { errorMessage: stringGetter({ key: STRING_KEYS.PRICE_IMPACT_TOO_HIGH }) };
    }

    // Withdrawal Safety
    if (usdcWithdrawalCapacity.gt(0) && debouncedAmountBN.gt(usdcWithdrawalCapacity)) {
      return {
        alertType: AlertType.Warning,
        errorMessage: stringGetter({
          key: STRING_KEYS.WITHDRAWAL_LIMIT_OVER,
          params: {
            USDC_LIMIT: (
              <span>
                {formatNumberOutput(usdcWithdrawalCapacity, OutputType.Number, {
                  decimalSeparator,
                  groupSeparator,
                  selectedLocale,
                  fractionDigits: TOKEN_DECIMALS,
                })}
                <Tag tw="ml-[0.5ch]">{usdcLabel}</Tag>
              </span>
            ),
          },
        }),
      };
    }
    return {
      errorMessage: undefined,
    };
  }, [
    error,
    routeErrors,
    routeErrorMessage,
    freeCollateralBN,
    toChainId,
    debouncedAmountBN,
    toToken,
    toAddress,
    sanctionedAddresses,
    stringGetter,
    summary,
    usdcWithdrawalCapacity,
    isValidDestinationAddress,
  ]);

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
      <div tw="spacedRow grid-cols-[1fr_1fr] gap-1">
        <FormInput
          type={InputType.Text}
          placeholder={stringGetter({ key: STRING_KEYS.ADDRESS })}
          onChange={onChangeAddress}
          value={toAddress || ''}
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
        />
        <NetworkSelectMenu
          selectedExchange={exchange || undefined}
          selectedChain={toChainId || undefined}
          onSelect={onSelectNetwork}
        />
      </div>
      {toAddress && Boolean(exchange) && !isValidDestinationAddress && (
        <AlertMessage type={AlertType.Error}>
          {stringGetter({ key: STRING_KEYS.NOBLE_ADDRESS_VALIDATION })}
        </AlertMessage>
      )}
      <TokenSelectMenu
        selectedToken={toToken || undefined}
        onSelectToken={onSelectToken}
        isExchange={Boolean(exchange)}
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
          value={amount}
          label={stringGetter({ key: STRING_KEYS.AMOUNT })}
          slotRight={
            <FormMaxInputToggleButton
              size={ButtonSize.XSmall}
              isInputEmpty={amount === ''}
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
      <$Footer>
        <WithdrawButtonAndReceipt
          isDisabled={isDisabled}
          isLoading={isLoading}
          setSlippage={onSetSlippage}
          slippage={slippage}
          withdrawToken={toToken || undefined}
        />
      </$Footer>
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
