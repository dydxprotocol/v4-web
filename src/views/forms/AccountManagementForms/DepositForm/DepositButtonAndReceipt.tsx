import { type Dispatch, type SetStateAction, useState, type ReactNode } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';
import { shallowEqual, useSelector } from 'react-redux';
import type { RouteData } from '@0xsquid/sdk';

import {
  ButtonAction,
  ButtonShape,
  ButtonSize,
  ButtonState,
  ButtonType,
} from '@/constants/buttons';

import { TransferInputTokenResource } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { useStringGetter } from '@/hooks';
import { useMatchingEvmNetwork } from '@/hooks/useMatchingEvmNetwork';

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

import { MustBigNumber } from '@/lib/numbers';

import { SlippageEditor } from '../SlippageEditor';

type ElementProps = {
  isDisabled?: boolean;
  isLoading?: boolean;

  chainId?: string | number;
  setError?: Dispatch<SetStateAction<Error | undefined>>;
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
}: ElementProps) => {
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);
  const [isEditingSlippage, setIsEditingSlipapge] = useState(false);
  const stringGetter = useStringGetter();

  const canAccountTrade = useSelector(calculateCanAccountTrade, shallowEqual);

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

  const { summary, requestPayload } = useSelector(getTransferInputs, shallowEqual) || {};

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
      label: <span>Bridge Fee</span>,
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
      key: 'equity',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.EQUITY })} <Tag>USDC</Tag>
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
          {stringGetter({ key: STRING_KEYS.BUYING_POWER })} <Tag>USDC</Tag>
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
      key: 'exchange-rate',
      label: <span>{stringGetter({ key: STRING_KEYS.EXCHANGE_RATE })}</span>,
      value: typeof summary?.exchangeRate === 'number' && (
        <Styled.ExchangeRate>
          <Output type={OutputType.Asset} value={1} fractionDigits={0} tag={sourceToken?.symbol} />
          =
          <Output type={OutputType.Asset} value={summary?.exchangeRate} tag="USDC" />
        </Styled.ExchangeRate>
      ),
    },
    {
      key: 'total-fees',
      label: <span>{stringGetter({ key: STRING_KEYS.TOTAL_FEES })}</span>,
      value: <Output type={OutputType.Fiat} value={totalFees} />,
      subitems: feeSubitems,
    },
    {
      key: 'slippage',
      label: <span>{stringGetter({ key: STRING_KEYS.SLIPPAGE })}</span>,
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
      value: typeof summary?.estimatedRouteDuration === 'number' && (
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
      ),
    },
  ];

  const isFormValid = !isDisabled && !isEditingSlippage;

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
