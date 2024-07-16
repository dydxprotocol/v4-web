import { FormEvent, useCallback, useMemo, useState } from 'react';

import { NumberFormatValues } from 'react-number-format';
import styled, { css } from 'styled-components';

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
import { useAppSelector } from '@/state/appTypes';
import { getUserVault } from '@/state/vaultSelectors';

import { MustBigNumber } from '@/lib/numbers';

const renderDiffOutput = ({
  type,
  value,
  newValue,
  showSign,
  withDiff,
}: Pick<
  Parameters<typeof DiffOutput>[0],
  'type' | 'value' | 'newValue' | 'withDiff' | 'showSign'
>) => (
  <DiffOutput
    type={type}
    value={value}
    newValue={newValue}
    showSign={showSign}
    withDiff={withDiff}
  />
);

type VaultFormError = {
  type: AlertType;
  key: string;
  short?: string;
  long?: React.ReactNode;
};

// errors we don't want to show aggressive visual cues about, just disable submit
const lightErrorKeys = new Set(['disconnected', 'view-only', 'amount-empty']);

const SLIPPAGE_PERCENT_WARN = 0.01;
const SLIPPAGE_PERCENT_ACK = 0.01;

type VaultDepositWithdrawFormProps = {
  initialType?: 'deposit' | 'withdraw';
  onSuccess?: () => void;
};

export const VaultDepositWithdrawForm = ({
  initialType,
  onSuccess,
}: VaultDepositWithdrawFormProps) => {
  const stringGetter = useStringGetter();
  const { vaultsLearnMore } = useURLConfigs();
  const isAccountViewOnly = useAppSelector(calculateIsAccountViewOnly);
  const canViewAccount = useAppSelector(calculateCanViewAccount);

  const { userBalance } = useAppSelector(getUserVault) ?? {};
  const { freeCollateral, marginUsage } = useAppSelector(getSubaccount) ?? {};

  const [selectedType, setSelectedType] = useState<'deposit' | 'withdraw'>(
    initialType ?? 'deposit'
  );
  const [amount, setAmountState] = useState('');
  const [isSubmitting] = useState(false);
  const [currentForm, setCurrentForm] = useState<'input' | 'confirm'>('input');
  const [slippageAck, setSlippageAck] = useState(false);

  const slippagePercent = 0.05;
  const estimatedWithdrawalAmount = MustBigNumber(amount).times(1 - slippagePercent);
  const freeCollateralUpdated =
    selectedType === 'deposit'
      ? MustBigNumber(MustBigNumber(freeCollateral?.current).minus(amount).toFixed(2)).toNumber()
      : MustBigNumber(freeCollateral?.current).plus(estimatedWithdrawalAmount).toNumber();
  const marginUsageUpdated =
    selectedType === 'deposit'
      ? MustBigNumber(marginUsage?.current).minus(0.05).toNumber()
      : MustBigNumber(marginUsage?.current).plus(0.05).toNumber();
  const userBalanceUpdated =
    selectedType === 'deposit'
      ? MustBigNumber(userBalance).plus(amount).toNumber()
      : MustBigNumber(userBalance).minus(amount).toNumber();

  const setAmount = (change: NumberFormatValues) => {
    setAmountState(change.value);
  };

  const errors = useMemo((): VaultFormError[] => {
    if (!canViewAccount) {
      return [
        {
          type: AlertType.Error,
          key: 'disconnected',
          short: stringGetter({ key: STRING_KEYS.CONNECT_WALLET }),
        },
      ];
    }
    if (isAccountViewOnly) {
      return [
        {
          type: AlertType.Error,
          key: 'view-only',
          short: stringGetter({ key: STRING_KEYS.NOT_ALLOWED }),
        },
      ];
    }
    if (MustBigNumber(amount).eq(0)) {
      return [
        {
          type: AlertType.Error,
          key: 'amount-empty',
          short:
            selectedType === 'deposit'
              ? stringGetter({ key: STRING_KEYS.ENTER_AMOUNT_TO_DEPOSIT })
              : stringGetter({ key: STRING_KEYS.ENTER_AMOUNT_TO_WITHDRAW }),
        },
      ];
    }
    const allErrors: VaultFormError[] = [];
    if (selectedType === 'deposit') {
      if (freeCollateralUpdated == null || freeCollateralUpdated < 0) {
        allErrors.push({
          type: AlertType.Error,
          key: 'deposit-high',
          long: stringGetter({ key: STRING_KEYS.DEPOSIT_TOO_HIGH }),
          short: 'Modify amount',
        });
      }
    } else {
      if (userBalanceUpdated == null || userBalanceUpdated < 0) {
        allErrors.push({
          type: AlertType.Error,
          key: 'withdraw-high',
          long: stringGetter({ key: STRING_KEYS.WITHDRAW_TOO_HIGH }),
          short: 'Modify amount',
        });
      }
      if (slippagePercent >= SLIPPAGE_PERCENT_WARN) {
        allErrors.push({
          type: AlertType.Warning,
          key: 'slippage-high',
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
        });
        if (slippagePercent >= SLIPPAGE_PERCENT_ACK && !slippageAck && currentForm === 'confirm') {
          allErrors.push({
            type: AlertType.Error,
            key: 'slippage-acked',
            short: stringGetter({ key: STRING_KEYS.ACKNOWLEDGE_HIGH_SLIPPAGE }),
          });
        }
      }
    }

    return allErrors;
  }, [
    amount,
    canViewAccount,
    currentForm,
    freeCollateralUpdated,
    isAccountViewOnly,
    selectedType,
    slippageAck,
    stringGetter,
    userBalanceUpdated,
    vaultsLearnMore,
  ]);

  const onSubmitInputForm = useCallback(() => {
    setCurrentForm('confirm');
  }, []);

  const onSubmitConfirmForm = useCallback(() => {
    // TODO tell abacus and respond
    onSuccess?.();
  }, [onSuccess]);

  const onClickMax = useCallback(() => {
    if (selectedType === 'deposit') {
      setAmountState(`${freeCollateral ?? ''}`);
    } else {
      setAmountState(`${userBalance ?? ''}`);
    }
  }, [freeCollateral, selectedType, userBalance]);

  const freeCollateralDiff = renderDiffOutput({
    type: OutputType.Fiat,
    value: freeCollateral?.current,
    newValue: freeCollateralUpdated,
    withDiff:
      MustBigNumber(amount).gt(0) &&
      freeCollateralUpdated != null &&
      freeCollateral?.current !== freeCollateralUpdated,
  });
  const vaultDiff = renderDiffOutput({
    type: OutputType.Fiat,
    value: userBalance,
    newValue: userBalanceUpdated,
    withDiff:
      MustBigNumber(amount).gt(0) &&
      userBalanceUpdated != null &&
      userBalanceUpdated !== userBalance,
  });
  const marginUsageDiff = renderDiffOutput({
    type: OutputType.Percent,
    value: marginUsage?.current,
    newValue: marginUsageUpdated,
    withDiff:
      MustBigNumber(amount).gt(0) &&
      marginUsageUpdated != null &&
      marginUsage?.current !== marginUsageUpdated,
  });

  // todo i18n
  const inputFormConfig =
    selectedType === 'deposit'
      ? {
          formLabel: stringGetter({ key: STRING_KEYS.AMOUNT_TO_DEPOSIT }),
          buttonLabel:
            currentForm === 'confirm'
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
          buttonLabel:
            currentForm === 'confirm'
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

  const errorErrors = errors.filter((e) => e.type === AlertType.Error);
  const hasInputErrors = errorErrors.length > 0;

  const renderedErrors = errors
    .filter((e) => e.long != null)
    .map((alertMessage) => (
      <AlertMessage key={alertMessage.key} type={alertMessage.type}>
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
      <$HeaderRow>
        <$TypeButton
          shape={ButtonShape.Rectangle}
          size={ButtonSize.Base}
          action={ButtonAction.Navigation}
          $active={selectedType === 'deposit'}
          onClick={() => setSelectedType('deposit')}
        >
          {stringGetter({ key: STRING_KEYS.DEPOSIT })}
        </$TypeButton>
        <$TypeButton
          shape={ButtonShape.Rectangle}
          size={ButtonSize.Base}
          action={ButtonAction.Navigation}
          $active={selectedType === 'withdraw'}
          onClick={() => setSelectedType('withdraw')}
        >
          {stringGetter({ key: STRING_KEYS.WITHDRAW })}
        </$TypeButton>
      </$HeaderRow>

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
            errorErrors.find((f) => !lightErrorKeys.has(f.key)) != null ? (
              <$WarningIcon iconName={IconName.Warning} />
            ) : undefined
          }
        >
          {hasInputErrors ? errorErrors[0]?.short : inputFormConfig.buttonLabel}
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
      <$GridContainer>
        <$SourceLabel>{inputFormConfig.formLabel}</$SourceLabel>
        <$TargetLabel>{stringGetter({ key: STRING_KEYS.DESTINATION })}</$TargetLabel>
        <$SourceBox>
          <$AssetIcon symbol="USDC" />
          <Output value={amount} type={OutputType.Fiat} />
        </$SourceBox>
        <$Arrow>
          <$Icon iconName={IconName.ChevronRight} />
          <$Icon iconName={IconName.ChevronRight} />
        </$Arrow>
        <$TargetBox>
          {inputFormConfig.transactionTarget.icon === 'cross' ? (
            <$CrossIcon>C</$CrossIcon>
          ) : (
            <$VaultImg src="/dydx-chain.png" />
          )}
          <div>{inputFormConfig.transactionTarget.label}</div>
        </$TargetBox>
      </$GridContainer>

      {renderedErrors}

      <$FlexFill />

      <$FloatingDetails
        items={[...inputFormConfig.inputReceiptItems, ...inputFormConfig.receiptItems]}
      />

      {slippagePercent >= SLIPPAGE_PERCENT_ACK && selectedType === 'withdraw' && (
        <Checkbox
          checked={slippageAck}
          onCheckedChange={setSlippageAck}
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

      <$ConfirmButtonGroup>
        <$EditButton
          type={ButtonType.Button}
          action={ButtonAction.Secondary}
          onClick={() => setCurrentForm('input')}
        >
          {stringGetter({ key: STRING_KEYS.EDIT })}
        </$EditButton>
        <Button
          type={ButtonType.Submit}
          action={ButtonAction.Primary}
          state={{
            isDisabled: hasInputErrors || !!isAccountViewOnly || !canViewAccount,
            isLoading: isSubmitting,
          }}
          slotLeft={
            errorErrors.find((f) => !lightErrorKeys.has(f.key)) != null ? (
              <$WarningIcon iconName={IconName.Warning} />
            ) : undefined
          }
        >
          {hasInputErrors ? errorErrors[0]?.short : inputFormConfig.buttonLabel}
        </Button>
      </$ConfirmButtonGroup>
    </$Form>
  );
  return <$Container>{currentForm === 'input' ? inputForm : confirmForm}</$Container>;
};

const $Container = styled.div`
  padding: 1.5rem;
`;

const $HeaderRow = styled.div`
  ${layoutMixins.row}
  gap: .5rem;
`;

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

const $ConfirmButtonGroup = styled.div`
  grid-template-columns: min-content 1fr;
  display: grid;
  gap: 1rem;
`;

const $EditButton = styled(Button)`
  padding-left: 1rem;
  padding-right: 1rem;
`;

const $Icon = styled(Icon)`
  color: var(--color-text-0);
`;

const $AssetIcon = styled(AssetIcon)`
  width: 2rem;
  height: 2rem;
`;
const $GridContainer = styled.div`
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: 1fr auto 1fr;
  row-gap: 0.5rem;
  column-gap: 0.25rem;
`;

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

const $VaultImg = styled.img`
  width: 2rem;
  height: 2rem;
`;

const $CrossIcon = styled.div`
  width: 2rem;
  height: 2rem;
  display: grid;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background-color: var(--color-layer-6);
`;

const $WarningIcon = styled(Icon)`
  color: var(--color-warning);
`;

const $InlineOutput = styled(Output)`
  display: inline;
`;

const $FlexFill = styled.div`
  flex: 1;
  margin-top: calc(var(--form-input-gap) * -1);
`;
