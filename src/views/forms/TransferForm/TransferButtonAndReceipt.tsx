import { shallowEqual, useSelector } from 'react-redux';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';
import { DydxChainAsset } from '@/constants/wallets';

import { useAccountBalance, useStringGetter } from '@/hooks';

import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { getSubaccount } from '@/state/accountSelectors';
import { getTransferInputs } from '@/state/inputsSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';

type ElementProps = {
  selectedAsset: DydxChainAsset;
  fees?: number;
  isDisabled?: boolean;
  isLoading?: boolean;
};

export const TransferButtonAndReceipt = ({
  selectedAsset,
  fees,
  isDisabled,
  isLoading,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const canAccountTrade = useSelector(calculateCanAccountTrade, shallowEqual);
  const { size } = useSelector(getTransferInputs, shallowEqual) || {};

  const { equity: equityInfo, leverage: leverageInfo } =
    useSelector(getSubaccount, shallowEqual) || {};

  const { nativeTokenBalance } = useAccountBalance();

  const { current: equity, postOrder: newEquity } = equityInfo || {};
  const { current: leverage, postOrder: newLeverage } = leverageInfo || {};

  // TODO(@aforaleka): add wallet balance for DYDX
  const balance = selectedAsset === DydxChainAsset.USDC ? equity : nativeTokenBalance;
  const newBalance =
    selectedAsset === DydxChainAsset.USDC
      ? newEquity
      : MustBigNumber(nativeTokenBalance)
          .minus(size?.size ?? 0)
          .toNumber();

  const transferDetailItems = [
    {
      key: 'fees',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.FEES })} <Tag>{selectedAsset}</Tag>
        </span>
      ),
      value: <Output type={OutputType.Asset} value={fees} />,
    },
    {
      key: 'balance',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.BALANCE })} <Tag>{selectedAsset}</Tag>
        </span>
      ),
      value: (
        <DiffOutput
          type={OutputType.Asset}
          value={balance}
          newValue={newBalance}
          sign={NumberSign.Negative}
          withDiff={Boolean(newBalance) && balance !== newBalance}
        />
      ),
    },
    selectedAsset === DydxChainAsset.USDC && {
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
    <WithDetailsReceipt detailItems={transferDetailItems}>
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
    </WithDetailsReceipt>
  );
};
