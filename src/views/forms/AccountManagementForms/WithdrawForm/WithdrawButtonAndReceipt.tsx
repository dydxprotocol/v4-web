import { type Dispatch, type SetStateAction, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';
import { ChainType } from '@0xsquid/sdk';
import type { ChainData, CosmosChain, RouteData, TokenData } from '@0xsquid/sdk';
import BigNumber from 'bignumber.js';
import { parseUnits } from 'viem';

import { TransferInputChainResource, TransferInputTokenResource } from '@/constants/abacus';
import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';
import { useStringGetter } from '@/hooks';
import { useAccountBalance } from '@/hooks/useAccountBalance';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';

import { Details, DetailsItem } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { ToggleButton } from '@/components/ToggleButton';
import { WithReceipt } from '@/components/WithReceipt';

import { BIG_NUMBERS, MustBigNumber } from '@/lib/numbers';

import { SlippageEditor } from '../SlippageEditor';

import { getSubaccount } from '@/state/accountSelectors';
import { getTransferInputs } from '@/state/inputsSelectors';

type ElementProps = {
  setSlippage: (slippage: number) => void;

  slippage: number;
  withdrawChain?: TransferInputChainResource;
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

  const { balance, queryStatus } = useAccountBalance({
    addressOrDenom: withdrawToken?.address || undefined,
    assetSymbol: withdrawToken?.symbol || undefined,
    chainId: withdrawChain?.chainId || undefined,
    decimals: withdrawToken?.decimals || undefined,
    rpc: withdrawChain?.rpc || undefined,
    isCosmosChain: false,
  });

  const balanceBN = MustBigNumber(balance);
  // const newBalance =
  //   // toAmountMin && withdrawToken && parseUnits(toAmountMin, withdrawToken.decimals).toString();

  const { leverage } = useSelector(getSubaccount, shallowEqual) || {};
  const { summary, requestPayload } = useSelector(getTransferInputs) || {};

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

  const submitButtonReceipt = [
    {
      key: 'total-fees',
      label: <span>{stringGetter({ key: STRING_KEYS.TOTAL_FEES })}</span>,
      value: typeof summary?.bridgeFee === 'number' && typeof summary?.gasFee === 'number' && (
        <Output type={OutputType.Fiat} value={summary?.bridgeFee + summary?.gasFee} />
      ),
      subitems: feeSubitems,
    },
    {
      key: 'leverage',
      label: <span>{stringGetter({ key: STRING_KEYS.LEVERAGE })}</span>,
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
      value: withdrawToken && (
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
          slippage={slippage}
          setIsEditing={setIsEditingSlipapge}
          setSlippage={setSlippage}
        />
      ),
    },
    // {
    //   key: 'wallet',
    //   label: (
    //     <span>
    //       {stringGetter({ key: STRING_KEYS.WALLET })}{' '}
    //       {withdrawToken && <Tag>{withdrawToken?.symbol}</Tag>}
    //     </span>
    //   ),
    //   value: (
    //     <Styled.DiffOutput
    //       type={OutputType.Asset}
    //       value={balanceBN?.toString()}
    //       newValue={newBalance}
    //       sign={NumberSign.Negative}
    //       withDiff={Boolean(balance !== newBalance)}
    //     />
    //   ),
    // },
  ];

  const isFormValid = !isDisabled && !isEditingSlippage && queryStatus !== 'error';

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
  padding: 0.375rem 1rem 0.5rem;
  gap: 0.5rem;
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
