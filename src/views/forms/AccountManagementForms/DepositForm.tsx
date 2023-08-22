import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';
import { type NumberFormatValues } from 'react-number-format';
import { shallowEqual, useSelector } from 'react-redux';
import { TESTNET_CHAIN_ID } from '@dydxprotocol/v4-client';
import { ethers } from 'ethers';

import {
  TransferInputField,
  TransferInputChainResource,
  TransferInputTokenResource,
  TransferType,
} from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { ButtonSize } from '@/constants/buttons';
import { StringGetterFunction, STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { useAccounts, useDebounce, useStringGetter } from '@/hooks';
import { useAccountBalance } from '@/hooks/useAccountBalance';

import { layoutMixins } from '@/styles/layoutMixins';

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

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';

import { ChainSelectMenu } from './ChainSelectMenu';
import { TokenSelectMenu } from './TokenSelectMenu';

import { DepositButtonAndReceipt } from './DepositForm/DepositButtonAndReceipt';

import { getTransferInputs } from '@/state/inputsSelectors';
import { set } from 'lodash';

type DepositFormProps = {
  onDeposit?: () => void;
  onError?: () => void;
};

export const DepositForm = ({ onDeposit, onError }: DepositFormProps) => {
  const stringGetter = useStringGetter();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { signerWagmi } = useAccounts();

  const { requestPayload, token, chain, resources } = useSelector(getTransferInputs) || {};

  // User inputs
  const sourceChain = useMemo(
    () => (chain ? resources?.chainResources?.get(chain) : undefined),
    [chain, resources]
  );

  const sourceToken = useMemo(
    () => (token ? resources?.tokenResources?.get(token) : undefined),
    [token, resources]
  );

  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState(0.01); // 1% slippage
  const debouncedAmount = useDebounce<string>(fromAmount, 500);

  // Async Data
  const [transactionHash, setTransactionHash] = useState<string>();

  const { balance, queryStatus, isQueryFetching } = useAccountBalance({
    addressOrDenom: sourceToken?.address || undefined,
    assetSymbol: sourceToken?.symbol || undefined,
    chainId: sourceChain?.chainId || undefined,
    decimals: sourceToken?.decimals || undefined,
    rpc: sourceChain?.rpc || undefined,
    isCosmosChain: false,
  });

  // BN
  const debouncedAmountBN = MustBigNumber(debouncedAmount);
  const balanceBN = MustBigNumber(balance);

  useEffect(() => {
    const hasInvalidInput =
      debouncedAmountBN.isNaN() || debouncedAmountBN.lte(0) || debouncedAmountBN.gte(balanceBN);

    abacusStateManager.setTransferValue({
      value: hasInvalidInput ? 0 : debouncedAmount,
      field: TransferInputField.size,
    });

    setError(null);
  }, [debouncedAmountBN.toNumber()]);

  useEffect(() => {
    abacusStateManager.setTransferValue({
      value: TransferType.deposit.rawValue,
      field: TransferInputField.type,
    });

    return () => {
      abacusStateManager.clearTransferInputValues();
    };
  }, []);

  useEffect(() => {
    if (error) onError?.();
  }, [error]);

  const onSelectChain = useCallback((chain: TransferInputChainResource) => {
    if (chain) {
      abacusStateManager.clearTransferInputValues();
      abacusStateManager.setTransferValue({
        field: TransferInputField.chain,
        value: chain.chainId,
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
          !requestPayload.gasPrice ||
          !requestPayload.routeType
        ) {
          throw new Error('Missing request payload');
        }

        setIsLoading(true);

        let tx = {
          to: requestPayload.targetAddress as `0x${string}`,
          data: requestPayload.data as `0x${string}`,
          gasLimit: ethers.toBigInt(requestPayload.gasLimit),
          value:
            requestPayload.routeType !== 'SEND' ? ethers.toBigInt(requestPayload.value) : undefined,
        };
        const txHash = await signerWagmi.sendTransaction(tx);
        onDeposit?.();

        if (txHash) {
          setTransactionHash(txHash);
          abacusStateManager.setTransferStatus({
            hash: txHash,
            toChainId: TESTNET_CHAIN_ID,
            fromChainId: sourceChain?.chainId?.toString(),
          });
          abacusStateManager.clearTransferInputValues();
          setFromAmount('');
        }

      } catch (error) {
        setError(error);
      } finally {
        setIsLoading(false);
      }
    },
    [requestPayload, signerWagmi, sourceChain]
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
      return error?.message
        ? stringGetter({
            key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
            params: { ERROR_MESSAGE: error.message },
          })
        : stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG });
    }

    if (fromAmount) {
      if (!sourceChain) {
        return stringGetter({ key: STRING_KEYS.MUST_SPECIFY_CHAIN });
      } else if (!sourceToken) {
        return stringGetter({ key: STRING_KEYS.MUST_SPECIFY_ASSET });
      }
    }

    if (MustBigNumber(fromAmount).gt(MustBigNumber(balance))) {
      return stringGetter({ key: STRING_KEYS.DEPOSIT_MORE_THAN_BALANCE });
    }

    return undefined;
  }, [error, balance, sourceChain, fromAmount, sourceToken]);

  const isDisabled =
    Boolean(errorMessage) ||
    !sourceToken ||
    !sourceChain ||
    debouncedAmountBN.isNaN() ||
    debouncedAmountBN.isZero();

  if (!resources) {
    return <LoadingSpace id="DepositForm" />;
  }

  return (
    <Styled.Form onSubmit={onSubmit}>
      <ChainSelectMenu selectedChain={sourceChain || undefined} onSelectChain={onSelectChain} />
      <TokenSelectMenu selectedToken={sourceToken || undefined} onSelectToken={onSelectToken} />
      <Styled.WithDetailsReceipt side="bottom" detailItems={amountInputReceipt}>
        <FormInput
          type={InputType.Number}
          onChange={onChangeAmount}
          label={stringGetter({ key: STRING_KEYS.AMOUNT })}
          value={fromAmount}
          slotRight={
            <Button size={ButtonSize.XSmall} onClick={onClickMax}>
              {stringGetter({ key: STRING_KEYS.MAX })}
            </Button>
          }
        />
      </Styled.WithDetailsReceipt>
      {errorMessage ? (
        <AlertMessage type={AlertType.Error}>{errorMessage}</AlertMessage>
      ) : (
        transactionHash && (
          <AlertMessage type={AlertType.Success}>
            <Styled.TransactionInfo>
              {stringGetter({ key: STRING_KEYS.DEPOSIT_IN_PROGRESS })}
            </Styled.TransactionInfo>
          </AlertMessage>
        )
      )}
      <DepositButtonAndReceipt
        isDisabled={isDisabled}
        isLoading={isLoading}
        chainId={sourceChain?.chainId || undefined}
        setSlippage={onSetSlippage}
        slippage={slippage}
        sourceToken={sourceToken || undefined}
      />
    </Styled.Form>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Form = styled.form`
  ${layoutMixins.flexColumn}
  gap: 1.5rem;

  ${layoutMixins.stickyArea1}
  min-height: calc(100% - var(--stickyArea0-bottomHeight));
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
