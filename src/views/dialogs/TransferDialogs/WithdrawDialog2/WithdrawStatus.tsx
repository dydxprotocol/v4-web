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
  id?: string;
  onClose: () => void;
};

export const WithdrawStatus = ({ id = '', onClose }: WithdrawStatusProps) => {
  const stringGetter = useStringGetter();
  const withdraw = useParameterizedSelector(selectWithdraw, id);

  const transferSuccess = withdraw?.status === 'success';
  const transferError = withdraw?.status === 'error';
  const transferAssetRelease = withdraw?.transferAssetRelease;

  const statusDescription = useMemo(() => {
    if (transferSuccess) return stringGetter({ key: STRING_KEYS.YOUR_FUNDS_WITHDRAWN });
    if (transferError) {
      if (transferAssetRelease && transferAssetRelease.released) {
        // TODO: Localize
        return `An error has occured funds were withdrawn to ${transferAssetRelease.chainID}`;
      }

      return stringGetter({ key: STRING_KEYS.WITHDRAWAL_FAILED_TRY_AGAIN });
    }
    return stringGetter({ key: STRING_KEYS.YOUR_FUNDS_WITHDRAWN_SHORTLY });
  }, [stringGetter, transferAssetRelease, transferError, transferSuccess]);

  const WithdrawalOutput =
    withdraw == null ? (
      <Output tw="inline" value={null} type={OutputType.Fiat} isLoading />
    ) : (
      <Output
        tw="inline"
        value={withdraw.finalAmountUsd ?? withdraw.estimatedAmountUsd}
        type={OutputType.Fiat}
        slotLeft={withdraw.finalAmountUsd ? undefined : '~'}
        slotRight=" USDC"
      />
    );

  return (
    <div tw="flex flex-col gap-1 px-2 pb-1.5 pt-2.5">
      <div tw="flex flex-col gap-0.5">
        {!transferSuccess ? (
          <LoadingSpinner tw="self-center" id="deposit-status" size="64" strokeWidth="4" />
        ) : transferError ? (
          <Icon tw="self-center text-color-error" iconName={IconName.Warning} size="64px" />
        ) : (
          <Icon tw="self-center" iconName={IconName.SuccessCircle} size="64px" />
        )}
        <div tw="flex flex-col items-center gap-0.375 px-3 py-1 text-center">
          <div tw="text-large">
            {!transferSuccess
              ? stringGetter({ key: STRING_KEYS.WITHDRAW_IN_PROGRESS })
              : stringGetter({
                  key: STRING_KEYS.WITHDRAW_COMPLETE,
                  params: { AMOUNT_USD: WithdrawalOutput },
                })}
          </div>
          <div tw="text-color-text-0">{statusDescription}</div>
        </div>
      </div>
      <div tw="flex items-center justify-between self-stretch">
        <div tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.YOUR_WITHDRAWAL })}</div>
        <div tw="flex items-center gap-0.125">
          {WithdrawalOutput}
          {withdraw && <AssetIcon symbol="USDC" chainId={withdraw.destinationChainId} />}
        </div>
      </div>
      <Button
        state={{ isLoading: !withdraw && !transferError }}
        onClick={onClose}
        action={transferSuccess ? ButtonAction.Primary : ButtonAction.Base}
      >
        {stringGetter({ key: STRING_KEYS.CLOSE })}
      </Button>
    </div>
  );
};
