import { useState, type Dispatch, type SetStateAction } from 'react';

import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { TransferInputTokenResource } from '@/constants/abacus';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, TOKEN_DECIMALS } from '@/constants/numbers';

import { ConnectionErrorType, useApiState } from '@/hooks/useApiState';
import { useMatchingEvmNetwork } from '@/hooks/useMatchingEvmNetwork';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';
import { useWalletConnection } from '@/hooks/useWalletConnection';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithReceipt } from '@/components/WithReceipt';
import { WithTooltip } from '@/components/WithTooltip';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { getSubaccountBuyingPower, getSubaccountEquity } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getTransferInputs } from '@/state/inputsSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';

import { SlippageEditor } from '../SlippageEditor';

type ElementProps = {
  isDisabled?: boolean;
  isLoading?: boolean;
  chainId?: string | number;
  setError?: Dispatch<SetStateAction<Error | null>>;
  setRequireUserActionInWallet: (val: boolean) => void;
  slippage: number;
  setSlippage: (slippage: number) => void;
  sourceToken?: TransferInputTokenResource;
};

export const DepositButtonAndReceipt = ({
  chainId,
  setError,
  slippage,
  setSlippage,
  sourceToken,
  isDisabled,
  isLoading,
  setRequireUserActionInWallet,
}: ElementProps) => {
  const [isEditingSlippage, setIsEditingSlipapge] = useState(false);
  const stringGetter = useStringGetter();

  const canAccountTrade = useAppSelector(calculateCanAccountTrade, shallowEqual);

  const { connectWallet, isConnectedWagmi } = useWalletConnection();
  const { connectionError } = useApiState();

  const connectWagmi = async () => {
    try {
      setRequireUserActionInWallet(false);
      await connectWallet();
      setRequireUserActionInWallet(false);
    } catch (e) {
      setRequireUserActionInWallet(true);
    }
  };

  const {
    matchNetwork: switchNetwork,
    isSwitchingNetwork,
    isMatchingNetwork,
  } = useMatchingEvmNetwork({
    chainId,
    onError: setError,
  });

  const { current: equity, postOrder: newEquity } =
    useAppSelector(getSubaccountEquity, shallowEqual) ?? {};

  const { current: buyingPower, postOrder: newBuyingPower } =
    useAppSelector(getSubaccountBuyingPower, shallowEqual) ?? {};

  const {
    summary,
    requestPayload,
    depositOptions,
    chain: chainIdStr,
  } = useAppSelector(getTransferInputs, shallowEqual) ?? {};
  const { usdcLabel } = useTokenConfigs();

  const sourceChainName =
    depositOptions?.chains?.toArray().find((chain) => chain.type === chainIdStr)?.stringKey ?? '';

  const submitButtonReceipt = [
    {
      key: 'expected-deposit-amount',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.EXPECTED_DEPOSIT_AMOUNT })} <Tag>{usdcLabel}</Tag>
        </span>
      ),
      value: (
        <Output type={OutputType.Fiat} fractionDigits={TOKEN_DECIMALS} value={summary?.toAmount} />
      ),
    },
    {
      key: 'minimum-deposit-amount',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.MINIMUM_DEPOSIT_AMOUNT })} <Tag>{usdcLabel}</Tag>
        </span>
      ),
      value: (
        <Output
          type={OutputType.Fiat}
          fractionDigits={TOKEN_DECIMALS}
          value={summary?.toAmountMin}
        />
      ),
      tooltip: 'minimum-deposit-amount',
    },
    {
      key: 'exchange-rate',
      label: <span>{stringGetter({ key: STRING_KEYS.EXCHANGE_RATE })}</span>,
      value:
        typeof summary?.exchangeRate === 'number' ? (
          <$ExchangeRate>
            <Output
              type={OutputType.Asset}
              value={1}
              fractionDigits={0}
              tag={sourceToken?.symbol}
            />
            =
            <Output type={OutputType.Asset} value={summary?.exchangeRate} tag={usdcLabel} />
          </$ExchangeRate>
        ) : (
          <Output type={OutputType.Asset} />
        ),
    },
    typeof summary?.gasFee === 'number' && {
      key: 'gas-fees',
      label: (
        <WithTooltip tooltip="gas-fees-deposit" stringParams={{ SOURCE_CHAIN: sourceChainName }}>
          {stringGetter({ key: STRING_KEYS.GAS_FEE })}
        </WithTooltip>
      ),
      value: <Output type={OutputType.Fiat} value={summary?.gasFee} />,
    },
    typeof summary?.bridgeFee === 'number' && {
      key: 'bridge-fees',
      label: (
        <WithTooltip tooltip="bridge-fees-deposit">
          {stringGetter({ key: STRING_KEYS.BRIDGE_FEE })}
        </WithTooltip>
      ),
      value: <Output type={OutputType.Fiat} value={summary?.bridgeFee} />,
    },
    {
      key: 'equity',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.EQUITY })} <Tag>{usdcLabel}</Tag>
        </span>
      ),
      value: (
        <DiffOutput
          type={OutputType.Fiat}
          value={equity}
          newValue={newEquity} // using toAmountUSD as a proxy for equity until Abacus supports accounts with no funds.
          sign={NumberSign.Positive}
          withDiff={equity !== newEquity}
        />
      ),
    },
    {
      key: 'buying-power',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.BUYING_POWER })} <Tag>{usdcLabel}</Tag>
        </span>
      ),
      value: (
        <DiffOutput
          type={OutputType.Fiat}
          value={MustBigNumber(buyingPower).lt(0) ? undefined : buyingPower}
          newValue={newBuyingPower}
          sign={NumberSign.Positive}
          withDiff={Boolean(newBuyingPower) && buyingPower !== newBuyingPower}
        />
      ),
    },
    {
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
      key: 'estimatedRouteDuration',
      label: <span>{stringGetter({ key: STRING_KEYS.ESTIMATED_TIME })}</span>,
      value: (
        <Output
          type={OutputType.Text}
          value={
            summary != null && typeof summary.estimatedRouteDuration === 'number'
              ? stringGetter({
                  key: STRING_KEYS.X_MINUTES_LOWERCASED,
                  params: {
                    X:
                      summary.estimatedRouteDuration < 60
                        ? '< 1'
                        : Math.round(summary.estimatedRouteDuration / 60),
                  },
                })
              : null
          }
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
      ) : !isConnectedWagmi ? (
        <Button action={ButtonAction.Primary} onClick={connectWagmi}>
          {stringGetter({ key: STRING_KEYS.RECONNECT_WALLET })}
        </Button>
      ) : !isMatchingNetwork ? (
        <Button
          action={ButtonAction.Primary}
          onClick={switchNetwork}
          state={{ isLoading: isSwitchingNetwork }}
        >
          {stringGetter({ key: STRING_KEYS.SWITCH_NETWORK })}
        </Button>
      ) : (
        <Button
          action={ButtonAction.Primary}
          type={ButtonType.Submit}
          state={{
            isDisabled: !isFormValid,
            isLoading: (isFormValid && !requestPayload) || isLoading,
          }}
        >
          {stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS })}
        </Button>
      )}
    </$WithReceipt>
  );
};
const $ExchangeRate = styled.span`
  ${layoutMixins.row}
  gap: 0.5ch;
`;

const $WithReceipt = styled(WithReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
`;

const $Details = styled(Details)`
  --details-item-vertical-padding: 0.33rem;
  padding: var(--form-input-paddingY) var(--form-input-paddingX);
  font-size: 0.8125em;
`;
