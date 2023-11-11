import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';
import type { NumberFormatValues } from 'react-number-format';
import { shallowEqual, useSelector } from 'react-redux';
import { isAddress } from 'viem';

import { TransferInputField, TransferInputTokenResource, TransferType } from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { NotificationStatus } from '@/constants/notifications';
import { NumberSign } from '@/constants/numbers';

import {
  useAccounts,
  useDebounce,
  useDydxClient,
  useRestrictions,
  useSelectedNetwork,
  useStringGetter,
  useSubaccount,
} from '@/hooks';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';

import { layoutMixins } from '@/styles/layoutMixins';
import { formMixins } from '@/styles/formMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { Link } from '@/components/Link';
import { OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { Icon, IconName } from '@/components/Icon';

import { ChainSelectMenu } from '@/views/forms/AccountManagementForms/ChainSelectMenu';

import { getSubaccount } from '@/state/accountSelectors';
import { getTransferInputs } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';

import { TokenSelectMenu } from './TokenSelectMenu';
import { WithdrawButtonAndReceipt } from './WithdrawForm/WithdrawButtonAndReceipt';

export const WithdrawForm = () => {
  const stringGetter = useStringGetter();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const { selectedNetwork } = useSelectedNetwork();

  const { sendSquidWithdraw } = useSubaccount();
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
    errors: routeErrors,
    errorMessage: routeErrorMessage,
  } = useSelector(getTransferInputs, shallowEqual) || {};

  const isValidAddress = toAddress && isAddress(toAddress);

  const toToken = useMemo(
    () => (token ? resources?.tokenResources?.get(token) : undefined),
    [token, resources]
  );

  const { addTransferNotification } = useLocalNotifications();

  // Async Data
  const debouncedAmountBN = useMemo(() => MustBigNumber(debouncedAmount), [debouncedAmount]);
  const freeCollateralBN = useMemo(
    () => MustBigNumber(freeCollateral?.current),
    [freeCollateral?.current]
  );

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
          abacusStateManager.setTransferValue({
            value: debouncedAmount,
            field: TransferInputField.usdcSize,
          });
          setError(undefined);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    setTransferValue();
  }, [debouncedAmountBN]);

  const { screenAddresses } = useDydxClient();
  const { dydxAddress } = useAccounts();

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      try {
        e.preventDefault();

        if (!requestPayload?.data || !debouncedAmountBN.toNumber() || !toAddress || !dydxAddress) {
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
          const txHash = await sendSquidWithdraw(debouncedAmountBN.toNumber(), requestPayload.data);
          if (txHash?.hash) {
            const hash = `0x${Buffer.from(txHash.hash).toString('hex')}`;
            addTransferNotification({
              txHash: hash,
              fromChainId: ENVIRONMENT_CONFIG_MAP[selectedNetwork].dydxChainId,
              toChainId: chainIdStr || undefined,
              toAmount: debouncedAmountBN.toNumber(),
              triggeredAt: Date.now(),
              notificationStatus: NotificationStatus.Triggered,
            });
            abacusStateManager.clearTransferInputValues();
            setWithdrawAmount('');
          }
        }
      } catch (error) {
        if (error?.code === 429) {
          setError(stringGetter({ key: STRING_KEYS.RATE_LIMIT_REACHED_ERROR_MESSAGE }));
        } else {
          setError(
            error.message
              ? stringGetter({
                  key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
                  params: {
                    ERROR_MESSAGE:
                      error.message || stringGetter({ key: STRING_KEYS.UNKNOWN_ERROR }),
                  },
                })
              : stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG })
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [requestPayload, debouncedAmountBN, chainIdStr, toAddress, screenAddresses, stringGetter]
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
  }, [freeCollateralBN, setWithdrawAmount]);

  const onSelectChain = useCallback((chain: string) => {
    if (chain) {
      abacusStateManager.setTransferValue({
        field: TransferInputField.chain,
        value: chain,
      });
      setWithdrawAmount('');
    }
  }, []);

  const onSelectToken = useCallback((token: TransferInputTokenResource) => {
    if (token) {
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
          hasInvalidNewValue={MustBigNumber(withdrawAmount).minus(freeCollateralBN).isNegative()}
          withDiff={
            Boolean(withdrawAmount) && !debouncedAmountBN.isNaN() && !debouncedAmountBN.isZero()
          }
        />
      ),
    },
  ];

  const { sanctionedAddresses } = useRestrictions();

  const errorMessage = useMemo(() => {
    if (error) {
      return stringGetter({
        key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
        params: { ERROR_MESSAGE: error },
      });
    }

    if (routeErrors) {
      return routeErrorMessage
        ? stringGetter({
            key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
            params: { ERROR_MESSAGE: routeErrorMessage },
          })
        : stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG });
    }

    if (!toAddress) return stringGetter({ key: STRING_KEYS.WITHDRAW_MUST_SPECIFY_ADDRESS });

    if (sanctionedAddresses.has(toAddress))
      return stringGetter({
        key: STRING_KEYS.TRANSFER_INVALID_DYDX_ADDRESS,
      });

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
  }, [
    error,
    routeErrors,
    routeErrorMessage,
    freeCollateralBN,
    chainIdStr,
    debouncedAmountBN,
    toToken,
    toAddress,
    sanctionedAddresses,
    stringGetter,
  ]);

  const isDisabled =
    !!errorMessage ||
    !toToken ||
    !chainIdStr ||
    !toAddress ||
    debouncedAmountBN.isNaN() ||
    debouncedAmountBN.isZero() ||
    isLoading;

  return (
    <Styled.Form onSubmit={onSubmit}>
      <Styled.DestinationRow>
        <FormInput
          type={InputType.Text}
          placeholder={stringGetter({ key: STRING_KEYS.ADDRESS })}
          onChange={onChangeAddress}
          value={toAddress || ''}
          label={
            <span>
              {stringGetter({ key: STRING_KEYS.DESTINATION })}{' '}
              {isValidAddress ? <Styled.CheckIcon iconName={IconName.Check} /> : null}
            </span>
          }
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
            <Styled.FormInputButton size={ButtonSize.XSmall} onClick={onClickMax}>
              {stringGetter({ key: STRING_KEYS.MAX })}
            </Styled.FormInputButton>
          }
        />
      </Styled.WithDetailsReceipt>
      {errorMessage && <AlertMessage type={AlertType.Error}>{errorMessage}</AlertMessage>}
      <Styled.Footer>
        <WithdrawButtonAndReceipt
          isDisabled={isDisabled}
          isLoading={isLoading}
          setSlippage={onSetSlippage}
          slippage={slippage}
          withdrawChain={chainIdStr || undefined}
          withdrawToken={toToken || undefined}
        />
      </Styled.Footer>
    </Styled.Form>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.DiffOutput = styled(DiffOutput)`
  --diffOutput-valueWithDiff-fontSize: 1em;
`;

Styled.Form = styled.form`
  ${formMixins.transfersForm}
`;

Styled.Footer = styled.footer`
  ${formMixins.footer}
  --stickyFooterBackdrop-outsetY: var(--dialog-content-paddingBottom);
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

Styled.FormInputButton = styled(Button)`
  ${formMixins.inputInnerButton}
`;

Styled.CheckIcon = styled(Icon)`
  margin: 0 1ch;

  color: var(--color-positive);
  font-size: 0.625rem;
`;
