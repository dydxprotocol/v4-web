/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { Asset } from '@skip-go/client';
import { useAccount as useAccountGraz, useStargateSigningClient } from 'graz';
import { type NumberFormatValues } from 'react-number-format';
import styled from 'styled-components';
import { Abi, parseUnits } from 'viem';

import erc20 from '@/abi/erc20.json';
import erc20_usdt from '@/abi/erc20_usdt.json';
import { AlertType } from '@/constants/alerts';
import { AnalyticsEventPayloads, AnalyticsEvents } from '@/constants/analytics';
import { ButtonSize } from '@/constants/buttons';
import { isTokenCctp } from '@/constants/cctp';
import { NEUTRON_USDC_IBC_DENOM, OSMO_USDC_IBC_DENOM } from '@/constants/denoms';
import { DialogTypes } from '@/constants/dialogs';
import {
  getNeutronChainId,
  getNobleChainId,
  getOsmosisChainId,
  SUPPORTED_COSMOS_CHAINS,
} from '@/constants/graz';
import { STRING_KEYS } from '@/constants/localization';
import { TransferNotificationTypes } from '@/constants/notifications';
import {
  DEFAULT_GAS_LIMIT,
  MAX_CCTP_TRANSFER_AMOUNT,
  MIN_CCTP_TRANSFER_AMOUNT,
  NumberSign,
} from '@/constants/numbers';
import { AppRoute, BASE_ROUTE } from '@/constants/routes';
import { TransferType } from '@/constants/transfers';
import { ConnectorType, type EvmAddress, WalletType } from '@/constants/wallets';

import { useTransfers } from '@/hooks/transfers/useTransfers';
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

import { track } from '@/lib/analytics/analytics';
import { dd } from '@/lib/analytics/datadog';
import { isNativeDenom } from '@/lib/assetUtils';
import { MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';
import { sleep } from '@/lib/timeUtils';
import { parseWalletError } from '@/lib/wallet';

import { CoinbaseDeposit } from '../CoinbaseDeposit';
import { DepositButtonAndReceipt } from './DepositForm/DepositButtonAndReceipt';
import { NetworkSelectMenu } from './NetworkSelectMenu';
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

  // User inputs
  const {
    clearTransferState,
    defaultChainId,
    defaultTokenDenom,
    fromToken,
    fromTokenDenom,
    setFromTokenDenom,
    setToTokenDenom,
    fromChainId,
    setFromChainId,
    setToChainId,
    setToAddress,
    setFromAddress,
    amount,
    setAmount,
    setTransferType,
    route,
  } = useTransfers();

  const isCctp = isTokenCctp(fromToken);

  /* eslint-disable radix */
  let chainId: number | string | undefined;
  if (fromChainId) chainId = fromChainId;
  if (fromChainId && fromChainId.startsWith('solana')) chainId = fromChainId;
  if (fromChainId && !Number.isNaN(parseInt(fromChainId))) chainId = parseInt(fromChainId);
  /* eslint-enable radix */

  const nobleChainId = getNobleChainId();
  const osmosisChainId = getOsmosisChainId();
  const neutronChainId = getNeutronChainId();

  const [slippage, setSlippage] = useState(isCctp ? 0 : 0.01); // 1% slippage
  const debouncedAmount = useDebounce<string>(amount, 500);

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
    addressOrDenom: fromTokenDenom || CHAIN_DEFAULT_TOKEN_ADDRESS,
    chainId,
    isCosmosChain: isKeplrWallet,
  });
  // BN
  const debouncedAmountBN = MustBigNumber(debouncedAmount);
  const balanceBN = MustBigNumber(balance);

  // Clear transfer state when unmounting component
  useEffect(() => {
    return () => clearTransferState();
    // Empty dependency array so we only run upon component unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTransferType(TransferType.Deposit);
    setToChainId(selectedDydxChainId);
    setToAddress(dydxAddress);
    setToTokenDenom(usdcDenom);
  }, [
    dydxAddress,
    selectedDydxChainId,
    setToAddress,
    setToChainId,
    setToTokenDenom,
    setTransferType,
    usdcDenom,
  ]);

  useEffect(() => {
    setFromChainId(defaultChainId);
  }, [defaultChainId, setFromChainId]);

  useEffect(() => {
    setFromTokenDenom(defaultTokenDenom);
  }, [defaultTokenDenom, setFromTokenDenom]);

  useEffect(() => {
    setSlippage(isCctp || isKeplrWallet ? 0 : 0.01);
  }, [isCctp, isKeplrWallet]);

  useEffect(() => {
    setError(null);
  }, [amount]);

  useEffect(() => {
    if (dydxAddress) {
      // TODO: this is for fixing a race condition where the sourceAddress is not set in time.
      // worth investigating a better fix on abacus
      if (connectedWallet?.name === WalletType.Keplr && nobleAddress) {
        setFromAddress(nobleAddress);
        // put sol first. some users with phantom wallet have previously connected with evm
        // so they will have both sol and evm addresses. we assume the phantom wallet
        // is connected with a sol address, not evm.
      } else if (solAddress) {
        setFromAddress(solAddress);
      } else if (evmAddress) {
        setFromAddress(evmAddress);
      }
    }
    return () => {};
  }, [dydxAddress, evmAddress, nobleAddress, connectedWallet, solAddress]);

  useEffect(() => {
    if (error) onError?.();
  }, [error]);

  useEffect(() => {
    if (!connectedWallet) return;

    if (connectedWallet.connectorType === ConnectorType.Privy) {
      // TODO: configure coinbase deposits
    }
    if (connectedWallet.connectorType === ConnectorType.PhantomSolana) {
      // TODO: create `getSolanaChainId()` function that flags off of mainnet to return the testnet id
      setFromChainId('solana');
    }
    if (connectedWallet.connectorType === ConnectorType.Cosmos) {
      setFromChainId(nobleChainId);
    }
  }, [nobleAddress, nobleChainId, connectedWallet, setFromChainId]);

  // TODO: configure coinbase deposits
  const onSelectNetwork = useCallback(
    (chainID: string, type: 'chain' | 'exchange') => {
      if (chainID) {
        setAmount('');
        if (type === 'chain') {
          setFromChainId(chainID);

          if (chainID === osmosisChainId) {
            setFromTokenDenom(OSMO_USDC_IBC_DENOM);
          }
          if (chainID === neutronChainId) {
            setFromTokenDenom(NEUTRON_USDC_IBC_DENOM);
          }
        }
      }
    },
    [neutronChainId, osmosisChainId]
  );

  const onSelectToken = useCallback(
    (asset: Asset) => {
      if (asset) {
        setFromTokenDenom(asset.denom);
        // TODO: probably want to centralize all the setAmount resetting in the useTransfers hooks
        setAmount('');
      }
    },
    [setAmount, setFromTokenDenom]
  );

  const onChangeAmount = useCallback(
    ({ value }: NumberFormatValues) => {
      setAmount(value);
    },
    [setAmount]
  );

  // TODO: implement slippage control
  const onSetSlippage = useCallback(
    (newSlippage: number) => {
      setSlippage(newSlippage);
    },
    [setSlippage]
  );

  const onClickMax = useCallback(() => {
    if (balance) {
      setAmount(balanceBN.toString());
    }
  }, [balance, balanceBN]);

  // TODO: multiplex this off of evm vs cosmos vs solana
  // This is just to test that evm deposits w/ evm swaps are working properly
  const firstTx = route?.txs?.[0];
  const isEvmTx = firstTx && 'evmTx' in firstTx;
  const evmTxDestinationAddress = isEvmTx && firstTx.evmTx.to;
  const evmTxData = isEvmTx && firstTx.evmTx.data;

  const evmTxValue = isEvmTx && firstTx.evmTx.value;

  const isSvmTx = firstTx && 'svmTx' in firstTx;
  const svmTxDestinationAddress = isSvmTx && firstTx.svmTx.to;
  const svmTxData = isSvmTx && firstTx.svmTx.data;

  const svmTxValue = isSvmTx && firstTx.svmTx.value;

  const validateTokenApproval = useCallback(async () => {
    if (!signerWagmi || !publicClientWagmi) throw new Error('Missing signer');
    if (!fromTokenDenom || !fromToken?.decimals) throw new Error('Missing source token address');
    if (!evmTxDestinationAddress) throw new Error('Missing target address');
    if (!evmTxValue) throw new Error('Missing transaction value');
    if (isNativeDenom(fromTokenDenom)) return;

    const allowance = await publicClientWagmi.readContract({
      address: fromToken.denom as EvmAddress,
      abi: erc20,
      functionName: 'allowance',
      args: [evmAddress as EvmAddress, evmTxDestinationAddress as EvmAddress],
    });

    const sourceAmountBN = parseUnits(debouncedAmount, fromToken.decimals);

    if (sourceAmountBN > (allowance as bigint)) {
      setDepositStep(DepositSteps.Approval);
      const simulateApprove = async (abi: Abi) =>
        publicClientWagmi.simulateContract({
          account: evmAddress,
          address: fromTokenDenom as EvmAddress,
          abi,
          functionName: 'approve',
          args: [evmTxDestinationAddress as EvmAddress, sourceAmountBN],
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
  }, [
    signerWagmi,
    publicClientWagmi,
    fromToken,
    evmAddress,
    debouncedAmount,
    isEvmTx,
    evmTxDestinationAddress,
    evmTxData,
    evmTxValue,
  ]);

  /**
   * Polls for the deposit to hit your dydx wallet
   * Then submits a final deposit into your subaccount
   */
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

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      const transferDepositContext = {
        chainId: fromChainId ?? undefined,
        tokenAddress: fromTokenDenom ?? undefined,
        tokenSymbol: fromToken?.symbol ?? undefined,
        slippage: slippage ?? undefined,
        gasFee: undefined,
        exchangeRate: undefined,
        bridgeFee:
          Number(route?.route.usdAmountIn) - Number(route?.route.usdAmountOut) || undefined,
        estimatedRouteDuration: route?.route.estimatedRouteDurationSeconds || undefined,
        toAmount: Number(route?.route.amountOut) || undefined,
        toAmountMin: Number(route?.route.estimatedAmountOut) || undefined,
        depositCTAString,
      };
      track(AnalyticsEvents.TransferDepositFundsClick(transferDepositContext));
      dd.info('Transfer deposit click', transferDepositContext);
      try {
        e.preventDefault();
        setIsLoading(true);

        if (fromChainId && SUPPORTED_COSMOS_CHAINS.includes(fromChainId)) {
          console.error('cosmos deposit not supported yet');
          return;
        }
        // TODO: perform a non abacus dependent noble client cennection check

        if (!hasAcknowledgedTerms) {
          saveHasAcknowledgedTerms(true);
        }

        let txHash: string | undefined;
        if (connectedWallet?.name === WalletType.Phantom) {
          // TODO: check for svmTxData instead of evmTxData
          throw new Error('Missing solana request payload');

          setDepositStep(DepositSteps.Confirm);
          txHash = await signTransactionPhantom(Buffer.from(evmTxData, 'base64'));
        } else {
          if (!signerWagmi) {
            throw new Error('Missing signer');
          }
          if (!evmTxDestinationAddress || !evmTxData || !evmTxValue) {
            throw new Error('Missing request payload');
          }
          await validateTokenApproval();

          const tx = {
            // NOTE TO SELF: UPDATE TO REPLACE NATIVE ADDRESS WITH THE COSMJS ACCEPTABLE ONE
            to: evmTxDestinationAddress as EvmAddress,
            data: evmTxData as EvmAddress,
            gasLimit: BigInt(DEFAULT_GAS_LIMIT),
            value: BigInt(evmTxValue),
          };
          setDepositStep(DepositSteps.Confirm);
          txHash = await signerWagmi.sendTransaction(tx);
        }
        if (txHash) {
          addOrUpdateTransferNotification({
            txHash,
            toChainId: !isCctp ? selectedDydxChainId : nobleChainId,
            fromChainId: fromChainId || undefined,
            toAmount: Number(route?.route.usdAmountOut) || undefined,
            triggeredAt: Date.now(),
            isCctp,
            requestId: undefined,
            type: TransferNotificationTypes.Deposit,
          });

          setAmount('');
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
      signerWagmi,
      fromChainId,
      fromToken,
      fromChainId,
      nobleChainId,
      signTransactionPhantom,
      evmTxData,
      evmTxDestinationAddress,
      evmTxValue,
    ]
  );

  const amountInputReceipt = [
    {
      key: 'amount',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.AVAILABLE })}{' '}
          {fromToken && <Tag>{fromToken.symbol}</Tag>}
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
            Boolean(amount && balance) && !debouncedAmountBN.isNaN() && !debouncedAmountBN.isZero()
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

    // TODO: talk to skip about the return type for this. msgsDirect can return an error json
    // which has a code, message, and details
    if (route?.code) {
      const routeErrorContext = {
        // TODO: consider making this match the abacus transferType value so we don't have an interruption
        // in amplitude analytics data
        transferType: TransferType.Deposit,
        errorMessage: route?.message ?? undefined,
        amount: debouncedAmount,
        chainId: fromChainId ?? undefined,
        assetAddress: fromTokenDenom ?? undefined,
        assetSymbol: fromToken?.symbol ?? undefined,
        assetName: fromToken?.name ?? undefined,
        assetId: fromToken?.toString() ?? undefined,
      };
      track(AnalyticsEvents.RouteError(routeErrorContext));
      dd.info('Route error received', routeErrorContext);
      return route?.message
        ? stringGetter({
            key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
            params: { ERROR_MESSAGE: route?.message },
          })
        : stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG });
    }

    if (amount) {
      if (!chainId) {
        return stringGetter({ key: STRING_KEYS.MUST_SPECIFY_CHAIN });
      }
      if (!fromToken) {
        return stringGetter({ key: STRING_KEYS.MUST_SPECIFY_ASSET });
      }
    }

    if (MustBigNumber(amount).gt(MustBigNumber(balance))) {
      return stringGetter({ key: STRING_KEYS.DEPOSIT_MORE_THAN_BALANCE });
    }

    return undefined;
  }, [error, balance, chainId, amount, fromToken, stringGetter, debouncedAmountBN]);

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
    !fromToken ||
    !chainId ||
    debouncedAmountBN.isNaN() ||
    debouncedAmountBN.isZero();

  if (!fromToken) {
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
      <NetworkSelectMenu
        selectedChain={fromChainId || undefined}
        // selectedExchange={exchange || undefined}
        onSelect={onSelectNetwork}
      />
      {/* TODO: remove hardcoded falsey boolean once coinbase is configured */}
      {false && nobleAddress ? (
        <CoinbaseDeposit />
      ) : (
        <>
          <TokenSelectMenu selectedToken={fromToken || undefined} onSelectToken={onSelectToken} />
          <WithDetailsReceipt
            side="bottom"
            detailItems={amountInputReceipt}
            tw="[--withReceipt-backgroundColor:--color-layer-2]"
          >
            <FormInput
              type={InputType.Number}
              onChange={onChangeAmount}
              label={stringGetter({ key: STRING_KEYS.AMOUNT })}
              value={amount}
              slotRight={
                <FormMaxInputToggleButton
                  size={ButtonSize.XSmall}
                  isInputEmpty={amount === ''}
                  isLoading={isLoading}
                  onPressedChange={(isPressed: boolean) =>
                    isPressed ? onClickMax() : setAmount('')
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
              sourceToken={fromToken || undefined}
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
