import { useState } from 'react';

import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { TransferInputTokenResource } from '@/constants/abacus';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, TOKEN_DECIMALS } from '@/constants/numbers';

import { useStringGetter, useTokenConfigs } from '@/hooks';
import { ConnectionErrorType, useApiState } from '@/hooks/useApiState';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Details, DetailsItem } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { ToggleButton } from '@/components/ToggleButton';
import { WithReceipt } from '@/components/WithReceipt';
import { WithTooltip } from '@/components/WithTooltip';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { getSubaccount } from '@/state/accountSelectors';
import { getTransferInputs } from '@/state/inputsSelectors';

import { isTruthy } from '@/lib/isTruthy';

import { SlippageEditor } from '../SlippageEditor';

type ElementProps = {
  setSlippage: (slippage: number) => void;

  slippage: number;
  withdrawChain?: string;
  withdrawToken?: TransferInputTokenResource;

  isDisabled?: boolean;
  isLoading?: boolean;
};

export const WithdrawButtonAndReceipt = ({
  setSlippage,

  slippage,
  withdrawToken,

  isDisabled,
  isLoading,
}: ElementProps) => {
  const [isEditingSlippage, setIsEditingSlipapge] = useState(false);
  const stringGetter = useStringGetter();

  const { leverage } = useSelector(getSubaccount, shallowEqual) || {};
  const { summary, requestPayload, exchange } = useSelector(getTransferInputs, shallowEqual) || {};
  const canAccountTrade = useSelector(calculateCanAccountTrade, shallowEqual);
  const { usdcLabel } = useTokenConfigs();
  const { connectionError } = useApiState();

  const submitButtonReceipt: DetailsItem[] = [
    {
      key: 'expected-amount-received',

      label: (
        <$RowWithGap>
          {stringGetter({ key: STRING_KEYS.EXPECTED_AMOUNT_RECEIVED })}
          {withdrawToken && <Tag>{withdrawToken?.symbol}</Tag>}
        </$RowWithGap>
      ),
      value: (
        <Output type={OutputType.Asset} value={summary?.toAmount} fractionDigits={TOKEN_DECIMALS} />
      ),
    },
    {
      key: 'minimum-amount-received',
      label: (
        <$RowWithGap>
          {stringGetter({ key: STRING_KEYS.MINIMUM_AMOUNT_RECEIVED })}
          {withdrawToken && <Tag>{withdrawToken?.symbol}</Tag>}
        </$RowWithGap>
      ),
      value: (
        <Output
          type={OutputType.Asset}
          value={summary?.toAmountMin}
          fractionDigits={TOKEN_DECIMALS}
        />
      ),
      tooltip: 'minimum-amount-received',
    },
    !exchange && {
      key: 'exchange-rate',
      label: <span>{stringGetter({ key: STRING_KEYS.EXCHANGE_RATE })}</span>,
      value:
        withdrawToken && typeof summary?.exchangeRate === 'number' ? (
          <$RowWithGap>
            <Output type={OutputType.Asset} value={1} fractionDigits={0} tag={usdcLabel} />
            =
            <Output
              type={OutputType.Asset}
              value={summary?.exchangeRate}
              tag={withdrawToken?.symbol}
            />
          </$RowWithGap>
        ) : undefined,
    },
    typeof summary?.gasFee === 'number' && {
      key: 'gas-fees',
      label: (
        <WithTooltip tooltip="gas-fees">{stringGetter({ key: STRING_KEYS.GAS_FEE })}</WithTooltip>
      ),
      value: <Output type={OutputType.Fiat} value={summary?.gasFee} />,
    },
    typeof summary?.bridgeFee === 'number' && {
      key: 'bridge-fees',
      label: (
        <WithTooltip tooltip="bridge-fees">
          {stringGetter({ key: STRING_KEYS.BRIDGE_FEE })}
        </WithTooltip>
      ),
      value: <Output type={OutputType.Fiat} value={summary?.bridgeFee} />,
    },
    !exchange && {
      key: 'slippage',
      label: <span>{stringGetter({ key: STRING_KEYS.MAX_SLIPPAGE })}</span>,
      value: (
        <SlippageEditor
          disabled
          slippage={slippage}
          setIsEditing={setIsEditingSlipapge}
          setSlippage={setSlippage}
        />
      ),
    },
    {
      key: 'estimated-route-duration',
      label: <span>{stringGetter({ key: STRING_KEYS.ESTIMATED_TIME })}</span>,
      value:
        typeof summary?.estimatedRouteDuration === 'number' ? (
          <Output
            type={OutputType.Text}
            value={stringGetter({
              key: STRING_KEYS.X_MINUTES_LOWERCASED,
              params: {
                X:
                  summary?.estimatedRouteDuration < 60
                    ? '< 1'
                    : Math.round(summary?.estimatedRouteDuration / 60),
              },
            })}
          />
        ) : undefined,
    },
    {
      key: 'leverage',
      label: <span>{stringGetter({ key: STRING_KEYS.ACCOUNT_LEVERAGE })}</span>,
      value: (
        <$DiffOutput
          type={OutputType.Multiple}
          value={leverage?.current}
          newValue={leverage?.postOrder}
          sign={NumberSign.Negative}
          withDiff={Boolean(leverage?.current && leverage.current !== leverage?.postOrder)}
        />
      ),
    },
  ].filter(isTruthy);

  const isFormValid =
    !isDisabled && !isEditingSlippage && connectionError !== ConnectionErrorType.CHAIN_DISRUPTION;

  return (
    <$WithReceipt slotReceipt={<$Details items={submitButtonReceipt} />}>
      {!canAccountTrade ? (
        <OnboardingTriggerButton size={ButtonSize.Base} />
      ) : (
        <Button
          action={ButtonAction.Primary}
          type={ButtonType.Submit}
          state={{
            isDisabled: !isFormValid,
            isLoading: (isFormValid && !requestPayload) || isLoading,
          }}
        >
          {stringGetter({ key: STRING_KEYS.WITHDRAW })}
        </Button>
      )}
    </$WithReceipt>
  );
};
const $DiffOutput = styled(DiffOutput)`
  --diffOutput-valueWithDiff-fontSize: 1em;
`;

const $RowWithGap = styled.span`
  ${layoutMixins.row}
  gap: 0.5ch;
`;

const $WithReceipt = styled(WithReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
`;

const $Details = styled(Details)`
  padding: var(--form-input-paddingY) var(--form-input-paddingX);
  font-size: 0.8125em;
`;

const $DetailButtons = styled.div`
  ${layoutMixins.spacedRow}
`;

const $ToggleButton = styled(ToggleButton)`
  --button-toggle-off-backgroundColor: transparent;
  --button-toggle-on-backgroundColor: transparent;
  --button-toggle-on-textColor: var(--color-text-0);

  svg {
    width: 0.875em;
    height: 0.875em;
  }

  &[data-state='on'] {
    svg {
      transform: rotate(180deg);
    }
  }
`;
