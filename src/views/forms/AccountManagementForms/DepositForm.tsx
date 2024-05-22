/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import { type NumberFormatValues } from 'react-number-format';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';
import { Abi, parseUnits } from 'viem';

import erc20 from '@/abi/erc20.json';
import erc20_usdt from '@/abi/erc20_usdt.json';
import { TransferInputField, TransferInputTokenResource, TransferType } from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { AnalyticsEvent, AnalyticsEventData } from '@/constants/analytics';
import { ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { TransferNotificationTypes } from '@/constants/notifications';
import {
  MAX_CCTP_TRANSFER_AMOUNT,
  MAX_PRICE_IMPACT,
  MIN_CCTP_TRANSFER_AMOUNT,
  NumberSign,
} from '@/constants/numbers';
import { WalletType, type EvmAddress } from '@/constants/wallets';

import { CHAIN_DEFAULT_TOKEN_ADDRESS, useAccountBalance } from '@/hooks/useAccountBalance';
import { useAccounts } from '@/hooks/useAccounts';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';
import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { WithTooltip } from '@/components/WithTooltip';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getTransferInputs } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';
import { getNobleChainId, NATIVE_TOKEN_ADDRESS } from '@/lib/squid';
import { log } from '@/lib/telemetry';
import { parseWalletError } from '@/lib/wallet';

import { NobleDeposit } from '../NobleDeposit';
import { DepositButtonAndReceipt } from './DepositForm/DepositButtonAndReceipt';
import { SourceSelectMenu } from './SourceSelectMenu';
import { TokenSelectMenu } from './TokenSelectMenu';

type DepositFormProps = {
  onDeposit?: (event?: AnalyticsEventData<AnalyticsEvent.TransferDeposit>) => void;
  onError?: () => void;
};

export const DepositForm = ({ onDeposit, onError }: DepositFormProps) => {
  const stringGetter = useStringGetter();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requireUserActionInWallet, setRequireUserActionInWallet] = useState(false);
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const { dydxAddress, evmAddress, signerWagmi, publicClientWagmi, nobleAddress } = useAccounts();

  const { addTransferNotification } = useLocalNotifications();

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
  // eslint-disable-next-line radix
  const chainId = chainIdStr ? parseInt(chainIdStr) : undefined;

  // User inputs
  const sourceToken = useMemo(
    () => (token ? resources?.tokenResources?.get(token) : undefined),
    [token, resources]
  );

  const sourceChain = useMemo(
    () => (chainIdStr ? resources?.chainResources?.get(chainIdStr) : undefined),
    [chainId, resources]
  );

  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState(isCctp ? 0 : 0.01); // 1% slippage
  const debouncedAmount = useDebounce<string>(fromAmount, 500);

  // Async Data
  const { balance } = useAccountBalance({
    addressOrDenom: sourceToken?.address || CHAIN_DEFAULT_TOKEN_ADDRESS,
    chainId,
    decimals: sourceToken?.decimals || undefined,
    isCosmosChain: false,
  });

  // BN
  const debouncedAmountBN = MustBigNumber(debouncedAmount);
  const balanceBN = MustBigNumber(balance);

  useEffect(() => setSlippage(isCctp ? 0 : 0.01), [isCctp]);

  useEffect(() => {
    const hasInvalidInput =
      debouncedAmountBN.isNaN() || debouncedAmountBN.lte(0) || debouncedAmountBN.gt(balanceBN);

    abacusStateManager.setTransferValue({
      value: hasInvalidInput ? 0 : debouncedAmount,
      field: TransferInputField.size,
    });

    setError(null);
  }, [debouncedAmountBN.toNumber()]);

  useEffect(() => {
    if (dydxAddress && evmAddress) {
      // TODO: this is for fixing a race condition where the sourceAddress is not set in time.
      // worth investigating a better fix on abacus
      abacusStateManager.setTransfersSourceAddress(evmAddress);
      abacusStateManager.setTransferValue({
        field: TransferInputField.type,
        value: TransferType.deposit.rawValue,
      });
    }
    return () => {
      abacusStateManager.resetInputState();
    };
  }, [dydxAddress]);

  useEffect(() => {
    if (error) onError?.();
  }, [error]);

  const { walletType } = useAccounts();

  useEffect(() => {
    if (walletType === WalletType.Privy) {
      abacusStateManager.setTransferValue({
        field: TransferInputField.exchange,
        value: 'coinbase',
      });
    }
  }, [walletType]);

  const onSelectNetwork = useCallback((name: string, type: 'chain' | 'exchange') => {
    if (name) {
      abacusStateManager.clearTransferInputValues();
      setFromAmount('');
      if (type === 'chain') {
        abacusStateManager.setTransferValue({
          field: TransferInputField.chain,
          value: name,
        });
      } else {
        abacusStateManager.setTransferValue({
          field: TransferInputField.exchange,
          value: name,
        });
      }
    }
  }, []);

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
    [setSlippage, debouncedAmount]
  );

  const onClickMax = useCallback(() => {
    if (balance) {
      setFromAmount(balanceBN.toString());
    }
  }, [balance, setFromAmount]);

  const validateTokenApproval = useCallback(async () => {
    if (!signerWagmi || !publicClientWagmi) throw new Error('Missing signer');
    if (!sourceToken?.address || !sourceToken.decimals)
      throw new Error('Missing source token address');
    if (!sourceChain?.rpc) throw new Error('Missing source chain rpc');
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
  }, [signerWagmi, sourceToken, sourceChain, requestPayload, publicClientWagmi]);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      try {
        e.preventDefault();

        if (!signerWagmi) {
          throw new Error('Missing signer');
        }
        if (
          !requestPayload?.targetAddress ||
          !requestPayload.data ||
          !requestPayload.value ||
          !requestPayload.gasLimit ||
          !requestPayload.routeType
        ) {
          throw new Error('Missing request payload');
        }

        if (isCctp && !abacusStateManager.chainTransactions.isNobleClientConnected) {
          throw new Error('Noble RPC endpoint unaccessible');
        }

        setIsLoading(true);

        await validateTokenApproval();

        const tx = {
          to: requestPayload.targetAddress as EvmAddress,
          data: requestPayload.data as EvmAddress,
          gasLimit: BigInt(requestPayload.gasLimit),
          value: requestPayload.routeType !== 'SEND' ? BigInt(requestPayload.value) : undefined,
        };
        const txHash = await signerWagmi.sendTransaction(tx);

        if (txHash) {
          addTransferNotification({
            txHash,
            toChainId: !isCctp ? selectedDydxChainId : getNobleChainId(),
            fromChainId: chainIdStr || undefined,
            toAmount: summary?.usdcSize || undefined,
            triggeredAt: Date.now(),
            isCctp,
            requestId: requestPayload.requestId ?? undefined,
            type: TransferNotificationTypes.Deposit,
          });
          abacusStateManager.clearTransferInputValues();
          setFromAmount('');

          onDeposit?.({
            chainId: chainIdStr || undefined,
            tokenAddress: sourceToken?.address || undefined,
            tokenSymbol: sourceToken?.symbol || undefined,
            slippage: slippage || undefined,
            gasFee: summary?.gasFee || undefined,
            bridgeFee: summary?.bridgeFee || undefined,
            exchangeRate: summary?.exchangeRate || undefined,
            estimatedRouteDuration: summary?.estimatedRouteDuration || undefined,
            toAmount: summary?.toAmount || undefined,
            toAmountMin: summary?.toAmountMin || undefined,
          });
        }
      } catch (err) {
        log('DepositForm/onSubmit', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [requestPayload, signerWagmi, chainId, sourceToken, sourceChain]
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
        return 'Amount must be greater than 10 USDC';
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
      <$Subheader>
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
      </$Subheader>
      <SourceSelectMenu
        selectedChain={chainIdStr || undefined}
        selectedExchange={exchange || undefined}
        onSelect={onSelectNetwork}
      />
      {exchange && nobleAddress ? (
        <NobleDeposit />
      ) : (
        <>
          <TokenSelectMenu selectedToken={sourceToken || undefined} onSelectToken={onSelectToken} />
          <$WithDetailsReceipt side="bottom" detailItems={amountInputReceipt}>
            <FormInput
              type={InputType.Number}
              onChange={onChangeAmount}
              label={stringGetter({ key: STRING_KEYS.AMOUNT })}
              value={fromAmount}
              slotRight={
                <$FormInputButton size={ButtonSize.XSmall} onClick={onClickMax}>
                  {stringGetter({ key: STRING_KEYS.MAX })}
                </$FormInputButton>
              }
            />
          </$WithDetailsReceipt>
          {errorMessage && <AlertMessage type={AlertType.Error}>{errorMessage}</AlertMessage>}
          {requireUserActionInWallet && (
            <AlertMessage type={AlertType.Warning}>
              {stringGetter({ key: STRING_KEYS.CHECK_WALLET_FOR_REQUEST })}
            </AlertMessage>
          )}
          <$Footer>
            <DepositButtonAndReceipt
              isDisabled={isDisabled}
              isLoading={isLoading}
              chainId={chainId || undefined}
              setSlippage={onSetSlippage}
              slippage={slippage}
              sourceToken={sourceToken || undefined}
              setRequireUserActionInWallet={setRequireUserActionInWallet}
              setError={setError}
            />
          </$Footer>
        </>
      )}
    </$Form>
  );
};
const $Form = styled.form`
  ${formMixins.transfersForm}
`;

const $Subheader = styled.div`
  color: var(--color-text-0);
`;

const $Footer = styled.footer`
  ${formMixins.footer}
  --stickyFooterBackdrop-outsetY: var(--dialog-content-paddingBottom);
`;

const $WithDetailsReceipt = styled(WithDetailsReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
`;

const $FormInputButton = styled(Button)`
  ${formMixins.inputInnerButton}
`;
