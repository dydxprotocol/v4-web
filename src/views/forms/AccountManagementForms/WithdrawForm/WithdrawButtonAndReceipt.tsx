import { useState } from 'react';

import { shallowEqual } from 'react-redux';
import styled from 'styled-components';
import tw from 'twin.macro';

import { TransferInputTokenResource } from '@/constants/abacus';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, TOKEN_DECIMALS } from '@/constants/numbers';
import { SKIP_EST_TIME_DEFAULT_MINUTES } from '@/constants/skip';

import { ConnectionErrorType, useApiState } from '@/hooks/useApiState';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithReceipt } from '@/components/WithReceipt';
import { WithTooltip } from '@/components/WithTooltip';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { getSubaccount } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getTransferInputs } from '@/state/inputsSelectors';

import { isTruthy } from '@/lib/isTruthy';

import { RouteWarningMessage } from '../RouteWarningMessage';
import { SlippageEditor } from '../SlippageEditor';

type ElementProps = {
  setSlippage: (slippage: number) => void;

  slippage: number;
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

  const { leverage } = useAppSelector(getSubaccount, shallowEqual) ?? {};
  const {
    summary,
    requestPayload,
    exchange,
    warning: routeWarning,
  } = useAppSelector(getTransferInputs, shallowEqual) ?? {};
  const canAccountTrade = useAppSelector(calculateCanAccountTrade, shallowEqual);
  const { usdcLabel } = useTokenConfigs();
  const { connectionError } = useApiState();

  const showExchangeRate =
    !exchange || (withdrawToken && typeof summary?.exchangeRate === 'number' && !exchange);
  const fallbackRouteDuration = stringGetter({
    key: STRING_KEYS.X_MINUTES_LOWERCASED,
    params: {
      X: `< ${SKIP_EST_TIME_DEFAULT_MINUTES}`,
    },
  });

  const submitButtonReceipt = [
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
    typeof summary?.toAmountUSD === 'number' &&
      !String(withdrawToken?.symbol).includes(usdcLabel) && {
        key: 'expected-amount-received-usd',
        label: (
          <$RowWithGap>
            {stringGetter({ key: STRING_KEYS.EXPECTED_AMOUNT_RECEIVED })}
            <Tag>USD</Tag>
          </$RowWithGap>
        ),
        value: (
          <Output
            type={OutputType.Asset}
            value={summary?.toAmountUSD}
            fractionDigits={TOKEN_DECIMALS}
          />
        ),
      },
    showExchangeRate && {
      key: 'exchange-rate',
      label: <span>{stringGetter({ key: STRING_KEYS.EXCHANGE_RATE })}</span>,
      value: (
        <$RowWithGap>
          <Output type={OutputType.Asset} value={1} fractionDigits={0} tag={usdcLabel} />
          =
          <Output
            type={OutputType.Asset}
            value={summary?.exchangeRate}
            tag={withdrawToken?.symbol}
          />
        </$RowWithGap>
      ),
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
        summary != null && typeof summary.estimatedRouteDuration === 'number' ? (
          <Output
            type={OutputType.Text}
            value={stringGetter({
              key: STRING_KEYS.X_MINUTES_LOWERCASED,
              params: {
                X:
                  summary.estimatedRouteDuration < 60
                    ? '< 1'
                    : Math.round(summary.estimatedRouteDuration / 60),
              },
            })}
          />
        ) : (
          fallbackRouteDuration
        ),
    },
    {
      key: 'leverage',
      label: <span>{stringGetter({ key: STRING_KEYS.ACCOUNT_LEVERAGE })}</span>,
      value: (
        <DiffOutput
          type={OutputType.Multiple}
          value={leverage?.current}
          newValue={leverage?.postOrder}
          sign={NumberSign.Negative}
          withDiff={Boolean(
            leverage?.current && leverage?.postOrder && leverage.current !== leverage?.postOrder
          )}
          tw="[--diffOutput-valueWithDiff-fontSize:1em]"
        />
      ),
    },
  ].filter(isTruthy);

  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const requiresAcknowledgement = Boolean(routeWarning && !hasAcknowledged);
  const isFormValid =
    !isDisabled &&
    !isEditingSlippage &&
    connectionError !== ConnectionErrorType.CHAIN_DISRUPTION &&
    !requiresAcknowledgement;

  if (!canAccountTrade) {
    return (
      <$WithReceipt slotReceipt={<$Details items={submitButtonReceipt} />}>
        <OnboardingTriggerButton size={ButtonSize.Base} />
      </$WithReceipt>
    );
  }

  return (
    <$WithReceipt slotReceipt={<$Details items={submitButtonReceipt} />}>
      <RouteWarningMessage
        hasAcknowledged={hasAcknowledged}
        setHasAcknowledged={setHasAcknowledged}
        routeWarningJSON={routeWarning}
      />
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
    </$WithReceipt>
  );
};
const $RowWithGap = tw.span`row gap-[0.5ch]`;

const $WithReceipt = tw(WithReceipt)`[--withReceipt-backgroundColor:--color-layer-2]`;

const $Details = styled(Details)`
  --details-item-vertical-padding: 0.33rem;
  padding: var(--form-input-paddingY) var(--form-input-paddingX);
  font-size: 0.8125em;
`;
