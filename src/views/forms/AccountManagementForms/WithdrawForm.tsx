import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';
import type { NumberFormatValues } from 'react-number-format';
import { shallowEqual, useSelector } from 'react-redux';
import { TESTNET_CHAIN_ID } from '@dydxprotocol/v4-client';

import {
  TransferInputField,
  TransferInputTokenResource,
  TransferType,
} from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, QUANTUM_MULTIPLIER } from '@/constants/numbers';

import { useDebounce, useStringGetter, useSubaccount } from '@/hooks';
import { useNotifications } from '@/hooks/useNotifications';

import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
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

export const WithdrawForm = () => {
  const stringGetter = useStringGetter();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { simulateWithdraw, sendSquidWithdraw } = useSubaccount();
  const { freeCollateral } = useSelector(getSubaccount, shallowEqual) || {};

  // User input
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [slippage, setSlippage] = useState(0.01); // 0.1% slippage
  const debouncedAmount = useDebounce<string>(withdrawAmount, 500);

  const {
    requestPayload,
    token,
    chain: chainIdStr,
    address: toAddress,
    resources,
  } = useSelector(getTransferInputs, shallowEqual) || {};

  const toToken = useMemo(
    () => (token ? resources?.tokenResources?.get(token) : undefined),
    [token, resources]
  );

  const { addTransferNotification } = useNotifications();

  // Async Data
  const [transactionHash, setTransactionHash] = useState<string>();

  const debouncedAmountBN = MustBigNumber(debouncedAmount);
  const withdrawAmountBN = MustBigNumber(withdrawAmount);
  const freeCollateralBN = MustBigNumber(freeCollateral?.current);

  useEffect(() => {
    abacusStateManager.setTransferValue({
      field: TransferInputField.type,
      value: TransferType.withdrawal.rawValue,
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
    const setTransferValue = async () => {
      try {
        setIsLoading(true);
        const hasInvalidInput = debouncedAmountBN.isNaN() || debouncedAmountBN.lte(0);
        if (hasInvalidInput) {
          abacusStateManager.setTransferValue({
            value: 0,
            field: TransferInputField.usdcSize,
          });
        } else {
          const stdFee = await simulateWithdraw(parseFloat(debouncedAmount));
          const amount =
            parseFloat(debouncedAmount) -
            parseFloat(stdFee?.amount[0]?.amount || '0') / QUANTUM_MULTIPLIER;

          abacusStateManager.setTransferValue({
            value: amount.toString(),
            field: TransferInputField.usdcSize,
          });

          setError(null);
        }
      } catch (error) {
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    setTransferValue();
  }, [debouncedAmountBN.toNumber()]);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      try {
        e.preventDefault();

        if (!requestPayload?.data || !debouncedAmountBN.toNumber()) {
          throw new Error('Invalid request payload');
        }

        setIsLoading(true);
        const txHash = await sendSquidWithdraw(debouncedAmountBN.toNumber(), requestPayload?.data);
        
        if (txHash?.hash) {
          const hash = `0x${Buffer.from(txHash.hash).toString('hex')}`;
          
          setTransactionHash(hash);
          
          addTransferNotification({
            txHash: hash,
            fromChainId: TESTNET_CHAIN_ID,
            toChainId: chainIdStr || undefined,
            toAmount: debouncedAmountBN.toNumber(),
          });
          abacusStateManager.clearTransferInputValues();
          setWithdrawAmount('');
        }
      } catch (error) {
        setError(error);
      } finally {
        setIsLoading(false);
      }
    },
    [setTransactionHash, requestPayload, debouncedAmountBN, chainIdStr]
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

      // TODO: to be implemented via abacus
      // if (MustBigNumber(newSlippage).gt(0) && debouncedAmountBN.gt(0)) {
      //   fetchRoute({ newAmount: debouncedAmount, newSlippage });
      // }
    },
    [setSlippage, debouncedAmount]
  );

  const onClickMax = useCallback(() => {
    setWithdrawAmount(freeCollateralBN.toString());
  }, [freeCollateral?.current, setWithdrawAmount]);

  const onSelectChain = useCallback((chain: string) => {
    if (chain) {
      abacusStateManager.clearTransferInputValues();
      abacusStateManager.setTransferValue({
        field: TransferInputField.chain,
        value: chain,
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

  const errorMessage = useMemo(() => {
    if (error) {
      return error?.message
        ? stringGetter({
            key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
            params: { ERROR_MESSAGE: error.message },
          })
        : stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG });
    }

    if (!toAddress) return stringGetter({ key: STRING_KEYS.WITHDRAW_MUST_SPECIFY_ADDRESS });

    if (debouncedAmountBN) {
      if (!chainIdStr) {
        return stringGetter({ key: STRING_KEYS.WITHDRAW_MUST_SPECIFY_CHAIN });
      } else if (!toToken) {
        return stringGetter({ key: STRING_KEYS.WITHDRAW_MUST_SPECIFY_ASSET });
      }
    }

    if (MustBigNumber(debouncedAmountBN).gt(MustBigNumber(freeCollateralBN))) {
      return stringGetter({ key: STRING_KEYS.WITHDRAW_MORE_THAN_FREE });
    }

    return undefined;
  }, [error, freeCollateralBN, chainIdStr, debouncedAmountBN, toToken]);

  const isDisabled =
    !!errorMessage ||
    !toToken ||
    !chainIdStr ||
    !toAddress ||
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
          label={stringGetter({ key: STRING_KEYS.DESTINATION })}
        />
        <ChainSelectMenu
          label={stringGetter({ key: STRING_KEYS.NETWORK })}
          selectedChain={chainIdStr || undefined}
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
              {stringGetter({ key: STRING_KEYS.WITHDRAW_IN_PROGRESS })}
            </Styled.TransactionInfo>
          </AlertMessage>
        )
      )}
      <WithdrawButtonAndReceipt
        isDisabled={isDisabled}
        isLoading={isLoading}
        setSlippage={onSetSlippage}
        slippage={slippage}
        withdrawChain={chainIdStr || undefined}
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
  --form-input-height: 3.5rem;

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
