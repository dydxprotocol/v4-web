import { useMemo, useState, type FormEvent } from 'react';

import { TransferToken } from '@/bonsai/forms/transfers';
import { parseTransactionError } from '@/bonsai/lib/extractErrors';
import { ErrorType } from '@/bonsai/lib/validationErrors';
import { validation } from '@dydxprotocol/v4-client-js';
import { noop } from 'lodash';
import { type NumberFormatValues } from 'react-number-format';
import type { SyntheticInputEvent } from 'react-number-format/types/types';
import styled from 'styled-components';

import { Nullable } from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { DydxChainAsset } from '@/constants/wallets';

import { useTransferForm } from '@/hooks/transferHooks';
import { useAccounts } from '@/hooks/useAccounts';
import { useDydxClient } from '@/hooks/useDydxClient';
import { useRestrictions } from '@/hooks/useRestrictions';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';
import { useWithdrawalInfo } from '@/hooks/useWithdrawalInfo';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { AssetIcon } from '@/components/AssetIcon';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { FormMaxInputToggleButton } from '@/components/FormMaxInputToggleButton';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { OutputType } from '@/components/Output';
import { SelectItem, SelectMenu } from '@/components/SelectMenu';
import { Tag } from '@/components/Tag';
import { ToggleButton } from '@/components/ToggleButton';
import { ValidationAlertMessage } from '@/components/ValidationAlert';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { TransferButtonAndReceipt } from '@/views/forms/TransferForm/TransferButtonAndReceipt';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { useDisappearingValue } from '@/lib/disappearingValue';
import { calc } from '@/lib/do';
import { log } from '@/lib/telemetry';
import { isValidKey } from '@/lib/typeUtils';

type TransferFormProps = {
  selectedAsset?: DydxChainAsset;
  onDone?: () => void;
  className?: string;
};

export const TransferForm = ({
  selectedAsset = DydxChainAsset.CHAINTOKEN,
  onDone,
  className,
}: TransferFormProps) => {
  const stringGetter = useStringGetter();

  const { dydxAddress } = useAccounts();
  const { transfer } = useSubaccount();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const { tokensConfigs, usdcImage, usdcLabel, chainTokenImage, chainTokenLabel } =
    useTokenConfigs();
  useWithdrawalInfo({ transferType: 'transfer' });

  const form = useTransferForm(selectedAsset === DydxChainAsset.USDC);

  const {
    memo,
    amountInput: { amount, type: transferType },
    recipientAddress,
  } = form.state;

  // Form states
  const [error, setError] = useDisappearingValue<string>();
  const [isLoading, setIsLoading] = useState(false);

  const onChangeAsset = (newAsset: Nullable<DydxChainAsset>) => {
    setError(undefined);

    if (newAsset === DydxChainAsset.CHAINTOKEN) {
      form.actions.setNativeAmount('');
    } else if (newAsset === DydxChainAsset.USDC) {
      form.actions.setUsdcAmount('');
    }
  };

  const { sanctionedAddresses } = useRestrictions();

  const isAddressValid = useMemo(
    () =>
      recipientAddress &&
      dydxAddress !== recipientAddress &&
      validation.isValidAddress(recipientAddress) &&
      !sanctionedAddresses.has(recipientAddress),
    [recipientAddress, sanctionedAddresses, dydxAddress]
  );

  const isUSDCSelected = transferType === TransferToken.USDC;
  const isChainTokenSelected = transferType === TransferToken.NATIVE;
  const showMemoField = isChainTokenSelected;

  const asset = isUSDCSelected ? DydxChainAsset.USDC : DydxChainAsset.CHAINTOKEN;

  const { screenAddresses } = useDydxClient();

  const canSubmit = useMemo(
    () =>
      form.errors.find((e) => e.type === ErrorType.error) == null && form.summary.payload != null,
    [form.errors, form.summary.payload]
  );
  const onTransfer = async () => {
    // const assetDenom = isValidKey(asset, tokensConfigs) ? tokensConfigs[asset].denom : undefined;
    const payload = form.summary.payload;
    if (!canSubmit || payload == null) {
      return;
    }
    setIsLoading(true);
    setError(undefined);

    try {
      const screenResults = await screenAddresses({
        addresses: [recipientAddress!, dydxAddress!],
      });

      if (screenResults[dydxAddress!]) {
        setError(
          stringGetter({
            key: STRING_KEYS.WALLET_RESTRICTED_WITHDRAWAL_TRANSFER_ORIGINATION_ERROR_MESSAGE,
          })
        );
      } else if (screenResults[recipientAddress!]) {
        setError(
          stringGetter({
            key: STRING_KEYS.WALLET_RESTRICTED_WITHDRAWAL_TRANSFER_DESTINATION_ERROR_MESSAGE,
          })
        );
      } else {
        const txResponse = await transfer(payload);
        if (txResponse.type === 'success') {
          // eslint-disable-next-line no-console
          console.log('TransferForm > txReceipt > ', txResponse.payload.hash);
          onDone?.();
        } else {
          throw new Error(txResponse.errorString || 'Transaction did not commit.');
        }
      }
    } catch (err) {
      if (err?.code === 429) {
        setError(stringGetter({ key: STRING_KEYS.RATE_LIMIT_REACHED_ERROR_MESSAGE }));
      } else {
        setError(
          err.message
            ? stringGetter({
                key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
                params: {
                  ERROR_MESSAGE: stringGetter({
                    key:
                      parseTransactionError('TransferForm onTransfer', err.message)?.stringKey ??
                      STRING_KEYS.UNKNOWN_ERROR,
                  }),
                },
              })
            : stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG })
        );
      }
      log('TransferForm/onTransfer', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onChangeAddress = (value?: string) => {
    form.actions.setRecipientAddress(value ?? '');
  };

  const onChangeAmount = (value?: string) => {
    if (isUSDCSelected) {
      form.actions.setUsdcAmount(value ?? '');
    } else {
      form.actions.setNativeAmount(value ?? '');
    }
  };

  const onChangeMemo = (value: string) => {
    form.actions.setMemo(value);
  };

  const onPasteAddress = async () => {
    try {
      const value = await navigator.clipboard.readText();
      onChangeAddress(value);
    } catch (err) {
      // expected error if user rejects clipboard access
    }
  };

  const onPasteMemo = async () => {
    try {
      const value = await navigator.clipboard.readText();
      onChangeMemo(value);
    } catch (err) {
      // expected error if user rejects clipboard access
    }
  };

  const selectedTokenConfig = isValidKey(asset, tokensConfigs) ? tokensConfigs[asset] : undefined;

  const assetOptions = [
    {
      value: DydxChainAsset.USDC,
      label: (
        <$InlineRow>
          <AssetIcon logoUrl={usdcImage} symbol="USDC" /> {usdcLabel}
        </$InlineRow>
      ),
    },
    {
      value: DydxChainAsset.CHAINTOKEN,
      label: (
        <$InlineRow>
          <AssetIcon logoUrl={chainTokenImage} symbol={chainTokenLabel} />
          {chainTokenLabel}
        </$InlineRow>
      ),
    },
  ];

  const networkOptions = [
    {
      chainId: selectedDydxChainId,
      label: (
        <$InlineRow>
          <AssetIcon symbol="DYDX" /> {stringGetter({ key: STRING_KEYS.DYDX_CHAIN })}
        </$InlineRow>
      ),
    },
  ];

  const { balanceBefore, balanceAfter } = calc(() => {
    if (isUSDCSelected) {
      return {
        balanceBefore: form.summary.accountBefore.freeCollateral,
        balanceAfter: form.summary.accountAfter.freeCollateral,
      };
    }
    return {
      balanceBefore: form.summary.accountBefore.availableNativeBalance,
      balanceAfter: form.summary.accountAfter.availableNativeBalance,
    };
  });

  const amountDetailItems = [
    {
      key: 'amount',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.AVAILABLE })} <Tag>{selectedTokenConfig?.name}</Tag>
        </span>
      ),
      value: (
        <DiffOutput
          type={OutputType.Asset}
          value={balanceBefore}
          sign={NumberSign.Negative}
          newValue={balanceAfter}
          hasInvalidNewValue={(balanceAfter ?? 0) < 0}
          withDiff={
            form.summary.inputs.amount != null && balanceBefore != null && balanceAfter != null
          }
          fractionDigits={isUSDCSelected ? USD_DECIMALS : TOKEN_DECIMALS}
        />
      ),
    },
  ];

  const renderFormInputButton = ({
    label,
    isInputEmpty,
    onClear,
    onClick,
  }: {
    label: string;
    isInputEmpty: boolean;
    onClear: () => void;
    onClick: () => void;
  }) => (
    <$FormInputToggleButton
      size={ButtonSize.XSmall}
      isPressed={!isInputEmpty}
      onPressedChange={(isPressed: boolean) => (isPressed ? onClick : onClear)()}
      disabled={isLoading}
      shape={isInputEmpty ? ButtonShape.Rectangle : ButtonShape.Circle}
    >
      {isInputEmpty ? label : <Icon iconName={IconName.Close} />}
    </$FormInputToggleButton>
  );

  const onToggleMaxButton = (isPressed: boolean) =>
    isPressed ? onChangeAmount(balanceBefore?.toString() ?? '') : onChangeAmount(undefined);

  const firstError = useMemo(
    () => form.errors.find((e) => e.type === ErrorType.error),
    [form.errors]
  );
  const ctaErrorAction = useMemo(() => {
    const key = firstError?.resources.title?.stringKey;
    return key ? stringGetter({ key }) : undefined;
  }, [firstError?.resources.title?.stringKey, stringGetter]);

  const validationAlert = useMemo(() => {
    return firstError?.resources.text?.stringKey != null ? firstError : undefined;
  }, [firstError]);

  const hasErrors = useMemo(() => {
    return firstError != null;
  }, [firstError]);

  return (
    <$Form
      className={className}
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onTransfer();
      }}
    >
      <$Row>
        <FormInput
          id="destination"
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          onInput={(e: SyntheticInputEvent) => onChangeAddress(e.target?.value)}
          label={
            <span tw="inlineRow">
              {stringGetter({ key: STRING_KEYS.DESTINATION })}
              {isAddressValid && <Icon iconName={IconName.Check} tw="text-color-success" />}
            </span>
          }
          type={InputType.Text}
          value={recipientAddress}
          placeholder={stringGetter({ key: STRING_KEYS.ADDRESS })}
          slotRight={renderFormInputButton({
            label: stringGetter({ key: STRING_KEYS.PASTE }),
            isInputEmpty: recipientAddress.trim() === '',
            onClear: () => onChangeAddress(''),
            onClick: onPasteAddress,
          })}
          disabled={isLoading}
        />
        <$NetworkSelectMenu
          label={stringGetter({ key: STRING_KEYS.NETWORK })}
          value={selectedDydxChainId}
          onValueChange={noop}
        >
          {networkOptions.map(({ chainId, label }) => (
            <$SelectItem key={chainId} value={chainId} label={label} />
          ))}
        </$NetworkSelectMenu>
      </$Row>

      <$SelectMenu
        label={stringGetter({ key: STRING_KEYS.ASSET })}
        value={asset}
        onValueChange={onChangeAsset}
      >
        {assetOptions.map(({ value, label }) => (
          <$SelectItem key={value} value={value} label={label} />
        ))}
      </$SelectMenu>

      <WithDetailsReceipt
        side="bottom"
        detailItems={amountDetailItems}
        tw="[--withReceipt-backgroundColor:--color-layer-2]"
      >
        <FormInput
          label={stringGetter({ key: STRING_KEYS.AMOUNT })}
          type={InputType.Number}
          onChange={({ formattedValue }: NumberFormatValues) => onChangeAmount(formattedValue)}
          value={amount}
          decimals={isUSDCSelected ? USD_DECIMALS : TOKEN_DECIMALS}
          slotRight={
            isUSDCSelected &&
            balanceBefore != null &&
            balanceBefore > 0 && (
              <FormMaxInputToggleButton
                size={ButtonSize.XSmall}
                isInputEmpty={amount.trim().length === 0}
                isLoading={isLoading}
                onPressedChange={onToggleMaxButton}
              />
            )
          }
          disabled={isLoading}
        />
      </WithDetailsReceipt>

      {showMemoField && (
        <FormInput
          label={stringGetter({ key: STRING_KEYS.MEMO })}
          placeholder={stringGetter({ key: STRING_KEYS.REQUIRED_FOR_TRANSFERS_TO_CEX })}
          type={InputType.Text}
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          onInput={(e: SyntheticInputEvent) => onChangeMemo(e.target?.value || '')}
          value={memo ?? undefined}
          slotRight={renderFormInputButton({
            label: stringGetter({ key: STRING_KEYS.PASTE }),
            isInputEmpty: !memo,
            onClear: () => onChangeMemo(''),
            onClick: onPasteMemo,
          })}
          disabled={isLoading}
        />
      )}

      {validationAlert && <ValidationAlertMessage error={validationAlert} />}
      {error && <AlertMessage type={AlertType.Error}>{error}</AlertMessage>}

      <$Footer>
        <TransferButtonAndReceipt
          summary={form.summary}
          isDisabled={isLoading || hasErrors}
          isLoading={isLoading}
          slotLeft={
            ctaErrorAction ? (
              <Icon iconName={IconName.Warning} tw="text-color-warning" />
            ) : undefined
          }
          buttonText={ctaErrorAction ?? undefined}
        />
      </$Footer>
    </$Form>
  );
};
const $Form = styled.form`
  ${formMixins.transfersForm}
`;

const $Footer = styled.footer`
  ${formMixins.footer}
`;

const $Row = styled.div`
  ${layoutMixins.gridEqualColumns}
  gap: var(--form-input-gap);
`;

const $SelectMenu = styled(SelectMenu)`
  ${formMixins.inputSelectMenu}
` as typeof SelectMenu;

const $SelectItem = styled(SelectItem)`
  ${formMixins.inputSelectMenuItem}
` as typeof SelectItem;

const $NetworkSelectMenu = styled($SelectMenu)`
  pointer-events: none;
` as typeof SelectMenu;
const $InlineRow = styled.span`
  ${layoutMixins.inlineRow}
  height: 100%;

  --asset-icon-size: 1.1em;
`;
const $FormInputToggleButton = styled(ToggleButton)`
  ${formMixins.inputInnerToggleButton}

  --button-padding: 0 0.5rem;
`;
