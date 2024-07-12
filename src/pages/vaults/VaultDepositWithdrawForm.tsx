import { FormEvent, useCallback, useState } from 'react';

import { NumberFormatValues } from 'react-number-format';
import styled, { css } from 'styled-components';

import {
  ButtonAction,
  ButtonShape,
  ButtonSize,
  ButtonState,
  ButtonType,
} from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { FormMaxInputToggleButton } from '@/components/FormMaxInputToggleButton';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { Output, OutputType } from '@/components/Output';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';

import { getSubaccount } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getUserVault } from '@/state/vaultSelectors';

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

export const VaultDepositWithdrawForm = () => {
  const stringGetter = useStringGetter();

  const { userBalance } = useAppSelector(getUserVault) ?? {};
  const { freeCollateral } = useAppSelector(getSubaccount) ?? {};

  const [selectedType, setSelectedType] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmountState] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentForm, setCurrentForm] = useState<'input' | 'confirm'>('input');

  const setAmount = ({ floatValue }: NumberFormatValues) => {};

  const onSubmitInputForm = useCallback(() => {
    setCurrentForm('confirm');
  }, []);
  const onSubmitConfirmForm = useCallback(() => {}, []);
  const onClickMax = useCallback(() => {
    if (selectedType === 'deposit') {
      setAmountState(`${freeCollateral ?? ''}`);
    } else {
      setAmountState(`${userBalance ?? ''}`);
    }
  }, [freeCollateral, selectedType, userBalance]);

  // todo errors, disable buttons
  // todo i18n
  const inputFormConfig =
    selectedType === 'deposit'
      ? {
          formLabel: 'Amount to Deposit',
          buttonLabel: currentForm === 'confirm' ? 'Confirm Deposit' : 'Preview Deposit',
          inputReceiptItems: [
            {
              key: 'cross-free-collateral',
              label: stringGetter({ key: STRING_KEYS.CROSS_FREE_COLLATERAL }),
              value: <div />,
            },
          ],
          receiptItems: [
            {
              key: 'cross-margin-usage',
              label: stringGetter({ key: STRING_KEYS.CROSS_MARGIN_USAGE }),
              value: <div />,
            },
            {
              key: 'vault-balance',
              label: stringGetter({ key: STRING_KEYS.YOUR_VAULT_BALANCE }),
              value: <div />,
            },
          ],
          transactionTarget: {
            label: 'dYdX Protocol Vault',
            icon: 'vault' as const,
          },
        }
      : {
          formLabel: 'Amount to Withdraw',
          buttonLabel: currentForm === 'confirm' ? 'Confirm Withdrawal' : 'Preview Withdrawal',
          inputReceiptItems: [
            {
              key: 'vault-balance',
              label: stringGetter({ key: STRING_KEYS.YOUR_VAULT_BALANCE }),
              value: <div />,
            },
          ],
          receiptItems: [
            {
              key: 'cross-free-collateral',
              label: stringGetter({ key: STRING_KEYS.CROSS_FREE_COLLATERAL }),
              value: <div />,
            },
            {
              key: 'slippage',
              label: 'Est. slippage',
              value: <div />,
            },
            {
              key: 'est amount',
              label: 'Expected Amount Received',
              value: <div />,
            },
          ],
          transactionTarget: {
            label: 'Cross Account',
            icon: 'cross' as const,
          },
        };

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

      <WithDetailsReceipt detailItems={inputFormConfig.receiptItems}>
        <Button
          type={ButtonType.Submit}
          action={ButtonAction.Primary}
          disabled={isSubmitting}
          state={isSubmitting ? ButtonState.Loading : ButtonState.Default}
        >
          {inputFormConfig.buttonLabel}
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
      <$FloatingDetails
        items={[...inputFormConfig.inputReceiptItems, ...inputFormConfig.receiptItems]}
      />
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
          disabled={isSubmitting}
          state={isSubmitting ? ButtonState.Loading : ButtonState.Default}
        >
          {inputFormConfig.buttonLabel}
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
