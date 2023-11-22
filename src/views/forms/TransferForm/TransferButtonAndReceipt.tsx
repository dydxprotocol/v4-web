import { shallowEqual, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';
import { DydxChainAsset } from '@/constants/wallets';

import { useAccountBalance, useTokenConfigs, useStringGetter } from '@/hooks';

import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { getSubaccount } from '@/state/accountSelectors';
import { getTransferInputs } from '@/state/inputsSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';

type ElementProps = {
  selectedAsset: DydxChainAsset;
  fee?: number;
  isDisabled?: boolean;
  isLoading?: boolean;
};

export const TransferButtonAndReceipt = ({
  selectedAsset,
  fee,
  isDisabled,
  isLoading,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const canAccountTrade = useSelector(calculateCanAccountTrade, shallowEqual);
  const { size } = useSelector(getTransferInputs, shallowEqual) || {};
  const { tokensConfigs } = useTokenConfigs();

  const { equity: equityInfo, leverage: leverageInfo } =
    useSelector(getSubaccount, shallowEqual) || {};

  const { nativeTokenBalance } = useAccountBalance();

  const { current: equity, postOrder: newEquity } = equityInfo || {};
  const { current: leverage, postOrder: newLeverage } = leverageInfo || {};

  const isUSDCSelected = selectedAsset === DydxChainAsset.USDC;

  const balance = isUSDCSelected ? equity : nativeTokenBalance;
  const newNativeTokenBalance = nativeTokenBalance
    .minus(size?.size ?? 0)
    .minus(fee ?? 0) // show balance after fees for button receipt
    .toNumber();

  const newBalance = isUSDCSelected ? newEquity : newNativeTokenBalance;

  const transferDetailItems = [
    {
      key: 'fees',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.FEES })} <Tag>{tokensConfigs[selectedAsset]?.name}</Tag>
        </span>
      ),
      value: <Output type={OutputType.Asset} value={fee} />,
    },
    {
      key: 'balance',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.BALANCE })}{' '}
          <Tag>{tokensConfigs[selectedAsset]?.name}</Tag>
        </span>
      ),
      value: (
        <DiffOutput
          type={OutputType.Asset}
          value={balance}
          sign={NumberSign.Negative}
          newValue={newBalance}
          hasInvalidNewValue={MustBigNumber(newBalance).isNegative()}
          withDiff={newBalance !== null && !MustBigNumber(balance).eq(newBalance ?? 0)}
        />
      ),
    },
    isUSDCSelected && {
      key: 'leverage',
      label: <span>{stringGetter({ key: STRING_KEYS.LEVERAGE })}</span>,
      value: (
        <DiffOutput
          type={OutputType.Multiple}
          value={leverage}
          newValue={newLeverage}
          sign={NumberSign.Negative}
          withDiff={Boolean(newLeverage) && leverage !== newLeverage}
        />
      ),
    },
  ].filter(isTruthy);

  return (
    <Styled.WithDetailsReceipt detailItems={transferDetailItems}>
      {!canAccountTrade ? (
        <OnboardingTriggerButton size={ButtonSize.Base} />
      ) : (
        <Button
          action={ButtonAction.Primary}
          type={ButtonType.Submit}
          state={{ isLoading, isDisabled }}
        >
          {stringGetter({ key: STRING_KEYS.CONFIRM_TRANSFER })}
        </Button>
      )}
    </Styled.WithDetailsReceipt>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.WithDetailsReceipt = styled(WithDetailsReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);

  dl {
    padding: var(--form-input-paddingY) var(--form-input-paddingX);
  }
`;
