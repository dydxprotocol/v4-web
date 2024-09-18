import { FormEvent, useEffect, useMemo, useState } from 'react';

import { NumberFormatValues } from 'react-number-format';
import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { ErrorType, VaultFormValidationErrorType } from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Details } from '@/components/Details';
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
import { getVaultAccount, getVaultForm } from '@/state/vaultSelectors';
import {
  setVaultFormAmount,
  setVaultFormConfirmationStep,
  setVaultFormOperation,
  setVaultFormSlippageAck,
} from '@/state/vaults';

import { assertNever } from '@/lib/assertNever';
import { MustBigNumber } from '@/lib/numbers';
import { safeAssign } from '@/lib/objectHelpers';

// errors we don't want to show aggressive visual cues about, just disable submit
const lightErrorKeys = new Set<string>([
  'ACCOUNT_DATA_MISSING',
  'AMOUNT_EMPTY',
] satisfies VaultFormValidationErrorType['name'][]);

type VaultDepositWithdrawFormProps = {
  initialType?: 'deposit' | 'withdraw';
  onSuccess?: () => void;
};

function ex<T>(fn: () => T): T {
  return fn();
}

export const VaultDepositWithdrawForm = ({
  initialType,
  onSuccess,
}: VaultDepositWithdrawFormProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const { vaultsLearnMore } = useURLConfigs();
  const isAccountViewOnly = useAppSelector(calculateIsAccountViewOnly);
  const canViewAccount = useAppSelector(calculateCanViewAccount);

  const { amount, confirmationStep, slippageAck, operation, validationResponse } =
    useAppSelector(getVaultForm) ?? {};

  const { balanceUsdc: userBalance } = useAppSelector(getVaultAccount) ?? {};
  const { freeCollateral, marginUsage } = useAppSelector(getSubaccount) ?? {};

  const [isSubmitting] = useState(false);

  const freeCollateralUpdated = validationResponse?.summaryData.freeCollateral;
  const marginUsageUpdated = validationResponse?.summaryData.marginUsage;
  const userBalanceUpdated = validationResponse?.summaryData.vaultBalance;
  const slippagePercent = validationResponse?.summaryData.estimatedSlippage;
  const estimatedWithdrawalAmount = validationResponse?.summaryData.estimatedAmountReceived;

  // save initial type to state if it is provided
  useEffect(() => {
    if (initialType == null) {
      return;
    }
    dispatch(setVaultFormOperation(initialType === 'deposit' ? 'DEPOSIT' : 'WITHDRAW'));
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
        const errorStrings: { long?: string | JSX.Element; short?: string } = ex(() => {
          switch (error.type.name) {
            case 'ACCOUNT_DATA_MISSING':
              if (!canViewAccount) {
                return {
                  short: stringGetter({ key: STRING_KEYS.CONNECT_WALLET }),
                };
              }
              // todo this could also be because account data is loading
              return {
                short: stringGetter({ key: STRING_KEYS.NOT_ALLOWED }),
              };
            case 'AMOUNT_EMPTY':
              return {
                short:
                  operation === 'DEPOSIT'
                    ? stringGetter({ key: STRING_KEYS.ENTER_AMOUNT_TO_DEPOSIT })
                    : stringGetter({ key: STRING_KEYS.ENTER_AMOUNT_TO_WITHDRAW }),
              };
            case 'DEPOSIT_TOO_HIGH':
              return {
                long: stringGetter({ key: STRING_KEYS.DEPOSIT_TOO_HIGH }),
                short: stringGetter({ key: STRING_KEYS.MODIFY_SIZE_FIELD }),
              };
            case 'WITHDRAW_TOO_HIGH':
              return {
                long: stringGetter({ key: STRING_KEYS.WITHDRAW_TOO_HIGH }),
                short: stringGetter({ key: STRING_KEYS.MODIFY_SIZE_FIELD }),
              };
            case 'WITHDRAWING_LOCKED_BALANCE':
              return {
                long: stringGetter({ key: STRING_KEYS.WITHDRAW_TOO_HIGH }),
                short: stringGetter({ key: STRING_KEYS.MODIFY_SIZE_FIELD }),
              };
            case 'MUST_ACK_SLIPPAGE':
              return {
                short: stringGetter({ key: STRING_KEYS.ACKNOWLEDGE_HIGH_SLIPPAGE }),
              };
            case 'SLIPPAGE_TOO_HIGH':
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
            // essentially internal errors...
            case 'SLIPPAGE_RESPONSE_MISSING':
              return {};
            case 'SLIPPAGE_RESPONSE_WRONG_SHARES':
              return {};
            case 'VAULT_ACCOUNT_MISSING':
              return {};
            default:
              assertNever(error.type.name);
          }
          return {};
        });
        return safeAssign({}, error, errorStrings);
      }),
    [
      canViewAccount,
      operation,
      slippagePercent,
      stringGetter,
      validationResponse?.errors,
      vaultsLearnMore,
    ]
  );

  const onSubmitInputForm = () => {
    dispatch(setVaultFormConfirmationStep(true));
  };

  const onSubmitConfirmForm = () => {
    // TODO tell abacus and respond
    onSuccess?.();
  };

  const onClickMax = () => {
    if (operation === 'DEPOSIT') {
      setAmountState(`${freeCollateral ?? ''}`);
    } else {
      setAmountState(`${userBalance ?? ''}`);
    }
  };

  const freeCollateralDiff = (
    <DiffOutput
      type={OutputType.Fiat}
      value={freeCollateral?.current}
      newValue={freeCollateralUpdated}
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
      withDiff={
        MustBigNumber(amount).gt(0) &&
        userBalanceUpdated != null &&
        userBalanceUpdated !== userBalance
      }
    />
  );
  const marginUsageDiff = (
    <DiffOutput
      type={OutputType.Percent}
      value={marginUsage?.current}
      newValue={marginUsageUpdated}
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
              value: freeCollateralDiff,
            },
          ],
          receiptItems: [
            {
              key: 'cross-margin-usage',
              label: stringGetter({ key: STRING_KEYS.CROSS_MARGIN_USAGE }),
              value: marginUsageDiff,
            },
            {
              key: 'vault-balance',
              label: stringGetter({ key: STRING_KEYS.YOUR_VAULT_BALANCE }),
              value: vaultDiff,
            },
          ],
          transactionTarget: {
            label: stringGetter({ key: STRING_KEYS.PROTOCOL_VAULT }),
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
              label: stringGetter({ key: STRING_KEYS.YOUR_VAULT_BALANCE }),
              value: vaultDiff,
            },
          ],
          receiptItems: [
            {
              key: 'cross-free-collateral',
              label: stringGetter({ key: STRING_KEYS.CROSS_FREE_COLLATERAL }),
              value: freeCollateralDiff,
            },
            {
              key: 'slippage',
              label: stringGetter({ key: STRING_KEYS.EST_SLIPPAGE }),
              value: <Output type={OutputType.Percent} value={slippagePercent} />,
            },
            {
              key: 'est amount',
              label: stringGetter({ key: STRING_KEYS.EXPECTED_AMOUNT_RECEIVED }),
              value: <Output type={OutputType.Fiat} value={estimatedWithdrawalAmount} />,
            },
          ],
          transactionTarget: {
            label: stringGetter({ key: STRING_KEYS.CROSS_ACCOUNT }),
            icon: 'cross' as const,
          },
        };

  const errorsPreventingSubmit =
    errors?.filter((e) => e.severity.rawValue === ErrorType.error.rawValue) ?? [];
  const hasInputErrors = validationResponse == null || errorsPreventingSubmit.length > 0;

  const renderedErrors = errors
    ?.filter((e) => e.long != null)
    .map((alertMessage) => (
      <AlertMessage
        key={alertMessage.type.name}
        type={alertMessage.severity.name === 'error' ? AlertType.Error : AlertType.Warning}
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
              onPressedChange={(isPressed: boolean) =>
                isPressed ? onClickMax() : setAmountState('')
              }
            />
          }
        />
      </WithDetailsReceipt>

      {renderedErrors}

      <$FlexFill />

      <WithDetailsReceipt detailItems={inputFormConfig.receiptItems}>
        <Button
          type={ButtonType.Submit}
          action={ButtonAction.Primary}
          state={{
            isDisabled: hasInputErrors || !!isAccountViewOnly || !canViewAccount,
            isLoading: isSubmitting,
          }}
          slotLeft={
            errorsPreventingSubmit.find((f) => !lightErrorKeys.has(f.type.name)) != null ? (
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
          onClick={() => dispatch(setVaultFormConfirmationStep(false))}
          tw="pl-1 pr-1"
        >
          {stringGetter({ key: STRING_KEYS.EDIT })}
        </Button>
        <Button
          type={ButtonType.Submit}
          action={ButtonAction.Primary}
          state={{
            isDisabled: hasInputErrors || !!isAccountViewOnly || !canViewAccount,
            isLoading: isSubmitting,
          }}
          slotLeft={
            errorsPreventingSubmit.find((f) => !lightErrorKeys.has(f.type.name)) != null ? (
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
