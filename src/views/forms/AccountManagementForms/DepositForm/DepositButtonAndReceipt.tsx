import { useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';

import type { RouteData } from '@0xsquid/sdk';
import { shallowEqual, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';

import { TransferInputTokenResource } from '@/constants/abacus';
import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, TOKEN_DECIMALS } from '@/constants/numbers';

import { useApiState, useStringGetter, useTokenConfigs } from '@/hooks';
import { ConnectionErrorType } from '@/hooks/useApiState';
import { useMatchingEvmNetwork } from '@/hooks/useMatchingEvmNetwork';
import { useWalletConnection } from '@/hooks/useWalletConnection';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Details, DetailsItem } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { ToggleButton } from '@/components/ToggleButton';
import { WithReceipt } from '@/components/WithReceipt';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { getSubaccountBuyingPower, getSubaccountEquity } from '@/state/accountSelectors';
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
  slotError?: ReactNode;
  setSlippage: (slippage: number) => void;
  sourceToken?: TransferInputTokenResource;
  squidRoute?: RouteData;
};

export const DepositButtonAndReceipt = ({
  chainId,
  setError,
  slippage,
  setSlippage,
  sourceToken,

  isDisabled,
  isLoading,
  slotError,
  setRequireUserActionInWallet,
}: ElementProps) => {
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);
  const [isEditingSlippage, setIsEditingSlipapge] = useState(false);
  const stringGetter = useStringGetter();

  const canAccountTrade = useSelector(calculateCanAccountTrade, shallowEqual);

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
    useSelector(getSubaccountEquity, shallowEqual) || {};

  const { current: buyingPower, postOrder: newBuyingPower } =
    useSelector(getSubaccountBuyingPower, shallowEqual) || {};

  const { isCctp, summary, requestPayload } = useSelector(getTransferInputs, shallowEqual) || {};
  const { usdcLabel } = useTokenConfigs();

  const feeSubitems: DetailsItem[] = [];

  if (typeof summary?.gasFee === 'number') {
    feeSubitems.push({
      key: 'gas-fees',
      label: <span>{stringGetter({ key: STRING_KEYS.GAS_FEE })}</span>,
      value: <Output type={OutputType.Fiat} value={summary?.gasFee} />,
    });
  }

  if (typeof summary?.bridgeFee === 'number') {
    feeSubitems.push({
      key: 'bridge-fees',
      label: <span>{stringGetter({ key: STRING_KEYS.BRIDGE_FEE })}</span>,
      value: <Output type={OutputType.Fiat} value={summary?.bridgeFee} />,
    });
  }

  const hasSubitems = feeSubitems.length > 0;

  const showSubitemsToggle = showFeeBreakdown
    ? stringGetter({ key: STRING_KEYS.HIDE_ALL_DETAILS })
    : stringGetter({ key: STRING_KEYS.SHOW_ALL_DETAILS });

  const totalFees = (summary?.bridgeFee || 0) + (summary?.gasFee || 0);

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
      subitems: [
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
      ],
    },
    {
      key: 'exchange-rate',
      label: <span>{stringGetter({ key: STRING_KEYS.EXCHANGE_RATE })}</span>,
      value:
        typeof summary?.exchangeRate === 'number' ? (
          <Styled.ExchangeRate>
            <Output
              type={OutputType.Asset}
              value={1}
              fractionDigits={0}
              tag={sourceToken?.symbol}
            />
            =
            <Output type={OutputType.Asset} value={summary?.exchangeRate} tag={usdcLabel} />
          </Styled.ExchangeRate>
        ) : (
          <Output type={OutputType.Asset} />
        ),
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
    !isCctp && {
      key: 'total-fees',
      label: <span>{stringGetter({ key: STRING_KEYS.TOTAL_FEES })}</span>,
      value: <Output type={OutputType.Fiat} value={totalFees} />,
      subitems: feeSubitems,
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
            typeof summary?.estimatedRouteDuration === 'number'
              ? stringGetter({
                  key: STRING_KEYS.X_MINUTES_LOWERCASED,
                  params: {
                    X:
                      summary?.estimatedRouteDuration < 60
                        ? '< 1'
                        : Math.round(summary?.estimatedRouteDuration / 60),
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
    <Styled.WithReceipt
      slotReceipt={
        <Styled.CollapsibleDetails>
          <Styled.Details showSubitems={showFeeBreakdown} items={submitButtonReceipt} />
          <Styled.DetailButtons>
            {hasSubitems && (
              <Styled.ToggleButton
                shape={ButtonShape.Pill}
                size={ButtonSize.XSmall}
                isPressed={showFeeBreakdown}
                onPressedChange={setShowFeeBreakdown}
                slotLeft={<Icon iconName={IconName.Caret} />}
              >
                {showSubitemsToggle}
              </Styled.ToggleButton>
            )}
          </Styled.DetailButtons>
        </Styled.CollapsibleDetails>
      }
      slotError={slotError}
    >
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
    </Styled.WithReceipt>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.ExchangeRate = styled.span`
  ${layoutMixins.row}
  gap: 0.5ch;
`;

Styled.WithReceipt = styled(WithReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
`;

Styled.CollapsibleDetails = styled.div`
  ${layoutMixins.column}
  padding: var(--form-input-paddingY) var(--form-input-paddingX);
`;

Styled.Details = styled(Details)`
  font-size: 0.8125em;
`;

Styled.DetailButtons = styled.div`
  ${layoutMixins.spacedRow}
`;

Styled.ToggleButton = styled(ToggleButton)`
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
