import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';
import { type NumberFormatValues } from 'react-number-format';
import { shallowEqual, useSelector } from 'react-redux';
import { parseUnits } from 'viem';

import erc20 from '@/abi/erc20.json';
import { TransferInputField, TransferInputTokenResource, TransferType } from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { NumberSign } from '@/constants/numbers';
import type { EvmAddress } from '@/constants/wallets';

import { useAccounts, useDebounce, useStringGetter, useSelectedNetwork } from '@/hooks';
import { useAccountBalance, CHAIN_DEFAULT_TOKEN_ADDRESS } from '@/hooks/useAccountBalance';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';
import { NATIVE_TOKEN_ADDRESS, useSquid } from '@/hooks/useSquid';

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

import { getTransferInputs } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';
import { parseWalletError } from '@/lib/wallet';

import { ChainSelectMenu } from './ChainSelectMenu';
import { TokenSelectMenu } from './TokenSelectMenu';

import { DepositButtonAndReceipt } from './DepositForm/DepositButtonAndReceipt';

type DepositFormProps = {
  onDeposit?: () => void;
  onError?: () => void;
};

export const DepositForm = ({ onDeposit, onError }: DepositFormProps) => {
  const stringGetter = useStringGetter();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedNetwork } = useSelectedNetwork();

  const { evmAddress, signerWagmi, publicClientWagmi } = useAccounts();

  const { addTransferNotification } = useLocalNotifications();

  const {
    requestPayload,
    token,
    chain: chainIdStr,
    resources,
    summary,
    errors: routeErrors,
    errorMessage: routeErrorMessage,
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
  const [slippage, setSlippage] = useState(0.01); // 1% slippage
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
      abacusStateManager.clearTransferInputValues();
      abacusStateManager.setTransferValue({
        field: TransferInputField.type,
        value: null,
      });
    };
  }, []);

  useEffect(() => {
    if (error) onError?.();
  }, [error]);

  const onSelectChain = useCallback((chain: string) => {
    if (chain) {
      abacusStateManager.clearTransferInputValues();
      abacusStateManager.setTransferValue({
        field: TransferInputField.chain,
        value: chain,
      });
      setFromAmount('');
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
      const { request } = await publicClientWagmi.simulateContract({
        account: evmAddress,
        address: sourceToken.address as EvmAddress,
        abi: erc20,
        functionName: 'approve',
        args: [requestPayload.targetAddress as EvmAddress, sourceAmountBN],
      });

      const approveTx = await signerWagmi.writeContract(request);
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

        setIsLoading(true);

        await validateTokenApproval();

        let tx = {
          to: requestPayload.targetAddress as EvmAddress,
          data: requestPayload.data as EvmAddress,
          gasLimit: BigInt(requestPayload.gasLimit),
          value: requestPayload.routeType !== 'SEND' ? BigInt(requestPayload.value) : undefined,
        };
        const txHash = await signerWagmi.sendTransaction(tx);

        onDeposit?.();

        if (txHash) {
          addTransferNotification({
            txHash: txHash,
            toChainId: ENVIRONMENT_CONFIG_MAP[selectedNetwork].dydxChainId,
            fromChainId: chainIdStr || undefined,
            toAmount: summary?.usdcSize || undefined,
            triggeredAt: Date.now(),
          });
          abacusStateManager.clearTransferInputValues();
          setFromAmount('');
        }
      } catch (error) {
        log('DepositForm/onSubmit', error);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    },
    [requestPayload, signerWagmi, chainId]
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
      <ChainSelectMenu selectedChain={chainIdStr || undefined} onSelectChain={onSelectChain} />
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

      <Styled.Footer>
        <DepositButtonAndReceipt
          isDisabled={isDisabled}
          isLoading={isLoading}
          chainId={chainId || undefined}
          setSlippage={onSetSlippage}
          slippage={slippage}
          sourceToken={sourceToken || undefined}
        />
      </Styled.Footer>
    </Styled.Form>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Form = styled.form`
  ${formMixins.transfersForm}
`;

Styled.Footer = styled.footer`
  ${layoutMixins.stickyFooter}
  margin-top: auto;
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
