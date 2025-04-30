import tw from 'twin.macro';

import { ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { CoinbaseBrandIcon } from '@/icons';

import { Button } from '@/components/Button';

import { useAppDispatch } from '@/state/appTypes';
import { closeDialog, openDialog } from '@/state/dialogs';

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

  const otherOptionsDisabled = Boolean(depositSteps?.length ?? awaitingWalletAction);
  const onBack = () => {
    dispatch(openDialog(DialogTypes.Deposit2({})));
    dispatch(closeDialog());
  };

  return (
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
        <div tw="row w-full justify-between gap-[0.5ch]">
          <span tw="row gap-[0.5ch]">
            {stringGetter({
              key: STRING_KEYS.DEPOSIT_WITH,
              params: {
                TARGET: (
                  <div tw="row mb-[1px] text-color-text-1">
                    <CoinbaseBrandIcon />
                  </div>
                ),
              },
            })}
          </span>
          <span tw="text-color-text-0 font-small-book">
            {stringGetter({ key: STRING_KEYS.FREE_AND_INSTANT })}
          </span>
          <span tw="sr-only">Coinbase</span>
        </div>
      </Button>
    </div>
  );
};
