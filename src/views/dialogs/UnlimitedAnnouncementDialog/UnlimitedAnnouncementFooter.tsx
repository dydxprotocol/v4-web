import { Dispatch, SetStateAction } from 'react';

import { useNavigate } from 'react-router-dom';

import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';
import {
  UnlimitedAnnouncementDialogSteps,
  unlimitedAnnouncementStepOrder,
} from '@/constants/unlimitedAnnouncement';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';

import { CurrentStepDots } from './CurrentStepDots';

export const UnlimitedAnnouncementFooter = ({
  currentStep,
  setCurrentStep,
  onDone,
}: {
  currentStep: UnlimitedAnnouncementDialogSteps;
  setCurrentStep: Dispatch<SetStateAction<UnlimitedAnnouncementDialogSteps>>;
  onDone?: () => void;
}) => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();

  const onTradeNow = () => {
    navigate(AppRoute.Trade);
    onDone?.();
  };

  const onIncrementStep = (incrementVal: number) => () => {
    const currentStepIndex = unlimitedAnnouncementStepOrder.indexOf(currentStep);
    setCurrentStep(
      unlimitedAnnouncementStepOrder[
        currentStepIndex + incrementVal
      ] as UnlimitedAnnouncementDialogSteps
    );
  };

  switch (currentStep) {
    case UnlimitedAnnouncementDialogSteps.Announcement:
      return (
        <div tw="flex gap-0.75">
          <Button tw="flex-1" action={ButtonAction.Base} onClick={onTradeNow}>
            {stringGetter({ key: STRING_KEYS.TRADE_NOW })}
          </Button>
          <Button tw="flex-1" action={ButtonAction.Primary} onClick={onIncrementStep(1)}>
            {stringGetter({ key: STRING_KEYS.LEARN_MORE })}
          </Button>
        </div>
      );

    default:
      return (
        <>
          <div tw="mb-1.5 flex gap-0.75">
            <Button tw="flex-1" action={ButtonAction.Secondary} onClick={onIncrementStep(-1)}>
              {stringGetter({ key: STRING_KEYS.BACK })}
            </Button>
            {unlimitedAnnouncementStepOrder.indexOf(currentStep) ===
            unlimitedAnnouncementStepOrder.length - 1 ? (
              <Button tw="grow-[3]" action={ButtonAction.Primary} onClick={onTradeNow}>
                {stringGetter({ key: STRING_KEYS.TRADE_NOW })}
              </Button>
            ) : (
              <Button tw="grow-[3]" action={ButtonAction.Primary} onClick={onIncrementStep(1)}>
                {stringGetter({ key: STRING_KEYS.NEXT })}
              </Button>
            )}
          </div>
          <CurrentStepDots currentStep={currentStep} />
        </>
      );
  }
};
