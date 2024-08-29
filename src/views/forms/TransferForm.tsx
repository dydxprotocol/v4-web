import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import { validation } from '@dydxprotocol/v4-client-js';
import { noop } from 'lodash';
import { type NumberFormatValues } from 'react-number-format';
import type { SyntheticInputEvent } from 'react-number-format/types/types';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { Nullable, TransferInputField, TransferType } from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';
import { DydxChainAsset } from '@/constants/wallets';

import { useAccountBalance } from '@/hooks/useAccountBalance';
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
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { TransferButtonAndReceipt } from '@/views/forms/TransferForm/TransferButtonAndReceipt';

import { getSubaccount } from '@/state/accountSelectors';
import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getTransferInputs } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';
import { WalletType } from '@/lib/wallet/types';

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

  const { freeCollateral } = useAppSelector(getSubaccount, shallowEqual) ?? {};
  const { dydxAddress, connectedWallet } = useAccounts();
  const { transfer } = useSubaccount();
  const { nativeTokenBalance, usdcBalance } = useAccountBalance();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const { tokensConfigs, usdcLabel, chainTokenLabel } = useTokenConfigs();
  useWithdrawalInfo({ transferType: 'transfer' });

  const {
    address: recipientAddress,
    size,
    fee,
    token,
    memo,
  } = useAppSelector(getTransferInputs, shallowEqual) ?? {};

  // Form states
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  // temp fix: TODO: reset fees when changing token in Abacus
  const [currentFee, setCurrentFee] = useState(fee);
  useEffect(() => {
    setCurrentFee(fee);
  }, [fee]);

  const asset = (token ?? selectedAsset) as DydxChainAsset;
  const isChainTokenSelected = asset === DydxChainAsset.CHAINTOKEN;
  const isUSDCSelected = asset === DydxChainAsset.USDC;
  const amount = isUSDCSelected ? size?.usdcSize : size?.size;
  const showNotEnoughGasWarning = fee && isUSDCSelected && usdcBalance < fee;
  const showMemoField = isChainTokenSelected;

  const balance = isUSDCSelected ? freeCollateral?.current : nativeTokenBalance;

  // BN
  const newBalanceBN = isUSDCSelected
    ? MustBigNumber(freeCollateral?.postOrder)
    : nativeTokenBalance.minus(size?.size ?? 0);

  const amountBN = MustBigNumber(amount);
  const balanceBN = MustBigNumber(balance);

  const onChangeAsset = (newAsset: Nullable<string>) => {
    setError(undefined);
    setCurrentFee(undefined);

    if (newAsset) {
      abacusStateManager.setTransferValue({
        value: newAsset,
        field: TransferInputField.token,
      });
    }
  };

  useEffect(() => {
    if (connectedWallet?.name === WalletType.Keplr && dydxAddress) {
      abacusStateManager.setTransfersSourceAddress(dydxAddress);
    }

    abacusStateManager.setTransferValue({
      value: TransferType.transferOut.rawValue,
      field: TransferInputField.type,
    });

    onChangeAsset(selectedAsset);

    return () => {
      abacusStateManager.resetInputState();
    };
  }, []);

  const { sanctionedAddresses } = useRestrictions();

  const isAddressValid = useMemo(
    () =>
      recipientAddress &&
      dydxAddress !== recipientAddress &&
      validation.isValidAddress(recipientAddress) &&
      !sanctionedAddresses.has(recipientAddress),
    [recipientAddress, sanctionedAddresses, dydxAddress]
  );

  const isAmountValid = balance && amount && amountBN.gt(0) && newBalanceBN.gte(0);
  const showMemoEmptyWarning = showMemoField && !memo && isAddressValid && isAmountValid; // only show warning if user has inputted mandatory fields

  const { screenAddresses } = useDydxClient();

  const onTransfer = async () => {
    if (!isAmountValid || !isAddressValid || !fee) return;
    setIsLoading(true);
    setError(undefined);

    try {
      const screenResults = await screenAddresses({
        addresses: [recipientAddress!, dydxAddress!],
      });

      if (screenResults?.[dydxAddress!]) {
        setError(
          stringGetter({
            key: STRING_KEYS.WALLET_RESTRICTED_WITHDRAWAL_TRANSFER_ORIGINATION_ERROR_MESSAGE,
          })
        );
      } else if (screenResults?.[recipientAddress!]) {
        setError(
          stringGetter({
            key: STRING_KEYS.WALLET_RESTRICTED_WITHDRAWAL_TRANSFER_DESTINATION_ERROR_MESSAGE,
          })
        );
      } else {
        const txResponse = await transfer(
          amountBN.toNumber(),
          recipientAddress!,
          tokensConfigs[asset]?.denom,
          memo ?? undefined
        );

        if (txResponse?.code === 0) {
          // eslint-disable-next-line no-console
          console.log('TransferForm > txReceipt > ', txResponse?.hash);
          onDone?.();
        } else {
          throw new Error(txResponse?.rawLog ?? 'Transaction did not commit.');
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
                  ERROR_MESSAGE: err.message ?? stringGetter({ key: STRING_KEYS.UNKNOWN_ERROR }),
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
    abacusStateManager.setTransferValue({
      value,
      field: TransferInputField.address,
    });
  };

  const onChangeAmount = (value?: number) => {
    abacusStateManager.setTransferValue({
      value,
      field: isUSDCSelected ? TransferInputField.usdcSize : TransferInputField.size,
    });
  };

  const onChangeMemo = (value: string) => {
    abacusStateManager.setTransferValue({
      value,
      field: TransferInputField.MEMO,
    });
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

  const assetOptions = [
    {
      value: DydxChainAsset.USDC,
      label: (
        <$InlineRow>
          <AssetIcon symbol="USDC" /> {usdcLabel}
        </$InlineRow>
      ),
    },
    {
      value: DydxChainAsset.CHAINTOKEN,
      label: (
        <$InlineRow>
          <AssetIcon symbol={chainTokenLabel} />
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

  const amountDetailItems = [
    {
      key: 'amount',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.AVAILABLE })} <Tag>{tokensConfigs[asset]?.name}</Tag>
        </span>
      ),
      value: (
        <DiffOutput
          type={OutputType.Asset}
          value={balanceBN}
          sign={NumberSign.Negative}
          newValue={newBalanceBN}
          hasInvalidNewValue={newBalanceBN.isNegative()}
          withDiff={Boolean(amount && balance) && !amountBN.isNaN()}
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

  const onToggleMaxButton = useCallback(
    (isPressed: boolean) =>
      isPressed ? onChangeAmount(balanceBN.toNumber()) : onChangeAmount(undefined),
    [balanceBN, onChangeAmount]
  );

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
          onInput={(e: SyntheticInputEvent) => onChangeAddress(e.target?.value)}
          label={
            <span tw="inlineRow">
              {stringGetter({ key: STRING_KEYS.DESTINATION })}
              {isAddressValid && <Icon iconName={IconName.Check} tw="text-color-success" />}
            </span>
          }
          type={InputType.Text}
          value={recipientAddress ?? ''}
          placeholder={stringGetter({ key: STRING_KEYS.ADDRESS })}
          slotRight={renderFormInputButton({
            label: stringGetter({ key: STRING_KEYS.PASTE }),
            isInputEmpty: recipientAddress == null || recipientAddress === '',
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

      {recipientAddress && !isAddressValid && (
        <AlertMessage type={AlertType.Error} tw="-mt-0.75">
          {stringGetter({
            key:
              dydxAddress === recipientAddress
                ? STRING_KEYS.TRANSFER_TO_YOURSELF
                : STRING_KEYS.TRANSFER_INVALID_DYDX_ADDRESS,
          })}
        </AlertMessage>
      )}

      <$SelectMenu
        label={stringGetter({ key: STRING_KEYS.ASSET })}
        value={token ?? ''}
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
          onChange={({ floatValue }: NumberFormatValues) => onChangeAmount(floatValue)}
          value={amount ?? undefined}
          slotRight={
            isUSDCSelected &&
            balanceBN.gt(0) && (
              <FormMaxInputToggleButton
                size={ButtonSize.XSmall}
                isInputEmpty={size?.usdcSize == null}
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

      {showMemoEmptyWarning && (
        <AlertMessage type={AlertType.Warning}>
          {stringGetter({
            key: STRING_KEYS.TRANSFER_WITHOUT_MEMO,
          })}
        </AlertMessage>
      )}

      {showNotEnoughGasWarning && (
        <AlertMessage type={AlertType.Warning}>
          {stringGetter({
            key: STRING_KEYS.TRANSFER_INSUFFICIENT_GAS,
            params: { TOKEN: usdcLabel, BALANCE: usdcBalance },
          })}
        </AlertMessage>
      )}

      {error && <AlertMessage type={AlertType.Error}>{error}</AlertMessage>}

      <$Footer>
        <TransferButtonAndReceipt
          selectedAsset={asset}
          fee={currentFee ?? undefined}
          isDisabled={!isAmountValid || !isAddressValid || !currentFee || isLoading}
          isLoading={isLoading || Boolean(isAmountValid && isAddressValid && !currentFee)}
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
  --stickyFooterBackdrop-outsetY: var(--dialog-content-paddingBottom);
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

  img {
    font-size: 1.1em;
  }
`;
const $FormInputToggleButton = styled(ToggleButton)`
  ${formMixins.inputInnerToggleButton}

  --button-padding: 0 0.5rem;
`;
