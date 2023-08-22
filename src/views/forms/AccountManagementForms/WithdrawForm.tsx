import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';
import type { NumberFormatValues } from 'react-number-format';
import type { TokenData, ChainData } from '@0xsquid/sdk';
import { shallowEqual, useSelector } from 'react-redux';
import { parseUnits } from 'viem';

import {
  TransferInputField,
  TransferInputChainResource,
  TransferInputTokenResource,
  TransferType,
} from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { CLIENT_NETWORK_CONFIGS, type DydxV4Network } from '@/constants/networks';
import { NumberSign, QUANTUM_MULTIPLIER } from '@/constants/numbers';

import { useAccounts, useDebounce, useStringGetter, useSquidRouter, useSubaccount } from '@/hooks';
import { SQUID_WITHDRAW_ROUTE_DEFAULTS } from '@/hooks/useSquidRouter';

import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { Link } from '@/components/Link';
import { OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';

import { ChainSelectMenu } from '@/views/forms/AccountManagementForms/ChainSelectMenu';

import { getSubaccount } from '@/state/accountSelectors';
import { getTransferInputs } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';

import { TokenSelectMenu } from './TokenSelectMenu';
import { WithdrawButtonAndReceipt } from './WithdrawForm/WithdrawButtonAndReceipt';
import { parse } from 'path';
import { s } from 'vitest/dist/types-2b1c412e';

export const WithdrawForm = () => {
  const stringGetter = useStringGetter();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { simulateWithdraw, sendSquidWithdraw } = useSubaccount();
  const { freeCollateral } = useSelector(getSubaccount, shallowEqual) || {};

  const { axelarscanURL } = useSquidRouter();

  // User input
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [slippage, setSlippage] = useState(0.01); // 0.1% slippage
  const debouncedAmount = useDebounce<string>(withdrawAmount, 500);

  const {
    requestPayload,
    token,
    chain,
    address: toAddress,
    resources,
  } = useSelector(getTransferInputs) || {};

  const toChain = useMemo(
    () => (chain ? resources?.chainResources?.get(chain) : undefined),
    [chain, resources]
  );
  const toToken = useMemo(
    () => (token ? resources?.tokenResources?.get(token) : undefined),
    [token, resources]
  );

  // Async Data
  const [transactionHash, setTransactionHash] = useState<string>();

  const debouncedAmountBN = MustBigNumber(debouncedAmount);
  const withdrawAmountBN = MustBigNumber(withdrawAmount);
  const freeCollateralBN = MustBigNumber(freeCollateral?.current);

  useEffect(() => {
    abacusStateManager.setTransferValue({
      value: TransferType.withdrawal.rawValue,
      field: TransferInputField.type,
    });

    return () => {
      abacusStateManager.clearTransferInputValues();
    };
  }, []);

  useEffect(() => {
    const setTransferValue = async () => {
      const hasInvalidInput = debouncedAmountBN.isNaN() || debouncedAmountBN.lte(0);

      const stdFee = await simulateWithdraw(parseFloat(debouncedAmount));
      const amount = hasInvalidInput
        ? 0
        : parseFloat(debouncedAmount) -
          parseFloat(stdFee?.amount[0]?.amount || '0') / QUANTUM_MULTIPLIER;

      abacusStateManager.setTransferValue({
        value: hasInvalidInput ? 0 : amount.toString(),
        field: TransferInputField.usdcSize,
      });

      setError(null);
    };

    setTransferValue();
  }, [debouncedAmountBN.toNumber()]);

  /**
   * @todo Withdrawing involves two steps.
   * 1. MsgCreateTransfer for withdrawing from the subaccount.
   * 2. MsgTransfer to IBC transfer the funds to the destination chain. 0xSquid will provide the IBC path instructions.
   */
  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      try {
        
        if (!requestPayload?.data || !debouncedAmountBN.toNumber()) {
          throw new Error('Invalid request payload');
        }
        const txHash = await sendSquidWithdraw(debouncedAmountBN.toNumber(), requestPayload?.data);

        if (txHash?.hash) {
          abacusStateManager.setTransferStatus({
            hash: `0x${Buffer.from(txHash.hash).toString('hex')}`,
            fromChainId: 'dydx-testnet-2',
            toChainId: toChain?.chainId?.toString(),
          })
        }
      } catch (error) {
        setError(error);
      }
    },
    [setTransactionHash, requestPayload, debouncedAmountBN]
  );

  const onChangeAddress = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    abacusStateManager.setTransferValue({
      field: TransferInputField.address,
      value: e.target.value,
    });
  }, []);

  const onChangeAmount = useCallback(
    ({ value }: NumberFormatValues) => {
      setWithdrawAmount(value);
    },
    [setWithdrawAmount]
  );

  const onSetSlippage = useCallback(
    (newSlippage: number) => {
      setSlippage(newSlippage);

      // if (MustBigNumber(newSlippage).gt(0) && debouncedAmountBN.gt(0)) {
      //   fetchRoute({ newAmount: debouncedAmount, newSlippage });
      // }
    },
    [setSlippage, debouncedAmount]
  );

  const onClickMax = useCallback(() => {
    setWithdrawAmount(freeCollateralBN.toString());
  }, [freeCollateral?.current, setWithdrawAmount]);

  const onSelectChain = useCallback((chain: TransferInputChainResource) => {
    if (chain) {
      abacusStateManager.clearTransferInputValues();
      abacusStateManager.setTransferValue({
        field: TransferInputField.chain,
        value: chain.chainId,
      });
      setWithdrawAmount('');
    }
  }, []);

  const onSelectToken = useCallback((token: TransferInputTokenResource) => {
    if (token) {
      abacusStateManager.clearTransferInputValues();
      abacusStateManager.setTransferValue({
        field: TransferInputField.token,
        value: token.address,
      });
      setWithdrawAmount('');
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
        <Styled.DiffOutput
          type={OutputType.Fiat}
          value={freeCollateral?.current}
          newValue={freeCollateral?.postOrder}
          sign={NumberSign.Negative}
          hasInvalidNewValue={withdrawAmountBN.minus(freeCollateralBN).isNegative()}
          withDiff={
            Boolean(withdrawAmount) && !debouncedAmountBN.isNaN() && !debouncedAmountBN.isZero()
          }
        />
      ),
    },
  ];

  let errorMessage = !toAddress ? 'Please enter a destination address' : undefined;

  const isDisabled =
    !!errorMessage ||
    !toToken ||
    !toChain ||
    debouncedAmountBN.isNaN() ||
    debouncedAmountBN.isZero();

  return (
    <Styled.Form onSubmit={onSubmit}>
      <Styled.DestinationRow>
        <FormInput
          type={InputType.Text}
          placeholder={stringGetter({ key: STRING_KEYS.ADDRESS })}
          onChange={onChangeAddress}
          value={toAddress || ''}
          label={stringGetter({ key: STRING_KEYS.ADDRESS })}
        />
        <ChainSelectMenu
          label={stringGetter({ key: STRING_KEYS.NETWORK })}
          selectedChain={toChain || undefined}
          onSelectChain={onSelectChain}
        />
      </Styled.DestinationRow>
      <TokenSelectMenu selectedToken={toToken || undefined} onSelectToken={onSelectToken} />
      <Styled.WithDetailsReceipt side="bottom" detailItems={amountInputReceipt}>
        <FormInput
          type={InputType.Number}
          onChange={onChangeAmount}
          value={withdrawAmount}
          label={stringGetter({ key: STRING_KEYS.AMOUNT })}
          slotRight={
            <Button
              type={ButtonType.Button}
              action={ButtonAction.Secondary}
              size={ButtonSize.XSmall}
              onClick={onClickMax}
            >
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
            <Styled.TransactionInfo>
              <Styled.Link href={`${axelarscanURL}/gmp/${transactionHash}`}>
                {stringGetter({ key: STRING_KEYS.VIEW_TRANSACTION })}
                <Icon iconName={IconName.LinkOut} />
              </Styled.Link>
            </Styled.TransactionInfo>
          </AlertMessage>
        )
      )}
      <WithdrawButtonAndReceipt
        isDisabled={isDisabled}
        setError={undefined}
        setSlippage={onSetSlippage}
        slippage={slippage}
        withdrawChain={toChain || undefined}
        withdrawToken={toToken || undefined}
      />
    </Styled.Form>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.DiffOutput = styled(DiffOutput)`
  --diffOutput-valueWithDiff-fontSize: 1em;
`;

Styled.Form = styled.form`
  min-height: calc(100% - var(--stickyArea0-bottomHeight));

  ${layoutMixins.flexColumn}
  gap: 1.25rem;

  ${layoutMixins.stickyArea1}
`;

Styled.DestinationRow = styled.div`
  ${layoutMixins.spacedRow}
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
