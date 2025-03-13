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

import { selectDeposit } from '@/state/transfersSelectors';

import { truncateAddress } from '@/lib/wallet';

import { getTokenSymbol } from '../utils';

type DepositStatusProps = {
  txHash: string;
  chainId: string;
  onClose: () => void;
};

export const DepositStatus = ({ txHash, chainId, onClose }: DepositStatusProps) => {
  const stringGetter = useStringGetter();
  const deposit = useParameterizedSelector(selectDeposit, txHash, chainId);

  const depositSuccess = deposit?.status === 'success';

  const statusDescription = useMemo(() => {
    if (depositSuccess) return stringGetter({ key: STRING_KEYS.YOUR_FUNDS_AVAILABLE_FOR_TRADING });

    if (deposit?.isInstantDeposit)
      return stringGetter({ key: STRING_KEYS.YOUR_FUNDS_AVAILABLE_SOON });

    return stringGetter({ key: STRING_KEYS.YOU_MAY_CLOSE_WINDOW });
  }, [deposit, depositSuccess, stringGetter]);

  if (!deposit) return null;

  return (
    <div tw="flex flex-col gap-1 px-2 pb-1.5 pt-2.5">
      <div tw="flex flex-col gap-0.5">
        {!depositSuccess ? (
          <LoadingSpinner tw="self-center" id="deposit-status" size="64" strokeWidth="4" />
        ) : (
          <Icon tw="self-center" iconName={IconName.SuccessCircle} size="64px" />
        )}
        <div tw="flex flex-col items-center gap-0.375 px-3 py-1 text-center">
          <div tw="text-large">
            {!depositSuccess
              ? stringGetter({ key: STRING_KEYS.DEPOSIT_IN_PROGRESS })
              : stringGetter({ key: STRING_KEYS.DEPOSIT_COMPLETED })}
          </div>
          <div tw="text-color-text-0">{statusDescription}</div>
        </div>
      </div>
      <div tw="flex items-center justify-between self-stretch">
        <div tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.YOUR_DEPOSIT })}</div>
        <div tw="flex items-center gap-0.125">
          <Output
            tw="inline"
            value={deposit.finalAmountUsd ?? deposit.estimatedAmountUsd}
            type={OutputType.Fiat}
            slotLeft={deposit.finalAmountUsd ? undefined : '~'}
          />
          <AssetIcon symbol={getTokenSymbol(deposit.token.denom)} chainId={deposit.token.chainId} />
        </div>
      </div>
      <Button onClick={onClose} action={depositSuccess ? ButtonAction.Primary : ButtonAction.Base}>
        {depositSuccess
          ? stringGetter({ key: STRING_KEYS.START_TRADING })
          : stringGetter({ key: STRING_KEYS.CLOSE })}
      </Button>

      {deposit.explorerLink && (
        <div tw="row justify-between">
          <span tw="text-color-text-0">
            {stringGetter({ key: STRING_KEYS.VIEW_TRANSACTIONS_SHORT })}
          </span>
          <Link tw="font-small-book" href={deposit.explorerLink} isAccent isInline withIcon>
            {truncateAddress(deposit.txHash, '')}
          </Link>
        </div>
      )}
    </div>
  );
};
