import { useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';
import { formatUnits } from 'viem';

import { TransferInputTokenResource } from '@/constants/abacus';
import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { formatSeconds } from '@/lib/timeUtils';

import { layoutMixins } from '@/styles/layoutMixins';

import { useStringGetter } from '@/hooks';
import { useAccountBalance } from '@/hooks/useAccountBalance';

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
import { getSubaccount } from '@/state/accountSelectors';
import { getTransferInputs } from '@/state/inputsSelectors';

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
  withdrawChain,
  withdrawToken,

  isDisabled,
  isLoading,
}: ElementProps) => {
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);
  const [isEditingSlippage, setIsEditingSlipapge] = useState(false);
  const stringGetter = useStringGetter();

  const { leverage } = useSelector(getSubaccount, shallowEqual) || {};
  const { summary, requestPayload } = useSelector(getTransferInputs, shallowEqual) || {};
  const canAccountTrade = useSelector(calculateCanAccountTrade, shallowEqual);

  const toAmount =
    summary?.toAmount &&
    withdrawToken?.decimals &&
    formatUnits(BigInt(summary.toAmount), withdrawToken?.decimals);

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

  const submitButtonReceipt = [
    {
      key: 'total-fees',
      label: <span>{stringGetter({ key: STRING_KEYS.TOTAL_FEES })}</span>,
      value: typeof summary?.bridgeFee === 'number' || typeof summary?.gasFee === 'number' && (
        <Output type={OutputType.Fiat} value={(summary?.bridgeFee || 0) + (summary?.gasFee || 0)} />
      ),
      subitems: feeSubitems,
    },
    {
      key: 'wallet',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.AMOUNT_RECEIVED })}{' '}
          {withdrawToken && <Tag>{withdrawToken?.symbol}</Tag>}
        </span>
      ),
      value: (
        <Styled.DiffOutput
          type={OutputType.Asset}
          value={'0'}
          newValue={toAmount}
          sign={NumberSign.Positive}
          withDiff={Boolean(toAmount)}
        />
      ),
    },
    {
      key: 'leverage',
      label: <span>{stringGetter({ key: STRING_KEYS.ACCOUNT_LEVERAGE })}</span>,
      value: (
        <Styled.DiffOutput
          type={OutputType.Multiple}
          value={leverage?.current}
          newValue={leverage?.postOrder}
          sign={NumberSign.Negative}
          withDiff={Boolean(leverage?.current && leverage.current !== leverage?.postOrder)}
        />
      ),
    },
    {
      key: 'exchange-rate',
      label: <span>{stringGetter({ key: STRING_KEYS.EXCHANGE_RATE })}</span>,
      value: withdrawToken && typeof summary?.exchangeRate === 'number' && (
        <Styled.ExchangeRate>
          <Output type={OutputType.Asset} value={1} fractionDigits={0} tag="USDC" />
          =
          <Output
            type={OutputType.Asset}
            value={summary?.exchangeRate}
            tag={withdrawToken?.symbol}
          />
        </Styled.ExchangeRate>
      ),
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
          {hasSubitems && (
            <Styled.DetailButtons>
              <Styled.ToggleButton
                shape={ButtonShape.Pill}
                size={ButtonSize.XSmall}
                isPressed={showFeeBreakdown}
                onPressedChange={setShowFeeBreakdown}
                slotLeft={<Icon iconName={IconName.Caret} />}
              >
                {showSubitemsToggle}
              </Styled.ToggleButton>
            </Styled.DetailButtons>
          )}
        </Styled.CollapsibleDetails>
      }
    >
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
    </Styled.WithReceipt>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.DiffOutput = styled(DiffOutput)`
  --diffOutput-valueWithDiff-fontSize: 1em;
`;

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
