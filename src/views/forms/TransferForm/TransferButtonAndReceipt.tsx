import { TransferSummaryData, TransferToken } from '@/bonsai/forms/transfers';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { LEVERAGE_DECIMALS, NumberSign, TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { DydxChainAsset } from '@/constants/wallets';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';

import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';
import { isValidKey } from '@/lib/typeUtils';

type ElementProps = {
  summary: TransferSummaryData;
  isDisabled?: boolean;
  isLoading?: boolean;
  slotLeft?: React.ReactNode;
  buttonText?: React.ReactNode;
};

export const TransferButtonAndReceipt = ({
  summary,
  isDisabled,
  isLoading,
  buttonText,
  slotLeft,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const canAccountTrade = useAppSelector(calculateCanAccountTrade, shallowEqual);

  const { tokensConfigs } = useTokenConfigs();

  const isUSDCSelected = summary.inputs.token === TransferToken.USDC;
  const areUsdcFees = summary.feeDenom === TransferToken.USDC;
  const selectedAsset = isUSDCSelected ? DydxChainAsset.USDC : DydxChainAsset.CHAINTOKEN;
  const feeAsset = areUsdcFees ? DydxChainAsset.USDC : DydxChainAsset.CHAINTOKEN;

  const selectedTokenConfig = isValidKey(selectedAsset, tokensConfigs)
    ? tokensConfigs[selectedAsset]
    : undefined;
  const feeTokenConfig =
    summary.feeDenom != null && isValidKey(feeAsset, tokensConfigs)
      ? tokensConfigs[feeAsset]
      : undefined;

  const balance = isUSDCSelected
    ? summary.accountBefore.freeCollateral
    : summary.accountBefore.availableNativeBalance;
  const newBalance = isUSDCSelected
    ? summary.accountAfter.freeCollateral
    : summary.accountAfter.availableNativeBalance;
  const transferDetailItems = [
    {
      key: 'fees',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.FEES })} <Tag>{feeTokenConfig?.name}</Tag>
        </span>
      ),
      value: (
        <Output
          type={OutputType.Asset}
          value={summary.fee}
          fractionDigits={areUsdcFees ? USD_DECIMALS : TOKEN_DECIMALS}
        />
      ),
    },
    {
      key: 'balance',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.BALANCE })} <Tag>{selectedTokenConfig?.name}</Tag>
        </span>
      ),
      value: (
        <DiffOutput
          type={OutputType.Asset}
          value={balance}
          sign={NumberSign.Negative}
          newValue={newBalance}
          hasInvalidNewValue={MustBigNumber(newBalance).isNegative()}
          withDiff={newBalance != null && !MustBigNumber(balance).eq(newBalance)}
          fractionDigits={isUSDCSelected ? USD_DECIMALS : TOKEN_DECIMALS}
        />
      ),
    },
    isUSDCSelected && {
      key: 'leverage',
      label: <span>{stringGetter({ key: STRING_KEYS.LEVERAGE })}</span>,
      value: (
        <DiffOutput
          type={OutputType.Multiple}
          value={summary.accountBefore.leverage}
          newValue={summary.accountAfter.leverage}
          sign={NumberSign.Negative}
          withDiff={
            Boolean(summary.accountAfter.leverage) &&
            summary.accountBefore.leverage !== summary.accountAfter.leverage
          }
          fractionDigits={LEVERAGE_DECIMALS}
        />
      ),
    },
  ].filter(isTruthy);

  return (
    <$WithDetailsReceipt detailItems={transferDetailItems}>
      {!canAccountTrade ? (
        <OnboardingTriggerButton size={ButtonSize.Base} />
      ) : (
        <Button
          action={ButtonAction.Primary}
          type={ButtonType.Submit}
          state={{ isLoading, isDisabled }}
          slotLeft={slotLeft}
        >
          {buttonText ?? stringGetter({ key: STRING_KEYS.CONFIRM_TRANSFER })}
        </Button>
      )}
    </$WithDetailsReceipt>
  );
};
const $WithDetailsReceipt = styled(WithDetailsReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);

  dl {
    padding: var(--form-input-paddingY) var(--form-input-paddingX);
  }
`;
