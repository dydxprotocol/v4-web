import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';
import type { NumberFormatValues } from 'react-number-format';
import { shallowEqual, useSelector } from 'react-redux';
import { isAddress } from 'viem';

import { TransferInputField, TransferInputTokenResource, TransferType } from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { AnalyticsEvent } from '@/constants/analytics';
import { ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { TransferNotificationTypes } from '@/constants/notifications';
import {
  MAX_CCTP_TRANSFER_AMOUNT,
  MAX_PRICE_IMPACT,
  MIN_CCTP_TRANSFER_AMOUNT,
  NumberSign,
  TOKEN_DECIMALS,
} from '@/constants/numbers';

import {
  useAccounts,
  useDebounce,
  useDydxClient,
  useRestrictions,
  useSelectedNetwork,
  useStringGetter,
  useSubaccount,
  useTokenConfigs,
  useWithdrawalInfo,
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

import { SourceSelectMenu } from '@/views/forms/AccountManagementForms/SourceSelectMenu';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { getSubaccount } from '@/state/accountSelectors';
import { getTransferInputs } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';
import { getNobleChainId } from '@/lib/squid';

import { TokenSelectMenu } from './TokenSelectMenu';
import { WithdrawButtonAndReceipt } from './WithdrawForm/WithdrawButtonAndReceipt';
import { validateCosmosAddress } from '@/lib/addressUtils';
import { track } from '@/lib/analytics';

export const WithdrawForm = () => {
  const stringGetter = useStringGetter();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const selectedDydxChainId = useSelector(getSelectedDydxChainId);

  const { sendSquidWithdraw } = useSubaccount();
  const { freeCollateral } = useSelector(getSubaccount, shallowEqual) || {};

  const {
    requestPayload,
    token,
    exchange,
    chain: chainIdStr,
    address: toAddress,
    resources,
    errors: routeErrors,
    errorMessage: routeErrorMessage,
    isCctp,
    summary,
  } = useSelector(getTransferInputs, shallowEqual) || {};

  // User input
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [slippage, setSlippage] = useState(isCctp ? 0 : 0.01); // 0.1% slippage
  const debouncedAmount = useDebounce<string>(withdrawAmount, 500);
  const { usdcLabel } = useTokenConfigs();
  const { usdcWithdrawalCapacity } = useWithdrawalInfo({ transferType: 'withdrawal' });

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

  useEffect(() => setSlippage(isCctp ? 0 : 0.01), [isCctp]);

  useEffect(() => {
    abacusStateManager.setTransferValue({
      field: TransferInputField.type,
      value: TransferType.withdrawal.rawValue,
    });

    return () => {
      abacusStateManager.resetInputState();
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
          const txHash = await sendSquidWithdraw(
            debouncedAmountBN.toNumber(),
            requestPayload.data,
            isCctp
          );
          const nobleChainId = getNobleChainId();
          const toChainId = Boolean(exchange) ? nobleChainId : chainIdStr || undefined;
          if (txHash && toChainId) {
            addTransferNotification({
              txHash: txHash,
              type: TransferNotificationTypes.Withdrawal,
              fromChainId: !isCctp ? selectedDydxChainId : nobleChainId,
              toChainId,
              toAmount: debouncedAmountBN.toNumber(),
              triggeredAt: Date.now(),
              isCctp,
              isExchange: Boolean(exchange),
            });
            abacusStateManager.clearTransferInputValues();
            setWithdrawAmount('');

            track(AnalyticsEvent.TransferWithdraw, {
              chainId: toChainId,
              tokenAddress: toToken?.address || undefined,
              tokenSymbol: toToken?.symbol || undefined,
            });
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
    [
      requestPayload,
      debouncedAmountBN,
      chainIdStr,
      toAddress,
      selectedDydxChainId,
      exchange,
      toToken,
      screenAddresses,
      stringGetter,
    ]
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

  const onSelectNetwork = useCallback((name: string, type: 'chain' | 'exchange') => {
    if (name) {
      setWithdrawAmount('');
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

  const { alertType, errorMessage } = useMemo(() => {
    if (error) {
      return {
        errorMessage: error,
      };
    }

    if (routeErrors) {
      return {
        errorMessage: routeErrorMessage
          ? stringGetter({
              key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
              params: { ERROR_MESSAGE: routeErrorMessage },
            })
          : stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG }),
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

    if (debouncedAmountBN) {
      if (!chainIdStr && !exchange) {
        return {
          errorMessage: stringGetter({ key: STRING_KEYS.WITHDRAW_MUST_SPECIFY_CHAIN }),
        };
      } else if (!toToken) {
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

    if (isCctp) {
      if (debouncedAmountBN.gte(MAX_CCTP_TRANSFER_AMOUNT)) {
        return {
          errorMessage: stringGetter({
            key: STRING_KEYS.MAX_CCTP_TRANSFER_LIMIT_EXCEEDED,
            params: {
              MAX_CCTP_TRANSFER_AMOUNT: MAX_CCTP_TRANSFER_AMOUNT,
            },
          }),
        };
      }
      if (
        !debouncedAmountBN.isZero() &&
        MustBigNumber(debouncedAmountBN).lte(MIN_CCTP_TRANSFER_AMOUNT)
      ) {
        return {
          errorMessage: 'Amount must be greater than 10 USDC',
        };
      }
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
                {usdcWithdrawalCapacity.toFormat(TOKEN_DECIMALS)}
                <Styled.Tag>{usdcLabel}</Styled.Tag>
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
    chainIdStr,
    debouncedAmountBN,
    toToken,
    toAddress,
    sanctionedAddresses,
    stringGetter,
    summary,
    usdcWithdrawalCapacity,
  ]);

  const isInvalidNobleAddress = Boolean(
    exchange && toAddress && !validateCosmosAddress(toAddress, 'noble')
  );

  const isDisabled =
    !!errorMessage ||
    !toToken ||
    (!chainIdStr && !exchange) ||
    !toAddress ||
    debouncedAmountBN.isNaN() ||
    debouncedAmountBN.isZero() ||
    isLoading ||
    isInvalidNobleAddress;

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
        <SourceSelectMenu
          selectedExchange={exchange || undefined}
          selectedChain={chainIdStr || undefined}
          onSelect={onSelectNetwork}
        />
      </Styled.DestinationRow>
      {isInvalidNobleAddress && (
        <AlertMessage type={AlertType.Error}>
          {stringGetter({ key: STRING_KEYS.NOBLE_ADDRESS_VALIDATION })}
        </AlertMessage>
      )}
      <TokenSelectMenu
        selectedToken={toToken || undefined}
        onSelectToken={onSelectToken}
        isExchange={Boolean(exchange)}
      />
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
      {errorMessage && (
        <Styled.AlertMessage type={alertType ?? AlertType.Error}>
          {errorMessage}
        </Styled.AlertMessage>
      )}
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

Styled.Tag = styled(Tag)`
  margin-left: 0.5ch;
`;

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

Styled.AlertMessage = styled(AlertMessage)`
  display: inline;
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

  color: var(--color-success);
  font-size: 0.625rem;
`;
