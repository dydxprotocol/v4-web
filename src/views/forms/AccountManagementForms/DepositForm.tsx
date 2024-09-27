/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { calculateFee, GasPrice, MsgTransferEncodeObject } from '@cosmjs/stargate';
import { GAS_MULTIPLIER } from '@dydxprotocol/v4-client-js';
import { useAccount as useAccountGraz, useStargateSigningClient } from 'graz';
import { type NumberFormatValues } from 'react-number-format';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';
import { Abi, parseUnits } from 'viem';

import erc20 from '@/abi/erc20.json';
import erc20_usdt from '@/abi/erc20_usdt.json';
import { TransferInputField, TransferInputTokenResource, TransferType } from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import {
  AnalyticsEventPayloads,
  AnalyticsEvents,
  DEFAULT_TRANSACTION_MEMO,
} from '@/constants/analytics';
import { ButtonSize } from '@/constants/buttons';
import { NEUTRON_USDC_IBC_DENOM, OSMO_USDC_IBC_DENOM } from '@/constants/denoms';
import { DialogTypes } from '@/constants/dialogs';
import {
  getNeutronChainId,
  getNobleChainId,
  getOsmosisChainId,
  NEUTRON_GAS_PRICE,
  NOBLE_GAS_PRICE,
  OSMO_GAS_PRICE,
  SUPPORTED_COSMOS_CHAINS,
} from '@/constants/graz';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { TransferNotificationTypes } from '@/constants/notifications';
import {
  DEFAULT_GAS_LIMIT,
  MAX_CCTP_TRANSFER_AMOUNT,
  MAX_PRICE_IMPACT,
  MIN_CCTP_TRANSFER_AMOUNT,
  NumberSign,
} from '@/constants/numbers';
import { AppRoute, BASE_ROUTE } from '@/constants/routes';
import { ConnectorType, type EvmAddress, WalletType } from '@/constants/wallets';

import { CHAIN_DEFAULT_TOKEN_ADDRESS, useAccountBalance } from '@/hooks/useAccountBalance';
import { useAccounts } from '@/hooks/useAccounts';
import { useDebounce } from '@/hooks/useDebounce';
import { useDydxClient } from '@/hooks/useDydxClient';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { formMixins } from '@/styles/formMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { FormMaxInputToggleButton } from '@/components/FormMaxInputToggleButton';
import { InputType } from '@/components/Input';
import { Link } from '@/components/Link';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { WithTooltip } from '@/components/WithTooltip';

import { getOnboardingGuards } from '@/state/accountSelectors';
import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { forceOpenDialog } from '@/state/dialogs';
import { getTransferInputs } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { track } from '@/lib/analytics/analytics';
import { dd } from '@/lib/analytics/datadog';
import { MustBigNumber } from '@/lib/numbers';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/skip';
import { log } from '@/lib/telemetry';
import { sleep } from '@/lib/timeUtils';
import { parseWalletError } from '@/lib/wallet';

import { CoinbaseDeposit } from '../CoinbaseDeposit';
import { DepositButtonAndReceipt } from './DepositForm/DepositButtonAndReceipt';
import { SourceSelectMenu } from './SourceSelectMenu';
import { TokenSelectMenu } from './TokenSelectMenu';

type DepositFormProps = {
  onDeposit?: (event?: AnalyticsEventPayloads['TransferDeposit']) => void;
  onError?: () => void;
};

enum DepositSteps {
  Initial = 'initial',
  Approval = 'approval',
  Confirm = 'confirm',

  KEPLR_APPROVAL = 'keplr_approval',
}

export const DepositForm = ({ onDeposit, onError }: DepositFormProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [depositStep, setDepositStep] = useState<DepositSteps>(DepositSteps.Initial);
  const [requireUserActionInWallet, setRequireUserActionInWallet] = useState(false);
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const { hasAcknowledgedTerms } = useAppSelector(getOnboardingGuards);

  const {
    dydxAddress,
    evmAddress,
    solAddress,
    signerWagmi,
    publicClientWagmi,
    nobleAddress,
    connectedWallet,
    saveHasAcknowledgedTerms,
  } = useAccounts();
  const { getAccountBalance } = useDydxClient();
  const { depositCurrentBalance } = useSubaccount();

  const { addOrUpdateTransferNotification } = useLocalNotifications();
  const { signTransaction: signTransactionPhantom } = usePhantomWallet();

  const isKeplrWallet = connectedWallet?.name === WalletType.Keplr;

  const {
    requestPayload,
    token,
    exchange,
    chain: chainIdStr,
    resources,
    summary,
    errors: routeErrors,
    errorMessage: routeErrorMessage,
    isCctp,
  } = useAppSelector(getTransferInputs, shallowEqual) ?? {};
  // todo are these guaranteed to be base 10?
  /* eslint-disable radix */
  let chainId: number | string | undefined;
  if (chainIdStr) chainId = chainIdStr;
  if (chainIdStr && chainIdStr.startsWith('solana')) chainId = chainIdStr;
  if (chainIdStr && !Number.isNaN(parseInt(chainIdStr))) chainId = parseInt(chainIdStr);
  /* eslint-enable radix */

  const nobleChainId = getNobleChainId();
  const osmosisChainId = getOsmosisChainId();
  const neutronChainId = getNeutronChainId();

  // User inputs
  const sourceToken = useMemo(() => {
    return token ? resources?.tokenResources?.get(token) : undefined;
  }, [token, resources]);

  const sourceChain = useMemo(
    () => (chainIdStr ? resources?.chainResources?.get(chainIdStr) : undefined),
    [chainIdStr, resources]
  );

  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState(isCctp ? 0 : 0.01); // 1% slippage
  const debouncedAmount = useDebounce<string>(fromAmount, 500);

  const { usdcLabel, usdcDenom } = useTokenConfigs();

  const { data: accounts } = useAccountGraz({
    chainId: SUPPORTED_COSMOS_CHAINS,
    multiChain: true,
  });
  const { data: signingClient } = useStargateSigningClient({
    chainId: SUPPORTED_COSMOS_CHAINS,
    multiChain: true,
  });

  // Async Data
  const { balance } = useAccountBalance({
    addressOrDenom: sourceToken?.address || CHAIN_DEFAULT_TOKEN_ADDRESS,
    chainId,
    isCosmosChain: isKeplrWallet,
  });
  // BN
  const debouncedAmountBN = MustBigNumber(debouncedAmount);
  const balanceBN = MustBigNumber(balance);

  useEffect(() => {
    setSlippage(isCctp || isKeplrWallet ? 0 : 0.01);
  }, [isCctp, isKeplrWallet]);

  useEffect(() => {
    const hasInvalidInput =
      debouncedAmountBN.isNaN() || debouncedAmountBN.lte(0) || debouncedAmountBN.gt(balanceBN);

    abacusStateManager.setTransferValue({
      value: hasInvalidInput ? 0 : debouncedAmount,
      field: TransferInputField.size,
    });

    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAmountBN.toNumber()]);

  useEffect(() => {
    if (dydxAddress) {
      // TODO: this is for fixing a race condition where the sourceAddress is not set in time.
      // worth investigating a better fix on abacus
      if (connectedWallet?.name === WalletType.Keplr && nobleAddress) {
        abacusStateManager.setTransfersSourceAddress(nobleAddress);
        // put sol first. some users with phantom wallet have previously connected with evm
        // so they will have both sol and evm addresses. we assume the phantom wallet
        // is connected with a sol address, not evm.
      } else if (solAddress) {
        abacusStateManager.setTransfersSourceAddress(solAddress);
      } else if (evmAddress) {
        abacusStateManager.setTransfersSourceAddress(evmAddress);
      }
      abacusStateManager.setTransferValue({
        field: TransferInputField.type,
        value: TransferType.deposit.rawValue,
      });
    }
    return () => {
      abacusStateManager.resetInputState();
    };
  }, [dydxAddress, evmAddress, nobleAddress, connectedWallet, solAddress]);

  useEffect(() => {
    if (error) onError?.();
  }, [error]);

  useEffect(() => {
    if (!connectedWallet) return;

    if (connectedWallet.connectorType === ConnectorType.Privy) {
      abacusStateManager.setTransferValue({
        field: TransferInputField.exchange,
        value: 'coinbase',
      });
    }
    if (connectedWallet.connectorType === ConnectorType.PhantomSolana) {
      abacusStateManager.setTransferValue({
        field: TransferInputField.chain,
        value: 'solana',
      });
    }
    if (connectedWallet.connectorType === ConnectorType.Cosmos) {
      abacusStateManager.setTransferValue({
        field: TransferInputField.chain,
        value: nobleChainId,
      });
    }
  }, [nobleAddress, nobleChainId, connectedWallet]);

  const onSelectNetwork = useCallback(
    (name: string, type: 'chain' | 'exchange') => {
      if (name) {
        abacusStateManager.clearTransferInputValues();
        setFromAmount('');
        if (type === 'chain') {
          abacusStateManager.setTransferValue({
            field: TransferInputField.chain,
            value: name,
          });
          if (name === osmosisChainId) {
            abacusStateManager.setTransferValue({
              field: TransferInputField.token,
              value: OSMO_USDC_IBC_DENOM,
            });
          }
          if (name === neutronChainId) {
            abacusStateManager.setTransferValue({
              field: TransferInputField.token,
              value: NEUTRON_USDC_IBC_DENOM,
            });
          }
        } else {
          abacusStateManager.setTransferValue({
            field: TransferInputField.exchange,
            value: name,
          });
        }
      }
    },
    [neutronChainId, osmosisChainId]
  );

  const onSelectToken = useCallback((selectedToken: TransferInputTokenResource) => {
    if (selectedToken) {
      abacusStateManager.clearTransferInputValues();
      abacusStateManager.setTransferValue({
        field: TransferInputField.token,
        value: selectedToken.address,
      });
      setFromAmount('');
    }
  }, []);

  const onChangeAmount = useCallback(
    ({ value }: NumberFormatValues) => {
      setFromAmount(value);
    },
    [setFromAmount]
  );

  const onSetSlippage = useCallback(
    (newSlippage: number) => {
      setSlippage(newSlippage);
      // TODO: to be implemented via abacus
    },
    [setSlippage]
  );

  const onClickMax = useCallback(() => {
    if (balance) {
      setFromAmount(balanceBN.toString());
    }
  }, [balance, balanceBN]);

  const validateTokenApproval = useCallback(async () => {
    if (!signerWagmi || !publicClientWagmi) throw new Error('Missing signer');
    if (!sourceToken?.address || !sourceToken.decimals)
      throw new Error('Missing source token address');
    if (!requestPayload?.targetAddress) throw new Error('Missing target address');
    if (!requestPayload?.value) throw new Error('Missing transaction value');
    if (sourceToken?.address === NATIVE_TOKEN_ADDRESS) return;

    const allowance = await publicClientWagmi.readContract({
      address: sourceToken.address as EvmAddress,
      abi: erc20,
      functionName: 'allowance',
      args: [evmAddress as EvmAddress, requestPayload.targetAddress as EvmAddress],
    });

    const sourceAmountBN = parseUnits(debouncedAmount, sourceToken.decimals);

    if (sourceAmountBN > (allowance as bigint)) {
      setDepositStep(DepositSteps.Approval);
      const simulateApprove = async (abi: Abi) =>
        publicClientWagmi.simulateContract({
          account: evmAddress,
          address: sourceToken.address as EvmAddress,
          abi,
          functionName: 'approve',
          args: [requestPayload.targetAddress as EvmAddress, sourceAmountBN],
        });

      let result;
      try {
        result = await simulateApprove(erc20 as Abi);
      } catch (e) {
        result = await simulateApprove(erc20_usdt as Abi);
      }

      const approveTx = await signerWagmi.writeContract(result.request);
      await publicClientWagmi.waitForTransactionReceipt({
        hash: approveTx,
      });
    }
  }, [signerWagmi, publicClientWagmi, sourceToken, requestPayload, evmAddress, debouncedAmount]);

  const waitForBalanceAndDeposit = useCallback(
    async (initialBalance: string) => {
      let currentBalance = initialBalance;
      let iterCount = 0;
      while (currentBalance === initialBalance) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(5000);
        // we are polling so no need to parallelize the awaits
        currentBalance =
          // eslint-disable-next-line no-await-in-loop
          (await getAccountBalance(dydxAddress as string, usdcDenom))?.amount || initialBalance;
        iterCount += 1;
        if (iterCount > 20) {
          throw new Error('Balance update timed out');
        }
      }
      setDepositStep(DepositSteps.KEPLR_APPROVAL);
      await depositCurrentBalance();
    },
    [getAccountBalance, dydxAddress, usdcDenom, depositCurrentBalance]
  );

  // probably better to use skip submit endpoint for this
  const onSubmitCosmos = useCallback(async () => {
    if (!chainIdStr || !SUPPORTED_COSMOS_CHAINS.includes(chainIdStr)) {
      throw new Error('chainIdStr not supported');
    }

    if (!requestPayload?.data) {
      throw new Error('Missing request payload');
    }

    const transaction = JSON.parse(requestPayload.data);

    const transferMsg: MsgTransferEncodeObject = {
      typeUrl: transaction.typeUrl,
      value: transaction.value,
    };

    const account = accounts?.[chainIdStr];
    const signerAddress = account?.bech32Address;

    if (!signerAddress) {
      throw new Error('Missing signer address');
    }

    const memo = `${DEFAULT_TRANSACTION_MEMO} | ${signerAddress}`;

    const gasEstimate = await signingClient?.[chainIdStr]?.simulate(
      signerAddress,
      [transferMsg],
      memo
    );

    const gasPrice = (() => {
      if (nobleChainId === chainIdStr) {
        return GasPrice.fromString(NOBLE_GAS_PRICE);
      }
      if (osmosisChainId === chainIdStr) {
        return GasPrice.fromString(OSMO_GAS_PRICE);
      }
      if (neutronChainId === chainIdStr) {
        return GasPrice.fromString(NEUTRON_GAS_PRICE);
      }
      return undefined;
    })();

    if (!gasEstimate || !gasPrice) {
      throw new Error('Failed to estimate gas');
    }

    const fee = calculateFee(Math.floor(gasEstimate * GAS_MULTIPLIER), gasPrice);

    const initialBalance = await getAccountBalance(dydxAddress as string, usdcDenom);

    if (!initialBalance) {
      throw new Error('Failed to get wallet balance');
    }

    setDepositStep(DepositSteps.KEPLR_APPROVAL);

    const tx = await signingClient?.[chainIdStr]?.signAndBroadcast(
      signerAddress,
      [transferMsg],
      fee,
      memo
    );

    const txHash = tx?.transactionHash;

    if (txHash) {
      const notification = {
        txHash,
        toChainId: selectedDydxChainId,
        fromChainId: chainIdStr || undefined,
        toAmount: summary?.usdcSize || undefined,
        triggeredAt: Date.now(),
        requestId: requestPayload.requestId ?? undefined,
        type: TransferNotificationTypes.Deposit,
      };
      addOrUpdateTransferNotification(notification);

      onDeposit?.({
        chainId: chainIdStr || undefined,
        tokenAddress: sourceToken?.address || undefined,
        tokenSymbol: sourceToken?.symbol || undefined,
        slippage: slippage || undefined,
        gasFee: summary?.gasFee || undefined,
        bridgeFee: summary?.bridgeFee || undefined,
        exchangeRate: summary?.exchangeRate || undefined,
        estimatedRouteDuration: summary?.estimatedRouteDurationSeconds || undefined,
        toAmount: summary?.toAmount || undefined,
        toAmountMin: summary?.toAmountMin || undefined,
      });

      abacusStateManager.clearTransferInputValues();
      setFromAmount('');

      setDepositStep(DepositSteps.Initial);

      await waitForBalanceAndDeposit(initialBalance.amount);

      addOrUpdateTransferNotification({
        ...notification,
        isSubaccountDepositCompleted: true,
      });
    }
  }, [
    requestPayload,
    signerWagmi,
    chainIdStr,
    sourceToken,
    sourceChain,
    nobleChainId,
    waitForBalanceAndDeposit,
  ]);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      const transferDepositContext = {
        chainId: chainIdStr ?? undefined,
        tokenAddress: sourceToken?.address ?? undefined,
        tokenSymbol: sourceToken?.symbol ?? undefined,
        slippage: slippage ?? undefined,
        gasFee: summary?.gasFee ?? undefined,
        bridgeFee: summary?.bridgeFee ?? undefined,
        exchangeRate: summary?.exchangeRate ?? undefined,
        estimatedRouteDuration: summary?.estimatedRouteDurationSeconds ?? undefined,
        toAmount: summary?.toAmount ?? undefined,
        toAmountMin: summary?.toAmountMin ?? undefined,
        depositCTAString,
      };
      track(AnalyticsEvents.TransferDepositFundsClick(transferDepositContext));
      dd.info('Transfer deposit click', transferDepositContext);
      try {
        e.preventDefault();
        setIsLoading(true);

        if (chainIdStr && SUPPORTED_COSMOS_CHAINS.includes(chainIdStr)) {
          await onSubmitCosmos();
          return;
        }

        if (isCctp && !abacusStateManager.chainTransactions.isNobleClientConnected) {
          throw new Error('Noble RPC endpoint unaccessible');
        }

        if (!hasAcknowledgedTerms) {
          saveHasAcknowledgedTerms(true);
        }

        let txHash: string | undefined;
        if (connectedWallet?.name === WalletType.Phantom) {
          if (!requestPayload?.data) {
            throw new Error('Missing solana request payload');
          }

          setDepositStep(DepositSteps.Confirm);
          txHash = await signTransactionPhantom(Buffer.from(requestPayload.data, 'base64'));
        } else {
          if (!signerWagmi) {
            throw new Error('Missing signer');
          }
          if (!requestPayload?.targetAddress || !requestPayload?.data || !requestPayload?.value) {
            throw new Error('Missing request payload');
          }
          await validateTokenApproval();

          const tx = {
            to: requestPayload.targetAddress as EvmAddress,
            data: requestPayload.data as EvmAddress,
            gasLimit: BigInt(requestPayload.gasLimit || DEFAULT_GAS_LIMIT),
            value: requestPayload.routeType !== 'SEND' ? BigInt(requestPayload.value) : undefined,
          };
          setDepositStep(DepositSteps.Confirm);
          txHash = await signerWagmi.sendTransaction(tx);
        }
        if (txHash) {
          addOrUpdateTransferNotification({
            txHash,
            toChainId: !isCctp ? selectedDydxChainId : nobleChainId,
            fromChainId: chainIdStr || undefined,
            toAmount: summary?.usdcSize || undefined,
            triggeredAt: Date.now(),
            isCctp,
            requestId: requestPayload.requestId ?? undefined,
            type: TransferNotificationTypes.Deposit,
          });
          abacusStateManager.clearTransferInputValues();
          setFromAmount('');
          const submittedTransferDepositContext = {
            ...transferDepositContext,
            txHash,
          };
          onDeposit?.(submittedTransferDepositContext);
          dd.info('Transfer deposit submitted', submittedTransferDepositContext);
        }
      } catch (err) {
        log('DepositForm/onSubmit', err);
        setError(err);
      } finally {
        setIsLoading(false);
        setDepositStep(DepositSteps.Initial);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      requestPayload,
      signerWagmi,
      chainIdStr,
      sourceToken,
      sourceChain,
      nobleChainId,
      signTransactionPhantom,
    ]
  );

  const amountInputReceipt = [
    {
      key: 'amount',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.AVAILABLE })}{' '}
          {sourceToken && <Tag>{sourceToken.symbol}</Tag>}
        </span>
      ),
      value: (
        <DiffOutput
          type={OutputType.Asset}
          value={balance}
          newValue={balanceBN.minus(debouncedAmountBN).toString()}
          sign={NumberSign.Negative}
          hasInvalidNewValue={balanceBN.minus(debouncedAmountBN).isNegative()}
          withDiff={
            Boolean(fromAmount && balance) &&
            !debouncedAmountBN.isNaN() &&
            !debouncedAmountBN.isZero()
          }
        />
      ),
    },
  ];

  // TODO: abstract as much as possible to a util/hook and share between WithdrawForm
  const errorMessage = useMemo(() => {
    if (isCctp) {
      if (
        !debouncedAmountBN.isZero() &&
        MustBigNumber(debouncedAmountBN).lte(MIN_CCTP_TRANSFER_AMOUNT)
      ) {
        return stringGetter({
          key: STRING_KEYS.AMOUNT_MINIMUM_ERROR,
          params: {
            NUMBER: MIN_CCTP_TRANSFER_AMOUNT,
            TOKEN: usdcLabel,
          },
        });
      }
      if (MustBigNumber(debouncedAmountBN).gte(MAX_CCTP_TRANSFER_AMOUNT)) {
        return stringGetter({
          key: STRING_KEYS.MAX_CCTP_TRANSFER_LIMIT_EXCEEDED,
          params: {
            MAX_CCTP_TRANSFER_AMOUNT,
          },
        });
      }
    }
    if (error) {
      return parseWalletError({ error, stringGetter }).message;
    }

    if (routeErrors) {
      const routeErrorContext = {
        transferType: TransferType.deposit.name,
        errorMessage: routeErrorMessage ?? undefined,
        amount: debouncedAmount,
        chainId: chainIdStr ?? undefined,
        assetAddress: sourceToken?.address ?? undefined,
        assetSymbol: sourceToken?.symbol ?? undefined,
        assetName: sourceToken?.name ?? undefined,
        assetId: sourceToken?.toString() ?? undefined,
      };
      track(AnalyticsEvents.RouteError(routeErrorContext));
      dd.info('Route error received', routeErrorContext);
      return routeErrorMessage
        ? stringGetter({
            key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
            params: { ERROR_MESSAGE: routeErrorMessage },
          })
        : stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG });
    }

    if (fromAmount) {
      if (!chainId) {
        return stringGetter({ key: STRING_KEYS.MUST_SPECIFY_CHAIN });
      }
      if (!sourceToken) {
        return stringGetter({ key: STRING_KEYS.MUST_SPECIFY_ASSET });
      }
    }

    if (MustBigNumber(fromAmount).gt(MustBigNumber(balance))) {
      return stringGetter({ key: STRING_KEYS.DEPOSIT_MORE_THAN_BALANCE });
    }

    if (isMainnet && MustBigNumber(summary?.aggregatePriceImpact).gte(MAX_PRICE_IMPACT)) {
      return stringGetter({ key: STRING_KEYS.PRICE_IMPACT_TOO_HIGH });
    }

    return undefined;
  }, [
    error,
    routeErrors,
    routeErrorMessage,
    balance,
    chainId,
    fromAmount,
    sourceToken,
    stringGetter,
    summary,
    debouncedAmountBN,
  ]);

  const depositCTAString = useMemo(() => {
    if (depositStep === DepositSteps.Approval) {
      return stringGetter({ key: STRING_KEYS.PENDING_TOKEN_APPROVAL });
    }
    if (depositStep === DepositSteps.Confirm) {
      return stringGetter({ key: STRING_KEYS.PENDING_DEPOSIT_CONFIRMATION });
    }
    if (depositStep === DepositSteps.KEPLR_APPROVAL) {
      return 'Pending approval in wallet';
    }
    return hasAcknowledgedTerms
      ? stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS })
      : stringGetter({ key: STRING_KEYS.ACKNOWLEDGE_TERMS_AND_DEPOSIT });
  }, [depositStep, stringGetter, hasAcknowledgedTerms]);

  const isDisabled =
    Boolean(errorMessage) ||
    !sourceToken ||
    !chainId ||
    debouncedAmountBN.isNaN() ||
    debouncedAmountBN.isZero();

  if (!resources) {
    return <LoadingSpace id="DepositForm" />;
  }
  return (
    <$Form onSubmit={onSubmit}>
      <div tw="text-color-text-0">
        {stringGetter({
          key: STRING_KEYS.LOWEST_FEE_DEPOSITS,
          params: {
            LOWEST_FEE_TOKENS_TOOLTIP: (
              <WithTooltip tooltip="lowest-fees-deposit">
                {stringGetter({
                  key: STRING_KEYS.SELECT_CHAINS,
                })}
              </WithTooltip>
            ),
          },
        })}
      </div>
      <SourceSelectMenu
        selectedChain={chainIdStr || undefined}
        selectedExchange={exchange || undefined}
        onSelect={onSelectNetwork}
      />
      {exchange && nobleAddress ? (
        <CoinbaseDeposit />
      ) : (
        <>
          <TokenSelectMenu selectedToken={sourceToken || undefined} onSelectToken={onSelectToken} />
          <WithDetailsReceipt
            side="bottom"
            detailItems={amountInputReceipt}
            tw="[--withReceipt-backgroundColor:--color-layer-2]"
          >
            <FormInput
              type={InputType.Number}
              onChange={onChangeAmount}
              label={stringGetter({ key: STRING_KEYS.AMOUNT })}
              value={fromAmount}
              slotRight={
                <FormMaxInputToggleButton
                  size={ButtonSize.XSmall}
                  isInputEmpty={fromAmount === ''}
                  isLoading={isLoading}
                  onPressedChange={(isPressed: boolean) =>
                    isPressed ? onClickMax() : setFromAmount('')
                  }
                />
              }
            />
          </WithDetailsReceipt>
          {errorMessage && <AlertMessage type={AlertType.Error}>{errorMessage}</AlertMessage>}
          {requireUserActionInWallet && (
            <AlertMessage type={AlertType.Warning}>
              {stringGetter({ key: STRING_KEYS.CHECK_WALLET_FOR_REQUEST })}
            </AlertMessage>
          )}
          <$Footer>
            <DepositButtonAndReceipt
              buttonLabel={depositCTAString}
              isDisabled={isDisabled}
              isLoading={isLoading}
              chainId={chainId || undefined}
              setSlippage={onSetSlippage}
              slippage={slippage}
              sourceToken={sourceToken || undefined}
              setRequireUserActionInWallet={setRequireUserActionInWallet}
              setError={setError}
            />
            {!hasAcknowledgedTerms && (
              <div tw="mt-1 text-color-text-0 font-small-book">
                {stringGetter({
                  key: STRING_KEYS.DEPOSIT_ACKNOWLEDGEMENT,
                  params: {
                    TERMS_LINK: (
                      <Link href={`${BASE_ROUTE}${AppRoute.Terms}`} isInline>
                        {stringGetter({ key: STRING_KEYS.TERMS_OF_USE })}
                      </Link>
                    ),
                    POLICY_LINK: (
                      <Link href={`${BASE_ROUTE}${AppRoute.Privacy}`} isInline>
                        {stringGetter({ key: STRING_KEYS.PRIVACY_POLICY })}
                      </Link>
                    ),
                    VIEW_MORE_LINK: (
                      <Link
                        isInline
                        onClick={() => {
                          dispatch(forceOpenDialog(DialogTypes.AcknowledgeTerms()));
                        }}
                      >
                        {stringGetter({ key: STRING_KEYS.VIEW_MORE })} →
                      </Link>
                    ),
                  },
                })}
              </div>
            )}
          </$Footer>
        </>
      )}
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
