import { useMemo } from 'react';

import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';

import { selectWithdraw } from '@/state/transfersSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { truncateAddress } from '@/lib/wallet';

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
        return stringGetter({
          key: STRING_KEYS.WITHDRAWN_TO_CHAINID,
          params: { CHAIN_ID: transferAssetRelease.chainID },
        });
      }

      return stringGetter({ key: STRING_KEYS.WITHDRAWAL_FAILED_TRY_AGAIN });
    }
    return stringGetter({ key: STRING_KEYS.YOUR_FUNDS_WITHDRAWN_SHORTLY });
  }, [stringGetter, transferAssetRelease, transferError, transferSuccess]);

  const withdrawalOutput =
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

  const withdrawalExplorerLinks = withdraw?.transactions
    .map((t) => {
      if (!t.explorerLink) return null;

      return (
        <Link key={t.txHash} href={t.explorerLink} withIcon isAccent isInline>
          {truncateAddress(t.txHash, '')}
        </Link>
      );
    })
    .filter(isTruthy);

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
                  params: { AMOUNT_USD: withdrawalOutput },
                })}
          </div>
          <div tw="text-color-text-0">{statusDescription}</div>
        </div>
      </div>
      <div tw="flex items-center justify-between self-stretch">
        <div tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.YOUR_WITHDRAWAL })}</div>
        <div tw="flex items-center gap-0.125">
          {withdrawalOutput}
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

      {withdrawalExplorerLinks?.length && (
        <div tw="row justify-between">
          <span tw="text-color-text-0">
            {stringGetter({ key: STRING_KEYS.VIEW_TRANSACTIONS_SHORT })}
          </span>
          <div tw="row ml-auto gap-0.5 font-small-book">{withdrawalExplorerLinks}</div>
        </div>
      )}
    </div>
  );
};
