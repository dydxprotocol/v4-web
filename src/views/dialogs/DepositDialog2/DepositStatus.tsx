import { ButtonAction } from '@/constants/buttons';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';

import { selectDeposit } from '@/state/transfersSelectors';

type DepositStatusProps = {
  txHash: string;
  chainId: string;
  onClose: () => void;
};

// TODO(deposit2.0): localization for this whole component
export const DepositStatus = ({ txHash, chainId, onClose }: DepositStatusProps) => {
  const deposit = useParameterizedSelector(selectDeposit, txHash, chainId);

  if (!deposit) return null;

  // TODO(deposit2.0): Also wait for account free collateral value to update to show success state
  const depositSuccess = deposit.status === 'success';
  return (
    <div tw="flex flex-col gap-1 px-2 pb-1.5 pt-2.5">
      <div tw="flex flex-col gap-0.5">
        {!depositSuccess ? (
          <LoadingSpinner tw="self-center" id="deposit-status" size="64" strokeWidth="4" />
        ) : (
          <Icon tw="self-center" iconName={IconName.SuccessCircle} size="64px" />
        )}
        <div tw="flex flex-col items-center gap-0.375 px-3 py-1 text-center">
          <div tw="text-large">{!depositSuccess ? 'Deposit in progress' : 'Deposit complete'}</div>
          <div tw="text-color-text-0">
            {!depositSuccess
              ? 'Your funds will be available soon, and you can safely close this window.'
              : 'Your funds are now available for trading.'}
          </div>
        </div>
      </div>
      <div tw="flex items-center justify-between self-stretch">
        <div tw="text-color-text-0">Your deposit</div>
        {/* TODO(deposit2.0): Show actual account free collateral diff here */}
        <div>
          <Output
            tw="inline"
            value={deposit.estimatedAmountUsd}
            type={OutputType.Fiat}
            slotLeft="~"
          />
        </div>
      </div>
      <Button onClick={onClose} action={depositSuccess ? ButtonAction.Primary : ButtonAction.Base}>
        {depositSuccess ? 'Start trading' : 'Close'}
      </Button>
    </div>
  );
};
