/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { NumberFormatValues } from 'react-number-format';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';
import { isAddress } from 'viem';

import { TransferInputField, TransferInputTokenResource, TransferType } from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { AnalyticsEvents } from '@/constants/analytics';
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
  USD_DECIMALS,
} from '@/constants/numbers';
import { WalletType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useDebounce } from '@/hooks/useDebounce';
import { useDydxClient } from '@/hooks/useDydxClient';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';
import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useRestrictions } from '@/hooks/useRestrictions';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';
import { useWithdrawalInfo } from '@/hooks/useWithdrawalInfo';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { FormMaxInputToggleButton } from '@/components/FormMaxInputToggleButton';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { OutputType, formatNumberOutput } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { WithTooltip } from '@/components/WithTooltip';
import { SourceSelectMenu } from '@/views/forms/AccountManagementForms/SourceSelectMenu';

import { getSubaccount } from '@/state/accountSelectors';
import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getTransferInputs } from '@/state/inputsSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';

import abacusStateManager from '@/lib/abacus';
import { validateCosmosAddress } from '@/lib/addressUtils';
import { track } from '@/lib/analytics';
import { MustBigNumber } from '@/lib/numbers';
import { getNobleChainId } from '@/lib/squid';
import { log } from '@/lib/telemetry';

import { TokenSelectMenu } from './TokenSelectMenu';
import { WithdrawButtonAndReceipt } from './WithdrawForm/WithdrawButtonAndReceipt';

export const WithdrawForm = () => {
  const stringGetter = useStringGetter();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const { sendSquidWithdraw } = useSubaccount();
  const { freeCollateral } = useAppSelector(getSubaccount, shallowEqual) ?? {};

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
  } = useAppSelector(getTransferInputs, shallowEqual) ?? {};

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
      } catch (err) {
        setError(err.message);
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
          const toChainId = exchange ? nobleChainId : chainIdStr || undefined;
          if (txHash && toChainId) {
            addTransferNotification({
              txHash,
              type: TransferNotificationTypes.Withdrawal,
              fromChainId: !isCctp ? selectedDydxChainId : nobleChainId,
              toChainId,
              toAmount: debouncedAmountBN.toNumber(),
              triggeredAt: Date.now(),
              isCctp,
              isExchange: Boolean(exchange),
              requestId: requestPayload.requestId ?? undefined,
            });
            abacusStateManager.clearTransferInputValues();
            setWithdrawAmount('');

            track(
              AnalyticsEvents.TransferWithdraw({
                chainId: toChainId,
                tokenAddress: toToken?.address || undefined,
                tokenSymbol: toToken?.symbol || undefined,
                slippage: slippage || undefined,
                gasFee: summary?.gasFee || undefined,
                bridgeFee: summary?.bridgeFee || undefined,
                exchangeRate: summary?.exchangeRate || undefined,
                estimatedRouteDuration: summary?.estimatedRouteDuration || undefined,
                toAmount: summary?.toAmount || undefined,
                toAmountMin: summary?.toAmountMin || undefined,
              })
            );
          }
        }
      } catch (err) {
        log('WithdrawForm/onSubmit', err);
        if (err?.code === 429) {
          setError(stringGetter({ key: STRING_KEYS.RATE_LIMIT_REACHED_ERROR_MESSAGE }));
        } else {
          setError(
            err.message
              ? stringGetter({
                  key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
                  params: {
                    ERROR_MESSAGE: err.message || stringGetter({ key: STRING_KEYS.UNKNOWN_ERROR }),
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

  const onSelectToken = useCallback((selectedToken: TransferInputTokenResource) => {
    if (selectedToken) {
      abacusStateManager.setTransferValue({
        field: TransferInputField.token,
        value: selectedToken.address,
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
        <$DiffOutput
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
  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();
  const selectedLocale = useAppSelector(getSelectedLocale);

  const { alertType, errorMessage } = useMemo(() => {
    if (isCctp) {
      if (debouncedAmountBN.gte(MAX_CCTP_TRANSFER_AMOUNT)) {
        return {
          errorMessage: stringGetter({
            key: STRING_KEYS.MAX_CCTP_TRANSFER_LIMIT_EXCEEDED,
            params: {
              MAX_CCTP_TRANSFER_AMOUNT,
            },
          }),
        };
      }
      if (
        !debouncedAmountBN.isZero() &&
        MustBigNumber(debouncedAmountBN).lte(MIN_CCTP_TRANSFER_AMOUNT)
      ) {
        return {
          errorMessage: stringGetter({
            key: STRING_KEYS.AMOUNT_MINIMUM_ERROR,
            params: {
              NUMBER: MIN_CCTP_TRANSFER_AMOUNT,
              TOKEN: usdcLabel,
            },
          }),
        };
      }
    }
    if (error) {
      return {
        errorMessage: error,
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

    if (routeErrors) {
      track(
        AnalyticsEvents.RouteError({
          transferType: TransferType.withdrawal.name,
          errorMessage: routeErrorMessage ?? undefined,
          amount: debouncedAmount,
          chainId: chainIdStr ?? undefined,
          assetId: toToken?.toString(),
        })
      );
      return {
        errorMessage: routeErrorMessage
          ? stringGetter({
              key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
              params: { ERROR_MESSAGE: routeErrorMessage },
            })
          : stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG }),
      };
    }

    if (debouncedAmountBN) {
      if (!chainIdStr && !exchange) {
        return {
          errorMessage: stringGetter({ key: STRING_KEYS.WITHDRAW_MUST_SPECIFY_CHAIN }),
        };
      }
      if (!toToken) {
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
                {formatNumberOutput(usdcWithdrawalCapacity, OutputType.Number, {
                  decimalSeparator,
                  groupSeparator,
                  selectedLocale,
                  fractionDigits: TOKEN_DECIMALS,
                })}
                <$Tag>{usdcLabel}</$Tag>
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
    <$Form onSubmit={onSubmit}>
      <$Subheader>
        {stringGetter({
          key: STRING_KEYS.LOWEST_FEE_WITHDRAWALS,
          params: {
            LOWEST_FEE_TOKENS_TOOLTIP: (
              <WithTooltip tooltip="lowest-fees">
                {stringGetter({
                  key: STRING_KEYS.SELECT_CHAINS,
                })}
              </WithTooltip>
            ),
          },
        })}
      </$Subheader>
      <$DestinationRow>
        <FormInput
          type={InputType.Text}
          placeholder={stringGetter({ key: STRING_KEYS.ADDRESS })}
          onChange={onChangeAddress}
          value={toAddress || ''}
          label={
            <span>
              {stringGetter({ key: STRING_KEYS.DESTINATION })}{' '}
              {isValidAddress ? <$CheckIcon iconName={IconName.Check} /> : null}
            </span>
          }
        />
        <SourceSelectMenu
          selectedExchange={exchange || undefined}
          selectedChain={chainIdStr || undefined}
          onSelect={onSelectNetwork}
        />
      </$DestinationRow>
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
      <$WithDetailsReceipt side="bottom" detailItems={amountInputReceipt}>
        <FormInput
          type={InputType.Number}
          decimals={USD_DECIMALS}
          onChange={onChangeAmount}
          value={withdrawAmount}
          label={stringGetter({ key: STRING_KEYS.AMOUNT })}
          slotRight={
            <FormMaxInputToggleButton
              size={ButtonSize.XSmall}
              isInputEmpty={withdrawAmount === ''}
              isLoading={isLoading}
              onPressedChange={(isPressed: boolean) =>
                isPressed ? onClickMax() : setWithdrawAmount('')
              }
            />
          }
        />
      </$WithDetailsReceipt>
      {errorMessage && (
        <$AlertMessage type={alertType ?? AlertType.Error}>{errorMessage}</$AlertMessage>
      )}
      <$Footer>
        <WithdrawButtonAndReceipt
          isDisabled={isDisabled}
          isLoading={isLoading}
          setSlippage={onSetSlippage}
          slippage={slippage}
          withdrawToken={toToken || undefined}
        />
      </$Footer>
    </$Form>
  );
};
const $Subheader = styled.div`
  color: var(--color-text-0);
`;

const $Tag = styled(Tag)`
  margin-left: 0.5ch;
`;

const $DiffOutput = styled(DiffOutput)`
  --diffOutput-valueWithDiff-fontSize: 1em;
`;

const $Form = styled.form`
  ${formMixins.transfersForm}
`;

const $Footer = styled.footer`
  ${formMixins.footer}
  --stickyFooterBackdrop-outsetY: var(--dialog-content-paddingBottom);
`;

const $DestinationRow = styled.div`
  ${layoutMixins.spacedRow}
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const $AlertMessage = styled(AlertMessage)`
  display: inline;
`;

const $WithDetailsReceipt = styled(WithDetailsReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
`;

const $CheckIcon = styled(Icon)`
  margin: 0 1ch;

  color: var(--color-success);
  font-size: 0.625rem;
`;
