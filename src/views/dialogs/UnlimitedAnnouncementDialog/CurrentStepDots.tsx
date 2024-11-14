import styled, { css } from 'styled-components';

import {
  UnlimitedAnnouncementDialogSteps,
  unlimitedAnnouncementStepOrder,
} from '@/constants/unlimitedAnnouncement';

export const CurrentStepDots = ({
  currentStep,
}: {
  currentStep: UnlimitedAnnouncementDialogSteps;
}) => (
  <div tw="flex justify-center gap-0.5">
    {unlimitedAnnouncementStepOrder.map((step) =>
      step !== UnlimitedAnnouncementDialogSteps.Announcement ? (
        <$Dot key={step} $highlight={step === currentStep} />
      ) : undefined
    )}
  </div>
);

const $Dot = styled.div<{ $highlight: boolean }>`
  border-radius: 50%;
  height: 0.4rem;
  width: 0.4rem;
  background-color: ${({ $highlight }) =>
    $highlight ? css`var(--color-text-2);` : css`var(--color-text-0);`};
`;
