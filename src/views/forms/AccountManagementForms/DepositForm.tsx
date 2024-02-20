import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';
import { type NumberFormatValues } from 'react-number-format';
import { shallowEqual, useSelector } from 'react-redux';
import { Abi, parseUnits } from 'viem';

import erc20 from '@/abi/erc20.json';
import erc20_usdt from '@/abi/erc20_usdt.json';
import { TransferInputField, TransferInputTokenResource, TransferType } from '@/constants/abacus';
import { AnalyticsEvent, AnalyticsEventData } from '@/constants/analytics';
import { AlertType } from '@/constants/alerts';
import { ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { MAX_CCTP_TRANSFER_AMOUNT, MAX_PRICE_IMPACT, NumberSign } from '@/constants/numbers';
import type { EvmAddress } from '@/constants/wallets';

import { useAccounts, useDebounce, useStringGetter, useSelectedNetwork } from '@/hooks';
import { useAccountBalance, CHAIN_DEFAULT_TOKEN_ADDRESS } from '@/hooks/useAccountBalance';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';

import { layoutMixins } from '@/styles/layoutMixins';
import { formMixins } from '@/styles/formMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { Link } from '@/components/Link';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { getTransferInputs } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';
import { getNobleChainId, NATIVE_TOKEN_ADDRESS } from '@/lib/squid';
import { log } from '@/lib/telemetry';
import { parseWalletError } from '@/lib/wallet';

import { SourceSelectMenu } from './SourceSelectMenu';
import { TokenSelectMenu } from './TokenSelectMenu';

import { DepositButtonAndReceipt } from './DepositForm/DepositButtonAndReceipt';
import { NobleDeposit } from '../NobleDeposit';

type DepositFormProps = {
  onDeposit?: (event?: AnalyticsEventData<AnalyticsEvent.TransferDeposit>) => void;
  onError?: () => void;
};

export const DepositForm = ({ onDeposit, onError }: DepositFormProps) => {
  const stringGetter = useStringGetter();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requireUserActionInWallet, setRequireUserActionInWallet] = useState(false);
  const selectedDydxChainId = useSelector(getSelectedDydxChainId);

  const { evmAddress, signerWagmi, publicClientWagmi, nobleAddress } = useAccounts();

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
  } = useSelector(getTransferInputs, shallowEqual) || {};
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
  const { balance, queryStatus, isQueryFetching } = useAccountBalance({
    addressOrDenom: sourceToken?.address || CHAIN_DEFAULT_TOKEN_ADDRESS,
    chainId: chainId,
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
    abacusStateManager.setTransferValue({
      field: TransferInputField.type,
      value: TransferType.deposit.rawValue,
    });

    return () => {
      abacusStateManager.resetInputState();
    };
  }, []);

  useEffect(() => {
    if (error) onError?.();
  }, [error]);

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

  const onSelectToken = useCallback((token: TransferInputTokenResource) => {
    if (token) {
      abacusStateManager.clearTransferInputValues();
      abacusStateManager.setTransferValue({
        field: TransferInputField.token,
        value: token.address,
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

        let tx = {
          to: requestPayload.targetAddress as EvmAddress,
          data: requestPayload.data as EvmAddress,
          gasLimit: BigInt(requestPayload.gasLimit),
          value: requestPayload.routeType !== 'SEND' ? BigInt(requestPayload.value) : undefined,
        };
        const txHash = await signerWagmi.sendTransaction(tx);

        if (txHash) {
          addTransferNotification({
            txHash: txHash,
            toChainId: !isCctp ? selectedDydxChainId : getNobleChainId(),
            fromChainId: chainIdStr || undefined,
            toAmount: summary?.usdcSize || undefined,
            triggeredAt: Date.now(),
            isCctp,
          });
          abacusStateManager.clearTransferInputValues();
          setFromAmount('');

          onDeposit?.({
            chainId: chainIdStr || undefined,
            tokenAddress: sourceToken?.address || undefined,
            tokenSymbol: sourceToken?.symbol || undefined,
          });
        }
      } catch (error) {
        log('DepositForm/onSubmit', error);
        setError(error);
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

  const errorMessage = useMemo(() => {
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
      } else if (!sourceToken) {
        return stringGetter({ key: STRING_KEYS.MUST_SPECIFY_ASSET });
      }
    }

    if (MustBigNumber(fromAmount).gt(MustBigNumber(balance))) {
      return stringGetter({ key: STRING_KEYS.DEPOSIT_MORE_THAN_BALANCE });
    }

    if (isCctp) {
      if (MustBigNumber(debouncedAmountBN).gte(MAX_CCTP_TRANSFER_AMOUNT)) {
        return stringGetter({
          key: STRING_KEYS.MAX_CCTP_TRANSFER_LIMIT_EXCEEDED,
          params: {
            MAX_CCTP_TRANSFER_AMOUNT: MAX_CCTP_TRANSFER_AMOUNT,
          },
        });
      }
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
    <Styled.Form onSubmit={onSubmit}>
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
          <Styled.WithDetailsReceipt side="bottom" detailItems={amountInputReceipt}>
            <FormInput
              type={InputType.Number}
              onChange={onChangeAmount}
              label={stringGetter({ key: STRING_KEYS.AMOUNT })}
              value={fromAmount}
              slotRight={
                <Styled.FormInputButton size={ButtonSize.XSmall} onClick={onClickMax}>
                  {stringGetter({ key: STRING_KEYS.MAX })}
                </Styled.FormInputButton>
              }
            />
          </Styled.WithDetailsReceipt>
          {errorMessage && <AlertMessage type={AlertType.Error}>{errorMessage}</AlertMessage>}
          {requireUserActionInWallet && (
            <AlertMessage type={AlertType.Warning}>
              {stringGetter({ key: STRING_KEYS.CHECK_WALLET_FOR_REQUEST })}
            </AlertMessage>
          )}
          <Styled.Footer>
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
          </Styled.Footer>
        </>
      )}
    </Styled.Form>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Form = styled.form`
  ${formMixins.transfersForm}
`;

Styled.Footer = styled.footer`
  ${formMixins.footer}
  --stickyFooterBackdrop-outsetY: var(--dialog-content-paddingBottom);
`;

Styled.WithDetailsReceipt = styled(WithDetailsReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
`;

Styled.Link = styled(Link)`
  color: var(--color-accent);

  &:visited {
    color: var(--color-accent);
  }
`;

Styled.TransactionInfo = styled.span`
  ${layoutMixins.row}
`;

Styled.FormInputButton = styled(Button)`
  ${formMixins.inputInnerButton}
`;
