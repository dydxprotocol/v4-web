import { FormEvent, useEffect, useMemo, useState } from 'react';

import { IndexedTx } from '@cosmjs/stargate';
import { NumberFormatValues } from 'react-number-format';
import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { AlertType } from '@/constants/alerts';
import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { QUANTUM_MULTIPLIER } from '@/constants/numbers';
import { timeUnits } from '@/constants/time';

import { useCustomNotification } from '@/hooks/useCustomNotification';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useURLConfigs } from '@/hooks/useURLConfigs';
import {
  useForceRefreshVaultAccount,
  useForceRefreshVaultDetails,
  useLoadedVaultAccount,
  useVaultFormErrorState,
  useVaultFormValidationResponse,
} from '@/hooks/vaultsHooks';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Details, DetailsItem } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { FormMaxInputToggleButton } from '@/components/FormMaxInputToggleButton';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';

import { calculateCanViewAccount, calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { getSubaccount } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getVaultForm } from '@/state/vaultSelectors';
import {
  resetVaultForm,
  setVaultFormAmount,
  setVaultFormConfirmationStep,
  setVaultFormOperation,
  setVaultFormSlippageAck,
} from '@/state/vaults';

import { track } from '@/lib/analytics/analytics';
import { dd } from '@/lib/analytics/datadog';
import { assertNever } from '@/lib/assertNever';
import { mapIfPresent, runFn } from '@/lib/do';
import { MustBigNumber, getNumberSign } from '@/lib/numbers';
import { safeAssign } from '@/lib/objectHelpers';
import { sleep } from '@/lib/timeUtils';
import { orEmptyObj } from '@/lib/typeUtils';

// errors we don't want to show aggressive visual cues about, just disable submit
const lightErrorKeys = new Set<string>(['ACCOUNT_DATA_MISSING', 'AMOUNT_EMPTY']);

type VaultDepositWithdrawFormProps = {
  initialType?: 'DEPOSIT' | 'WITHDRAW';
  onSuccess?: () => void;
};

const INDEXER_LAG_ALLOWANCE = timeUnits.second * 2.5;

const $SmallIcon = styled(Icon)<{ $hasError?: boolean }>`
  ${({ $hasError }) => ($hasError ? 'color: var(--color-error);' : 'color: var(--color-success);')}
`;

export const VaultDepositWithdrawForm = ({
  initialType,
  onSuccess,
}: VaultDepositWithdrawFormProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const { vaultsLearnMore } = useURLConfigs();
  const isAccountViewOnly = useAppSelector(calculateIsAccountViewOnly);
  const canViewAccount = useAppSelector(calculateCanViewAccount);

  const { amount, confirmationStep, slippageAck, operation } = useAppSelector(getVaultForm) ?? {};
  const validationResponse = useVaultFormValidationResponse();

  const { balanceUsdc: userBalance, withdrawableUsdc: userAvailableBalance } = orEmptyObj(
    useLoadedVaultAccount().data
  );
  const { freeCollateral, marginUsage } = orEmptyObj(useAppSelector(getSubaccount));

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    freeCollateral: freeCollateralUpdated,
    estimatedAmountReceived: estimatedWithdrawalAmount,
    estimatedSlippage: slippagePercent,
    vaultBalance: userBalanceUpdated,
    marginUsage: marginUsageUpdated,
    withdrawableVaultBalance: userAvailableUpdated,
  } = orEmptyObj(validationResponse?.summaryData);

  // save initial type to state if it is provided
  useEffect(() => {
    if (initialType == null) {
      return;
    }
    dispatch(setVaultFormOperation(initialType));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAmount = (change: NumberFormatValues) => {
    dispatch(setVaultFormAmount(change.value));
  };
  const setAmountState = (newVal: string) => {
    dispatch(setVaultFormAmount(newVal));
  };
  const setOperation = (op: 'DEPOSIT' | 'WITHDRAW') => {
    dispatch(setVaultFormOperation(op));
  };

  const errors = useMemo(
    () =>
      validationResponse?.errors.toArray().map((error) => {
        const errorStrings: { long?: string | JSX.Element; short?: string } = runFn(() => {
          const longKey = error.resources.text?.stringKey;
          const shortKey = error.resources.title?.stringKey;
          const long = longKey != null ? stringGetter({ key: longKey }) : undefined;
          const short = shortKey != null ? stringGetter({ key: shortKey }) : undefined;
          if (error.code === 'SLIPPAGE_TOO_HIGH') {
            return {
              long: (
                <span>
                  {stringGetter({
                    key: STRING_KEYS.SLIPPAGE_WARNING,
                    params: {
                      AMOUNT: <$InlineOutput value={slippagePercent} type={OutputType.Percent} />,
                      LINK: (
                        <Link href={vaultsLearnMore} withIcon isInline>
                          {stringGetter({ key: STRING_KEYS.VAULT_FAQS })}
                        </Link>
                      ),
                    },
                  })}
                </span>
              ),
            };
          }
          return { long, short };
        });
        return safeAssign({}, error, errorStrings);
      }),
    [slippagePercent, stringGetter, validationResponse?.errors, vaultsLearnMore]
  );

  const onSubmitInputForm = () => {
    dispatch(setVaultFormConfirmationStep(true));
  };

  const { depositToMegavault, withdrawFromMegavault } = useSubaccount();
  const forceRefreshVaultAccount = useForceRefreshVaultAccount();
  const forceRefreshVault = useForceRefreshVaultDetails();
  const notify = useCustomNotification();
  const [submissionError, handleSubmissionError] = useVaultFormErrorState();

  const onSubmitConfirmForm = async () => {
    if (isSubmitting) {
      return;
    }
    track(
      AnalyticsEvents.AttemptVaultOperation({
        amount: MustBigNumber(amount).toNumber(),
        operation,
        slippage: validationResponse.summaryData.estimatedSlippage,
      })
    );
    setIsSubmitting(true);
    try {
      const { submissionData } = validationResponse;
      if (operation === 'DEPOSIT') {
        const cachedAmount = submissionData?.deposit?.amount;
        if (cachedAmount == null) {
          notify({
            slotTitleLeft: <$SmallIcon iconName={IconName.OrderCanceled} $hasError />,
            title: stringGetter({ key: STRING_KEYS.MEGAVAULT_CANT_SUBMIT }),
            body: stringGetter({ key: STRING_KEYS.MEGAVAULT_CANT_SUBMIT_BODY }),
          });
          track(
            AnalyticsEvents.VaultOperationPreAborted({
              amount: MustBigNumber(amount).toNumber(),
              operation,
            })
          );
          dd.error('Megavault deposit blocked, invalid validation response amount', {
            deposit: submissionData?.deposit,
          });
          // eslint-disable-next-line no-console
          console.error(
            'Somehow got to deposit submission with empty amount in validation response'
          );
          return;
        }

        await depositToMegavault(cachedAmount);
        await sleep(INDEXER_LAG_ALLOWANCE);

        track(
          AnalyticsEvents.SuccessfulVaultOperation({
            amount: MustBigNumber(amount).toNumber(),
            operation,
            amountDiff: undefined,
          })
        );
        notify({
          title: stringGetter({ key: STRING_KEYS.MEGAVAULT_DEPOSIT_SUCCESSFUL }),
          slotTitleLeft: <$SmallIcon iconName={IconName.CheckCircle} />,
          body: stringGetter({
            key: STRING_KEYS.MEGAVAULT_DEPOSIT_SUCCESSFUL_BODY,
            params: {
              AMOUNT: (
                <Output
                  tw="inline-block text-color-text-1"
                  type={OutputType.Fiat}
                  value={cachedAmount}
                />
              ),
            },
          }),
        });
      } else if (operation === 'WITHDRAW') {
        if (
          submissionData?.withdraw?.shares == null ||
          submissionData?.withdraw?.minAmount == null
        ) {
          notify({
            slotTitleLeft: <$SmallIcon iconName={IconName.OrderCanceled} $hasError />,
            title: stringGetter({ key: STRING_KEYS.MEGAVAULT_CANT_SUBMIT }),
            body: stringGetter({ key: STRING_KEYS.MEGAVAULT_CANT_SUBMIT_BODY }),
          });
          track(
            AnalyticsEvents.VaultOperationPreAborted({
              amount: MustBigNumber(amount).toNumber(),
              operation,
            })
          );
          dd.error('Megavault withdraw blocked, invalid validation response values', {
            withdraw: submissionData?.withdraw,
          });
          // eslint-disable-next-line no-console
          console.error(
            'Somehow got to withdraw submission with empty data in validation response'
          );
          return;
        }

        const preEstimate = validationResponse.summaryData.estimatedAmountReceived;
        const result = await withdrawFromMegavault(
          submissionData?.withdraw?.shares,
          submissionData?.withdraw?.minAmount
        );
        await sleep(INDEXER_LAG_ALLOWANCE);

        const events = (result as IndexedTx)?.events;
        const actualAmount = events
          ?.find((e) => e.type === 'withdraw_from_megavault')
          ?.attributes.find((a) => a.key === 'redeemed_quote_quantums')?.value;
        const realAmountReceived = MustBigNumber(actualAmount).div(QUANTUM_MULTIPLIER).toNumber();

        track(
          AnalyticsEvents.SuccessfulVaultOperation({
            amount: realAmountReceived,
            operation,
            amountDiff: Math.abs((preEstimate ?? 0) - (realAmountReceived ?? 0)),
          })
        );
        notify({
          slotTitleLeft: <$SmallIcon iconName={IconName.CheckCircle} />,
          title: stringGetter({ key: STRING_KEYS.MEGAVAULT_WITHDRAWAL_SUCCESSFUL }),
          body: stringGetter({
            key: STRING_KEYS.MEGAVAULT_WITHDRAWAL_SUCCESSFUL_BODY,
            params: {
              AMOUNT:
                amount == null ? (
                  stringGetter({ key: STRING_KEYS.UNKNOWN })
                ) : (
                  <Output
                    tw="inline-block text-color-text-1"
                    type={OutputType.Fiat}
                    value={realAmountReceived}
                  />
                ),
            },
          }),
        });
      } else {
        assertNever(operation);
      }

      dispatch(resetVaultForm());
      onSuccess?.();
    } catch (e) {
      handleSubmissionError(e);

      notify({
        slotTitleLeft: <$SmallIcon iconName={IconName.OrderCanceled} $hasError />,
        title: stringGetter({
          key:
            operation === 'DEPOSIT'
              ? STRING_KEYS.MEGAVAULT_DEPOSIT_FAILED
              : STRING_KEYS.MEGAVAULT_WITHDRAWAL_FAILED,
        }),
        body: stringGetter({
          key:
            operation === 'DEPOSIT'
              ? STRING_KEYS.MEGAVAULT_DEPOSIT_FAILED_BODY
              : STRING_KEYS.MEGAVAULT_WITHDRAWAL_FAILED_BODY,
        }),
      });
      track(
        AnalyticsEvents.VaultOperationProtocolError({
          operation,
        })
      );
      dd.error('Megavault transaction failed', { ...validationResponse.submissionData }, e);
      // eslint-disable-next-line no-console
      console.error('Error submitting megavault transaction', e);
    } finally {
      forceRefreshVaultAccount();
      forceRefreshVault();
      setIsSubmitting(false);
    }
  };

  const onClickMax = () => {
    if (operation === 'DEPOSIT') {
      setAmountState(`${Math.floor(freeCollateral?.current ?? 0) ?? ''}`);
    } else {
      setAmountState(`${Math.floor(100 * (userAvailableBalance ?? 0)) / 100 ?? ''}`);
    }
  };

  const freeCollateralDiff = (
    <DiffOutput
      type={OutputType.Fiat}
      value={freeCollateral?.current}
      newValue={freeCollateralUpdated}
      sign={getNumberSign(
        mapIfPresent(
          freeCollateralUpdated,
          freeCollateral?.current,
          (updated, cur) => updated - cur
        )
      )}
      withDiff={
        MustBigNumber(amount).gt(0) &&
        freeCollateralUpdated != null &&
        freeCollateral?.current !== freeCollateralUpdated
      }
    />
  );
  const vaultDiff = (
    <DiffOutput
      type={OutputType.Fiat}
      value={userBalance}
      newValue={userBalanceUpdated}
      sign={getNumberSign(
        mapIfPresent(userBalanceUpdated, userBalance ?? 0.0, (updated, cur) => updated - cur)
      )}
      withDiff={
        MustBigNumber(amount).gt(0) &&
        userBalanceUpdated != null &&
        userBalanceUpdated !== userBalance
      }
    />
  );
  const availableToWithdrawDiff = (
    <DiffOutput
      type={OutputType.Fiat}
      value={userAvailableBalance}
      newValue={userAvailableUpdated}
      sign={getNumberSign(
        mapIfPresent(
          userAvailableUpdated,
          userAvailableBalance ?? 0.0,
          (updated, cur) => updated - cur
        )
      )}
      withDiff={
        MustBigNumber(amount).gt(0) &&
        userAvailableUpdated != null &&
        userAvailableUpdated !== userAvailableBalance
      }
    />
  );
  const marginUsageDiff = (
    <DiffOutput
      type={OutputType.Percent}
      value={marginUsage?.current}
      newValue={marginUsageUpdated}
      sign={getNumberSign(
        mapIfPresent(marginUsage?.current, marginUsageUpdated, (updated, cur) => updated - cur)
      )}
      withDiff={
        MustBigNumber(amount).gt(0) &&
        marginUsageUpdated != null &&
        marginUsage?.current !== marginUsageUpdated
      }
    />
  );

  const inputFormConfig =
    operation === 'DEPOSIT'
      ? {
          formLabel: stringGetter({ key: STRING_KEYS.AMOUNT_TO_DEPOSIT }),
          buttonLabel: confirmationStep
            ? stringGetter({ key: STRING_KEYS.CONFIRM_DEPOSIT })
            : stringGetter({ key: STRING_KEYS.PREVIEW_DEPOSIT }),
          inputReceiptItems: [
            {
              key: 'cross-free-collateral',
              label: stringGetter({ key: STRING_KEYS.CROSS_FREE_COLLATERAL }),
              tooltip: 'cross-free-collateral',
              value: freeCollateralDiff,
            },
          ] satisfies DetailsItem[],
          receiptItems: [
            {
              key: 'cross-margin-usage',
              tooltip: 'cross-margin-usage',
              label: stringGetter({ key: STRING_KEYS.CROSS_MARGIN_USAGE }),
              value: marginUsageDiff,
            },
            {
              key: 'vault-balance',
              tooltip: 'vault-your-balance',
              label: stringGetter({ key: STRING_KEYS.YOUR_VAULT_BALANCE }),
              value: vaultDiff,
            },
          ] satisfies DetailsItem[],
          transactionTarget: {
            label: stringGetter({ key: STRING_KEYS.MEGAVAULT }),
            icon: 'vault' as const,
          },
        }
      : {
          formLabel: stringGetter({ key: STRING_KEYS.AMOUNT_TO_WITHDRAW }),
          buttonLabel: confirmationStep
            ? stringGetter({ key: STRING_KEYS.CONFIRM_WITHDRAW })
            : stringGetter({ key: STRING_KEYS.PREVIEW_WITHDRAW }),
          inputReceiptItems: [
            {
              key: 'vault-balance',
              tooltip: 'vault-available-to-withdraw',
              label: stringGetter({ key: STRING_KEYS.AVAILABLE_TO_WITHDRAW }),
              value: availableToWithdrawDiff,
            },
          ] satisfies DetailsItem[],
          receiptItems: [
            {
              key: 'cross-free-collateral',
              tooltip: 'cross-free-collateral',
              label: stringGetter({ key: STRING_KEYS.CROSS_FREE_COLLATERAL }),
              value: freeCollateralDiff,
            },
            {
              key: 'slippage',
              label: stringGetter({ key: STRING_KEYS.ESTIMATED_SLIPPAGE }),
              tooltip: 'vault-estimated-slippage',
              value: <Output type={OutputType.Percent} value={slippagePercent} />,
            },
            {
              key: 'est amount',
              tooltip: 'vault-estimated-amount',
              label: stringGetter({ key: STRING_KEYS.ESTIMATED_AMOUNT_RECEIVED }),
              value: <Output type={OutputType.Fiat} value={estimatedWithdrawalAmount} />,
            },
          ] satisfies DetailsItem[],
          transactionTarget: {
            label: stringGetter({ key: STRING_KEYS.CROSS_ACCOUNT }),
            icon: 'cross' as const,
          },
        };

  const errorsPreventingSubmit = errors?.filter((e) => e.type.name === 'error') ?? [];
  const hasInputErrors = validationResponse == null || errorsPreventingSubmit.length > 0;

  const renderedErrors = errors
    ?.filter((e) => e.long != null)
    .map((alertMessage) => (
      <AlertMessage
        key={alertMessage.code}
        type={alertMessage.type.name === 'error' ? AlertType.Error : AlertType.Warning}
      >
        {alertMessage.long}
      </AlertMessage>
    ));

  const inputForm = (
    <$Form
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSubmitInputForm();
      }}
    >
      <div tw="row gap-0.5">
        <$TypeButton
          shape={ButtonShape.Rectangle}
          size={ButtonSize.Base}
          action={ButtonAction.Navigation}
          $active={operation === 'DEPOSIT'}
          onClick={() => setOperation('DEPOSIT')}
        >
          {stringGetter({ key: STRING_KEYS.DEPOSIT })}
        </$TypeButton>
        <$TypeButton
          shape={ButtonShape.Rectangle}
          size={ButtonSize.Base}
          action={ButtonAction.Navigation}
          $active={operation === 'WITHDRAW'}
          onClick={() => setOperation('WITHDRAW')}
        >
          {stringGetter({ key: STRING_KEYS.WITHDRAW })}
        </$TypeButton>
      </div>

      <WithDetailsReceipt side="bottom" detailItems={inputFormConfig.inputReceiptItems}>
        <FormInput
          type={InputType.Currency}
          label={inputFormConfig.formLabel}
          value={amount}
          onChange={setAmount}
          disabled={isAccountViewOnly || !canViewAccount}
          slotRight={
            <FormMaxInputToggleButton
              size={ButtonSize.XSmall}
              isInputEmpty={amount === ''}
              isLoading={false}
              disabled={isAccountViewOnly || !canViewAccount}
              onPressedChange={(isPressed: boolean) =>
                isPressed ? onClickMax() : setAmountState('')
              }
            />
          }
        />
      </WithDetailsReceipt>

      {renderedErrors}

      {submissionError && <AlertMessage type={AlertType.Error}>{submissionError}</AlertMessage>}

      <$FlexFill />

      <WithDetailsReceipt detailItems={inputFormConfig.receiptItems}>
        <Button
          type={ButtonType.Submit}
          action={ButtonAction.Primary}
          state={{
            isDisabled: hasInputErrors || !!isAccountViewOnly || !canViewAccount || isSubmitting,
            isLoading: isSubmitting,
          }}
          slotLeft={
            errorsPreventingSubmit.find((f) => !lightErrorKeys.has(f.code)) != null ? (
              <$WarningIcon iconName={IconName.Warning} />
            ) : undefined
          }
        >
          {hasInputErrors && errorsPreventingSubmit[0]?.short != null
            ? errorsPreventingSubmit[0]?.short
            : inputFormConfig.buttonLabel}
        </Button>
      </WithDetailsReceipt>
    </$Form>
  );
  const confirmForm = (
    <$Form
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSubmitConfirmForm();
      }}
    >
      <div tw="grid grid-cols-[1fr_auto_1fr] grid-rows-[auto_auto] gap-x-0.25 gap-y-0.5">
        <$SourceLabel>{inputFormConfig.formLabel}</$SourceLabel>
        <$TargetLabel>{stringGetter({ key: STRING_KEYS.DESTINATION })}</$TargetLabel>
        <$SourceBox>
          <AssetIcon symbol="USDC" tw="h-2 w-2" />
          <Output value={amount} type={OutputType.Fiat} />
        </$SourceBox>
        <$Arrow>
          <$Icon iconName={IconName.ChevronRight} />
          <$Icon iconName={IconName.ChevronRight} />
        </$Arrow>
        <$TargetBox>
          {inputFormConfig.transactionTarget.icon === 'cross' ? (
            <div tw="grid h-2 w-2 items-center justify-center rounded-1 bg-color-layer-6">C</div>
          ) : (
            <img src="/dydx-chain.png" tw="h-2 w-2" />
          )}
          <div>{inputFormConfig.transactionTarget.label}</div>
        </$TargetBox>
      </div>

      {renderedErrors}

      {submissionError && <AlertMessage type={AlertType.Error}>{submissionError}</AlertMessage>}

      <$FlexFill />

      <$FloatingDetails
        items={[...inputFormConfig.inputReceiptItems, ...inputFormConfig.receiptItems]}
      />

      {validationResponse?.summaryData.needSlippageAck && (
        <Checkbox
          checked={slippageAck}
          onCheckedChange={(checked) => dispatch(setVaultFormSlippageAck(checked))}
          id="slippage-ack"
          label={
            <span>
              {stringGetter({
                key: STRING_KEYS.SLIPPAGE_ACK,
                params: {
                  AMOUNT: <$InlineOutput type={OutputType.Percent} value={slippagePercent} />,
                },
              })}
            </span>
          }
        />
      )}

      <div tw="grid grid-cols-[min-content_1fr] gap-1">
        <Button
          type={ButtonType.Button}
          action={ButtonAction.Secondary}
          onClick={() => {
            track(
              AnalyticsEvents.VaultFormPreviewStep({
                amount: MustBigNumber(amount).toNumber(),
                operation,
              })
            );
            dispatch(setVaultFormConfirmationStep(false));
          }}
          tw="pl-1 pr-1"
        >
          {stringGetter({ key: STRING_KEYS.EDIT })}
        </Button>
        <Button
          type={ButtonType.Submit}
          action={ButtonAction.Primary}
          state={{
            isDisabled: hasInputErrors || !!isAccountViewOnly || !canViewAccount || isSubmitting,
            isLoading: isSubmitting,
          }}
          slotLeft={
            errorsPreventingSubmit.find((f) => !lightErrorKeys.has(f.code)) != null ? (
              <$WarningIcon iconName={IconName.Warning} />
            ) : undefined
          }
        >
          {hasInputErrors ? errorsPreventingSubmit[0]?.short : inputFormConfig.buttonLabel}
        </Button>
      </div>
    </$Form>
  );
  return <div tw="p-1.5">{confirmationStep ? confirmForm : inputForm}</div>;
};

const $TypeButton = styled(Button)<{ $active: boolean }>`
  padding: 0.5rem 1.25rem;
  font: var(--font-medium-medium);

  ${({ $active }) =>
    $active
      ? css`
          background-color: var(--color-layer-1);
          color: var(--color-text-2);
        `
      : css`
          color: var(--color-text-0);
        `};
`;

const $Form = styled.form`
  ${formMixins.transfersForm}
  --form-input-gap: 1.25rem;
`;

const $FloatingDetails = styled(Details)`
  --details-item-vertical-padding: 0.33rem;
  background-color: var(--color-layer-1);
  border-radius: 0.5em;

  padding: 0.375rem 0.75rem 0.25rem;

  font-size: var(--details-item-fontSize, 0.8125em);
`;
const $Icon = tw(Icon)`text-color-text-0`;
const labels = css`
  font: var(--font-small-book);
  color: var(--color-text-0);
  display: grid;
  align-items: center;
  justify-content: center;
`;

const $SourceLabel = styled.div`
  ${labels}
  grid-area: 1 / 1;
`;

const $TargetLabel = styled.div`
  ${labels}
  grid-area: 1 / 3;
`;

const boxes = css`
  ${layoutMixins.flexColumn}
  gap: .5rem;
  border-radius: 0.625rem;
  background: var(--color-layer-4);
  padding: 1rem;
  justify-content: center;
  align-items: center;
  font: var(--font-small-medium);
`;

const $SourceBox = styled.div`
  ${boxes}
  grid-area: 2 / 1;
`;

const $Arrow = styled.div`
  grid-area: 2 / 2;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-0);
  width: 1.75rem;
  font: var(--font-small-book);

  > :first-child {
    left: 0.2rem;
    position: relative;
    opacity: 0.5;
  }
  > :last-child {
    left: -0.2rem;
    position: relative;
  }
`;

const $TargetBox = styled.div`
  ${boxes}
  grid-area: 2 / 3;
`;
const $WarningIcon = tw(Icon)`text-color-warning`;

const $InlineOutput = tw(Output)`inline`;

const $FlexFill = tw.div`mt-[calc(var(--form-input-gap)_*_-1)] flex-1`;
