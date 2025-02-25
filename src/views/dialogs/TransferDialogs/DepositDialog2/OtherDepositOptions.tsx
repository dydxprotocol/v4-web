import tw from 'twin.macro';

import { ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { StatsigFlags } from '@/constants/statsig';
import { WalletNetworkType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useFunkitBuyNobleUsdc } from '@/hooks/useFunkitBuyNobleUsdc';
import { useStatsigGateValue } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';

import { CoinbaseBrandIcon, FunkitIcon } from '@/icons';

import { Button } from '@/components/Button';

import { useAppDispatch } from '@/state/appTypes';
import { closeDialog, openDialog } from '@/state/dialogs';

import { testFlags } from '@/lib/testFlags';

import { DepositStep } from './depositHooks';

export const OtherDepositOptions = ({
  awaitingWalletAction,
  depositSteps,
  onClose,
}: {
  awaitingWalletAction: boolean;
  depositSteps?: DepositStep[];
  onClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const { sourceAccount } = useAccounts();

  const ffEnableFunkit =
    (useStatsigGateValue(StatsigFlags.ffEnableFunkitNew) || testFlags.showInstantDepositToggle) &&
    import.meta.env.VITE_FUNKIT_API_KEY &&
    sourceAccount.chain === WalletNetworkType.Evm;

  const startCheckout = useFunkitBuyNobleUsdc();

  const otherOptionsDisabled = Boolean(depositSteps?.length ?? awaitingWalletAction);
  const onBack = () => {
    dispatch(openDialog(DialogTypes.Deposit2({})));
    dispatch(closeDialog());
  };

  return (
    <>
      <div tw="mt-[0.75rem] flex flex-col gap-1" css={otherOptionsDisabled && tw`opacity-50`}>
        <div tw="flex items-center gap-1">
          <hr tw="flex-1 border-[0.5px] border-solid border-color-border" />
          <div tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.OR })}</div>
          <hr tw="flex-1 border-[0.5px] border-solid border-color-border" />
        </div>
        <Button
          onClick={() => {
            dispatch(
              openDialog(
                DialogTypes.CoinbaseDepositDialog({
                  onBack,
                })
              )
            );
            onClose();
          }}
          disabled={otherOptionsDisabled}
          type={ButtonType.Button}
          tw="flex items-center border border-solid border-color-border bg-color-layer-4 px-2 py-1 font-medium"
        >
          <div tw="inline-flex gap-[0.5ch]">
            {stringGetter({
              key: STRING_KEYS.DEPOSIT_WITH,
              params: {
                TARGET: (
                  <div tw="inline text-color-text-1">
                    <CoinbaseBrandIcon />
                  </div>
                ),
              },
            })}{' '}
            <span tw="sr-only">Coinbase</span>
          </div>
        </Button>
      </div>
      {ffEnableFunkit && (
        <div tw="mt-[0.75rem] flex flex-col gap-1" css={otherOptionsDisabled && tw`opacity-50`}>
          <div tw="flex items-center gap-1">
            <hr tw="flex-1 border-[0.5px] border-solid border-color-border" />
            <div tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.OR })}</div>
            <hr tw="flex-1 border-[0.5px] border-solid border-color-border" />
          </div>
          <Button
            onClick={() => {
              startCheckout();
              onClose();
            }}
            state={{ isDisabled: otherOptionsDisabled }}
            type={ButtonType.Button}
            tw="flex items-center border border-solid border-color-border bg-color-layer-4 px-2 py-1 font-medium"
          >
            <div tw="inline-flex gap-[0.5ch]">
              {stringGetter({
                key: STRING_KEYS.DEPOSIT_WITH,
                params: {
                  TARGET: (
                    <div tw="inline text-color-text-1">
                      <FunkitIcon />
                    </div>
                  ),
                },
              })}{' '}
              <span tw="sr-only">FunKit</span>
            </div>
          </Button>
        </div>
      )}
    </>
  );
};
