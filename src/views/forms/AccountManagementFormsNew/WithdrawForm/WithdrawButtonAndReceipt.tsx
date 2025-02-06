import { useState } from 'react';

import { Asset, RouteResponse } from '@skip-go/client';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';
import tw from 'twin.macro';
import { formatUnits } from 'viem';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, TOKEN_DECIMALS } from '@/constants/numbers';

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
import { getSubaccount, getSubaccountForPostOrder } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

import { RouteWarningMessage } from '../RouteWarningMessage';

type ElementProps = {
  withdrawToken?: Asset;
  route?: RouteResponse;

  isDisabled?: boolean;
  isLoading?: boolean;
};

export const WithdrawButtonAndReceipt = ({
  withdrawToken,
  route,

  isDisabled,
  isLoading,
}: ElementProps) => {
  const stringGetter = useStringGetter();

  const { leverage } = useAppSelector(getSubaccount, shallowEqual) ?? {};
  const { leverage: leveragePost } = orEmptyObj(useAppSelector(getSubaccountForPostOrder));
  const leveragePostOrder = leveragePost?.postOrder;

  const canAccountTrade = useAppSelector(calculateCanAccountTrade, shallowEqual);
  const { usdcDecimals } = useTokenConfigs();

  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const requiresAcknowledgement = Boolean(route?.warning && !hasAcknowledged);
  const isFormValid = !isDisabled && !requiresAcknowledgement;

  const fees = MustBigNumber(route?.usdAmountIn).minus(MustBigNumber(route?.usdAmountOut));

  if (!withdrawToken?.decimals || Number(withdrawToken.decimals) !== usdcDecimals)
    throw new Error(
      'WithdrawToken does not have decimals. This should never happen. WithdrawToken should always be a usdc token and have usdc decimals (6)'
    );
  const submitButtonReceipt = [
    {
      key: 'amount-inputted',
      label: <span>Amount</span>,
      value: (
        <Output
          type={OutputType.Asset}
          value={
            route?.amountIn
              ? formatUnits(BigInt(route.amountIn), withdrawToken.decimals).toString()
              : undefined
          }
          fractionDigits={TOKEN_DECIMALS}
        />
      ),
    },
    {
      key: 'expected-amount-received',

      label: (
        <$RowWithGap>
          {stringGetter({ key: STRING_KEYS.EXPECTED_AMOUNT_RECEIVED })}
          <Tag>{withdrawToken.symbol}</Tag>
        </$RowWithGap>
      ),
      value: (
        <Output
          type={OutputType.Asset}
          value={
            route?.amountOut
              ? formatUnits(BigInt(route.amountOut), withdrawToken.decimals).toString()
              : undefined
          }
          fractionDigits={TOKEN_DECIMALS}
        />
      ),
    },
    fees.absoluteValue().gt(0) && {
      key: 'bridge-fees',
      label: (
        <WithTooltip tooltip="bridge-fees-deposit">
          {stringGetter({ key: STRING_KEYS.BRIDGE_FEE })}
        </WithTooltip>
      ),
      value: <Output type={OutputType.Fiat} value={fees} />,
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
          value={leverage}
          newValue={leveragePostOrder}
          sign={NumberSign.Negative}
          withDiff={Boolean(
            leverage && leveragePostOrder && leverage.toNumber() !== leveragePostOrder
          )}
          tw="[--diffOutput-valueWithDiff-fontSize:1em]"
        />
      ),
    },
  ].filter(isTruthy);

  if (!canAccountTrade) {
    return (
      <$WithReceipt slotReceipt={<$Details items={submitButtonReceipt} />}>
        <OnboardingTriggerButton size={ButtonSize.Base} />
      </$WithReceipt>
    );
  }

  return (
    <$WithReceipt slotReceipt={<$Details items={submitButtonReceipt} />}>
      {route?.warning && (
        <RouteWarningMessage
          hasAcknowledged={hasAcknowledged}
          setHasAcknowledged={setHasAcknowledged}
          routeWarning={route.warning}
        />
      )}
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
