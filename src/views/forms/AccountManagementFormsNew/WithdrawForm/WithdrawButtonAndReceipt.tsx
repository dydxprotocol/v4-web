import { useState } from 'react';

import { Asset, RouteResponse } from '@skip-go/client';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';
import tw from 'twin.macro';
import { formatUnits } from 'viem';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, TOKEN_DECIMALS } from '@/constants/numbers';

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
  withdrawToken?: Asset;
  route?: RouteResponse;

  isDisabled?: boolean;
  isLoading?: boolean;
};

export const WithdrawButtonAndReceipt = ({
  setSlippage,

  slippage,
  withdrawToken,
  route,

  isDisabled,
  isLoading,
}: ElementProps) => {
  const [isEditingSlippage, setIsEditingSlipapge] = useState(false);
  const stringGetter = useStringGetter();

  const { leverage } = useAppSelector(getSubaccount, shallowEqual) ?? {};
  // TODO: https://linear.app/dydx/issue/OTE-867/coinbase-withdrawals
  const { exchange } = useAppSelector(getTransferInputs, shallowEqual) ?? {};

  const canAccountTrade = useAppSelector(calculateCanAccountTrade, shallowEqual);
  const { usdcLabel } = useTokenConfigs();
  const { connectionError } = useApiState();

  const fees = Number(route?.usdAmountIn) - Number(route?.usdAmountOut);
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
        <Output
          type={OutputType.Asset}
          value={
            route?.amountOut
              ? formatUnits(BigInt(route.amountOut ?? '0'), withdrawToken?.decimals ?? 0).toString()
              : undefined
          }
          fractionDigits={TOKEN_DECIMALS}
        />
      ),
    },
    withdrawToken &&
      !withdrawToken.symbol?.toLowerCase().includes('usd') && {
        key: 'expected-amount-received-usd',

        label: (
          <$RowWithGap>
            {stringGetter({ key: STRING_KEYS.EXPECTED_AMOUNT_RECEIVED })}
            {withdrawToken && <Tag>{usdcLabel}</Tag>}
          </$RowWithGap>
        ),
        value: (
          <Output
            type={OutputType.Asset}
            value={route?.usdAmountOut}
            fractionDigits={TOKEN_DECIMALS}
          />
        ),
      },
    fees && {
      key: 'bridge-fees',
      label: (
        <WithTooltip tooltip="bridge-fees-deposit">
          {stringGetter({ key: STRING_KEYS.BRIDGE_FEE })}
        </WithTooltip>
      ),
      value: <Output type={OutputType.Fiat} value={fees} />,
    },
    !exchange && {
      key: 'slippage',
      label: <span>{stringGetter({ key: STRING_KEYS.MAX_SLIPPAGE })}</span>,
      value: (
        <SlippageEditor
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
        typeof route?.estimatedRouteDurationSeconds === 'number' ? (
          <Output
            type={OutputType.Text}
            value={stringGetter({
              key: STRING_KEYS.X_MINUTES_LOWERCASED,
              params: {
                X:
                  route.estimatedRouteDurationSeconds < 60
                    ? '< 1'
                    : Math.round(route.estimatedRouteDurationSeconds / 60),
              },
            })}
          />
        ) : undefined,
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
  const requiresAcknowledgement = Boolean(route?.warning && !hasAcknowledged);
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
        routeWarning={route?.warning}
      />
      <Button
        action={ButtonAction.Primary}
        type={ButtonType.Submit}
        state={{
          isDisabled: !isFormValid,
          isLoading: (isFormValid && !route) || isLoading,
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
