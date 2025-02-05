import { useMemo } from 'react';

import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';

import { selectWithdraw } from '@/state/transfersSelectors';

type WithdrawStatusProps = {
  txHash: string;
  chainId: string;
  onClose: () => void;
};

// TODO(deposit2.0): localization for this whole component
export const WithdrawStatus = ({ txHash, chainId, onClose }: WithdrawStatusProps) => {
  const stringGetter = useStringGetter();
  const withdraw = useParameterizedSelector(selectWithdraw, txHash, chainId);

  const transferSuccess = withdraw?.status === 'success';

  const statusDescription = useMemo(() => {
    if (transferSuccess) return 'Your funds are now available for trading.';

    if (withdraw?.isInstantWithdraw)
      return 'Your funds will be available soon, and you may safely close this window.';

    return 'You may safely close this window.';
  }, [withdraw, transferSuccess]);

  if (!withdraw) return null;

  return (
    <div tw="flex flex-col gap-1 px-2 pb-1.5 pt-2.5">
      <div tw="flex flex-col gap-0.5">
        {!transferSuccess ? (
          <LoadingSpinner tw="self-center" id="deposit-status" size="64" strokeWidth="4" />
        ) : (
          <Icon tw="self-center" iconName={IconName.SuccessCircle} size="64px" />
        )}
        <div tw="flex flex-col items-center gap-0.375 px-3 py-1 text-center">
          <div tw="text-large">{!transferSuccess ? 'Deposit in progress' : 'Deposit complete'}</div>
          <div tw="text-color-text-0">{statusDescription}</div>
        </div>
      </div>
      <div tw="flex items-center justify-between self-stretch">
        <div tw="text-color-text-0">Your withdraw</div>
        <div tw="flex items-center gap-0.125">
          <Output
            tw="inline"
            value={withdraw.finalAmountUsd ?? withdraw.estimatedAmountUsd}
            type={OutputType.Fiat}
            slotLeft={withdraw.finalAmountUsd ? undefined : '~'}
          />
          <AssetIcon symbol="USDC" chainId={withdraw.chainId} />
        </div>
      </div>
      <Button onClick={onClose} action={transferSuccess ? ButtonAction.Primary : ButtonAction.Base}>
        {stringGetter({ key: STRING_KEYS.CLOSE })}
      </Button>
    </div>
  );
};
