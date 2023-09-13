import { type FormEvent, useEffect, useMemo, useState } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';
import { type NumberFormatValues } from 'react-number-format';
import { shallowEqual, useSelector } from 'react-redux';
import type { SyntheticInputEvent } from 'react-number-format/types/types';
import { debounce } from 'lodash';
import { StdFee } from '@cosmjs/stargate';
import { validation } from '@dydxprotocol/v4-client-js';

import { TransferInputField, TransferType } from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { CLIENT_NETWORK_CONFIGS } from '@/constants/networks';
import { NumberSign, QUANTUM_MULTIPLIER } from '@/constants/numbers';
import { DYDX_CHAIN_ASSET_COIN_DENOM, DydxChainAsset } from '@/constants/wallets';

import {
  useAccountBalance,
  useAccounts,
  useSelectedNetwork,
  useStringGetter,
  useSubaccount,
} from '@/hooks';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { AssetIcon } from '@/components/AssetIcon';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { OutputType } from '@/components/Output';
import { SelectItem, SelectMenu } from '@/components/SelectMenu';
import { Tag } from '@/components/Tag';
import { ToggleButton } from '@/components/ToggleButton';
import { TransferButtonAndReceipt } from '@/views/forms/TransferForm/TransferButtonAndReceipt';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';

import { getSubaccount } from '@/state/accountSelectors';
import { getTransferInputs } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';

type TransferFormProps = {
  selectedAsset?: DydxChainAsset;
  onDone?: () => void;
  className?: string;
};

const debouncedEstimateFee = debounce(
  async ({ amount, recipientAddress, asset, setFees, simulateTransfer }) => {
    if (!amount || !recipientAddress) {
      return;
    }

    try {
      const coinDenom = DYDX_CHAIN_ASSET_COIN_DENOM[asset as DydxChainAsset];
      const stdFee: StdFee = await simulateTransfer(amount, recipientAddress, coinDenom);

      const fee = stdFee?.amount.find((coin) => coin.denom === coinDenom)?.amount;
      const feeAmount = MustBigNumber(fee).div(QUANTUM_MULTIPLIER).toNumber();

      setFees(feeAmount);
    } catch (error) {
      console.error('TransferForm > : debouncedEstimateFee > ', error);
    }
  },
  1000,
  { trailing: true }
);

export const TransferForm = ({
  selectedAsset = DydxChainAsset.DYDX,
  onDone,
  className,
}: TransferFormProps) => {
  const stringGetter = useStringGetter();
  const { freeCollateral } = useSelector(getSubaccount, shallowEqual) || {};
  const { dydxAddress } = useAccounts();
  const { address: recipientAddress, size } = useSelector(getTransferInputs, shallowEqual) || {};
  const { transfer, simulateTransfer } = useSubaccount();
  const { nativeTokenBalance, usdcBalance } = useAccountBalance();
  const { selectedNetwork } = useSelectedNetwork();

  // User Input
  const [asset, setAsset] = useState<DydxChainAsset>(selectedAsset);

  // Form states
  const [error, setError] = useState<Error | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [fees, setFees] = useState<number>();

  const balance = asset === DydxChainAsset.USDC ? freeCollateral?.current : nativeTokenBalance;
  const newBalance =
    asset === DydxChainAsset.USDC
      ? freeCollateral?.postOrder
      : MustBigNumber(nativeTokenBalance)
          .minus(size?.size ?? 0)
          .toNumber();
  const amount = asset === DydxChainAsset.USDC ? size?.usdcSize : size?.size;

  const showNotEnoughGasWarning = fees && asset === DydxChainAsset.USDC && usdcBalance < fees;

  // BN
  const amountBN = MustBigNumber(amount);
  const balanceBN = MustBigNumber(balance);
  const newBalanceBN = MustBigNumber(newBalance);

  const isAddressValid = useMemo(
    () =>
      recipientAddress &&
      dydxAddress !== recipientAddress &&
      validation.isValidAddress(recipientAddress),
    [recipientAddress]
  );

  const isAmountValid = balance && amount && amountBN.gt(0) && newBalanceBN.gte(0);

  useEffect(() => {
    abacusStateManager.setTransferValue({
      value: TransferType.transferOut.rawValue,
      field: TransferInputField.type,
    });

    return () => {
      abacusStateManager.clearTransferInputValues();
    };
  }, []);

  useEffect(() => {
    setError(undefined);
    debouncedEstimateFee.cancel();

    if (isAmountValid && isAddressValid) {
      debouncedEstimateFee({
        amount,
        recipientAddress,
        asset,
        setFees,
        simulateTransfer,
      });
    } else {
      setFees(undefined);
    }
  }, [asset, amount, recipientAddress]);

  useEffect(() => {
    setError(undefined);
  }, [asset]);

  const onTransfer = async () => {
    if (!isAmountValid || !isAddressValid || !fees) return;
    setIsLoading(true);
    setError(undefined);

    try {
      // Subtract fees from amount if sending native tokens
      const amountToTransfer = (
        asset === DydxChainAsset.DYDX ? amountBN.minus(fees) : amountBN
      ).toNumber();

      const txResponse = await transfer(
        amountToTransfer,
        recipientAddress as string,
        DYDX_CHAIN_ASSET_COIN_DENOM[asset]
      );

      if (txResponse?.code === 0) {
        console.log('TransferForm > txReceipt > ', txResponse?.hash);
        onDone?.();
      } else {
        throw new Error(txResponse?.rawLog ?? 'Transaction did not commit.');
      }
    } catch (error) {
      setError(error);
      log('TransferForm/onTransfer', error);
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
      field: asset === DydxChainAsset.USDC ? TransferInputField.usdcSize : TransferInputField.size,
    });
  };

  const onPasteAddress = async () => {
    try {
      const value = await navigator.clipboard.readText();
      onChangeAddress(value);
    } catch (error) {
      // expected error if user rejects clipboard access
    }
  };

  const assetOptions = [
    {
      value: DydxChainAsset.USDC,
      label: (
        <Styled.InlineRow>
          <AssetIcon symbol="USDC" /> USDC
        </Styled.InlineRow>
      ),
    },
    {
      value: DydxChainAsset.DYDX,
      label: (
        <Styled.InlineRow>
          {/* <AssetIcon symbol="DYDX" />  */}
          Dv4TNT
        </Styled.InlineRow>
      ),
    },
  ];

  const networkOptions = [
    {
      chainId: CLIENT_NETWORK_CONFIGS[selectedNetwork].dydxChainId,
      label: (
        <Styled.InlineRow>
          <AssetIcon symbol="DYDX" /> {stringGetter({ key: STRING_KEYS.DYDX_CHAIN })}
        </Styled.InlineRow>
      ),
    },
  ];

  const amountDetailItems = [
    {
      key: 'amount',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.AVAILABLE })} <Tag>{asset}</Tag>
        </span>
      ),
      value: (
        <DiffOutput
          type={OutputType.Asset}
          value={balanceBN.toString()}
          newValue={newBalanceBN.toString()}
          sign={NumberSign.Negative}
          hasInvalidNewValue={newBalanceBN.isNegative()}
          withDiff={Boolean(amount && balance) && !amountBN.isNaN()}
        />
      ),
    },
  ];

  const addressValidationErrorMessage = stringGetter({
    key:
      dydxAddress === recipientAddress
        ? STRING_KEYS.TRANSFER_TO_YOURSELF
        : STRING_KEYS.TRANSFER_INVALID_DYDX_ADDRESS,
  });

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
    <Styled.FormInputToggleButton
      size={ButtonSize.XSmall}
      isPressed={!isInputEmpty}
      onPressedChange={(isPressed: boolean) => (isPressed ? onClick : onClear)()}
      disabled={isLoading}
      shape={isInputEmpty ? ButtonShape.Rectangle : ButtonShape.Circle}
    >
      {isInputEmpty ? label : <Icon iconName={IconName.Close} />}
    </Styled.FormInputToggleButton>
  );

  return (
    <Styled.Form
      className={className}
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onTransfer();
      }}
    >
      <Styled.Row>
        <Styled.FormInput
          id="destination"
          onInput={(e: SyntheticInputEvent) => onChangeAddress(e.target?.value)}
          label={
            <Styled.DestinationInputLabel>
              {stringGetter({ key: STRING_KEYS.DESTINATION })}
              {isAddressValid && <Icon iconName={IconName.Check} />}
            </Styled.DestinationInputLabel>
          }
          type={InputType.Text}
          value={recipientAddress ?? ''}
          placeholder={stringGetter({ key: STRING_KEYS.ADDRESS })}
          slotRight={renderFormInputButton({
            label: stringGetter({ key: STRING_KEYS.PASTE }),
            isInputEmpty: recipientAddress == null || recipientAddress == '',
            onClear: () => onChangeAddress(''),
            onClick: onPasteAddress,
          })}
          disabled={isLoading}
        />
        <Styled.NetworkSelectMenu
          label={stringGetter({ key: STRING_KEYS.NETWORK })}
          value={CLIENT_NETWORK_CONFIGS[selectedNetwork].dydxChainId}
          slotTriggerAfter={null}
        >
          {networkOptions.map(({ chainId, label }) => (
            <Styled.SelectItem key={chainId} value={chainId} label={label} />
          ))}
        </Styled.NetworkSelectMenu>
      </Styled.Row>

      {recipientAddress && !isAddressValid && (
        <Styled.AddressValidationAlertMessage type={AlertType.Error}>
          {addressValidationErrorMessage}
        </Styled.AddressValidationAlertMessage>
      )}

      <Styled.SelectMenu
        label={stringGetter({ key: STRING_KEYS.ASSET })}
        value={asset}
        onValueChange={setAsset}
        disabled={isLoading}
      >
        {assetOptions.map(({ value, label }) => (
          <Styled.SelectItem key={value} value={value} label={label} />
        ))}
      </Styled.SelectMenu>

      <WithDetailsReceipt side="bottom" detailItems={amountDetailItems}>
        <Styled.FormInput
          label={stringGetter({ key: STRING_KEYS.AMOUNT })}
          type={InputType.Number}
          onChange={({ floatValue }: NumberFormatValues) => onChangeAmount(floatValue)}
          value={amount ?? undefined}
          slotRight={renderFormInputButton({
            label: stringGetter({ key: STRING_KEYS.MAX }),
            isInputEmpty: size?.usdcSize == null,
            onClear: () => onChangeAmount(undefined),
            onClick: () => onChangeAmount(balanceBN.toNumber()),
          })}
          disabled={isLoading}
        />
      </WithDetailsReceipt>

      {showNotEnoughGasWarning && (
        <AlertMessage type={AlertType.Warning}>
          {stringGetter({
            key: STRING_KEYS.TRANSFER_INSUFFICIENT_GAS,
            params: { USDC_BALANCE: `(${usdcBalance})` },
          })}
        </AlertMessage>
      )}

      {error && <AlertMessage type={AlertType.Error}>{error.message}</AlertMessage>}

      <Styled.Footer>
        <TransferButtonAndReceipt
          selectedAsset={asset}
          fees={fees}
          isDisabled={!isAmountValid || !isAddressValid || !fees}
          isLoading={isLoading || Boolean(isAmountValid && isAddressValid && !fees)}
        />
      </Styled.Footer>
    </Styled.Form>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Form = styled.form`
  ${formMixins.inputsColumn}
  gap: 1.25rem;
`;

Styled.FormInput = styled(FormInput)`
  --form-input-height: 3.5rem;
`;

Styled.Footer = styled.footer`
  ${layoutMixins.stickyFooter}
  margin-top: auto;
`;

Styled.Row = styled.div`
  ${layoutMixins.gridEqualColumns}
  gap: var(--form-input-gap);
`;

Styled.SelectMenu = styled(SelectMenu)`
  ${formMixins.inputSelectMenu}
  --form-input-height: 3.5rem;
`;

Styled.SelectItem = styled(SelectItem)`
  ${formMixins.inputSelectMenuItem}
`;

Styled.NetworkSelectMenu = styled(Styled.SelectMenu)`
  pointer-events: none;
`;

Styled.InlineRow = styled.span`
  ${layoutMixins.inlineRow}
  height: 100%;

  img {
    font-size: 1.1em;
  }
`;

Styled.DestinationInputLabel = styled.span`
  ${layoutMixins.inlineRow}

  svg {
    color: var(--color-positive);

    path {
      stroke-width: 2;
    }
  }
`;

Styled.AddressValidationAlertMessage = styled(AlertMessage)`
  margin-top: -0.75rem;
`;

Styled.FormInputToggleButton = styled(ToggleButton)`
  ${formMixins.inputInnerToggleButton}

  svg {
    color: var(--color-text-0);
  }
`;
