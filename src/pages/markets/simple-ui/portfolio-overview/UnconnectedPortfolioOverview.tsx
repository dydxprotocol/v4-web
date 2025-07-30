import { OnboardingState } from '@/constants/account';
import { ButtonAction, ButtonShape } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import useOnboardingFlow from '@/hooks/Onboarding/useOnboardingFlow';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Output, OutputType } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';
import { getChartDotBackground } from '@/state/appUiConfigsSelectors';

export const UnconnectedPortfolioOverview = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const chartDotBackground = useAppSelector(getChartDotBackground);
  const { openOnboardingDialog, isOnboardingDisabled, onboardingState } = useOnboardingFlow();

  const buttonContent = isOnboardingDisabled ? (
    <>{stringGetter({ key: STRING_KEYS.UNAVAILABLE })}</>
  ) : onboardingState === OnboardingState.Disconnected ? (
    <>{stringGetter({ key: STRING_KEYS.GET_STARTED })} →</>
  ) : (
    <>{stringGetter({ key: STRING_KEYS.RECOVER_KEYS })}</>
  );

  return (
    <div
      tw="flexColumn relative justify-end border-b-[1px] border-l-0 border-r-0 border-t-0 border-solid border-color-layer-3 py-1"
      css={{
        background: `url(${chartDotBackground}) no-repeat`,
        backgroundSize: '200%',
      }}
      className={className}
    >
      <div tw="flexColumn absolute left-1.25 top-1.25 gap-0.125">
        <Output tw="text-color-text-2 font-extra-large-bold" value={0} type={OutputType.Fiat} />
        <Output tw="text-color-positive" value={0} type={OutputType.Percent} />
      </div>
      <div tw="flexColumn w-full items-center justify-center px-1.25 text-center text-color-text-0">
        {stringGetter({ key: STRING_KEYS.NO_FUNDS })}

        <Button
          tw="mt-1 w-full"
          css={{
            '--button-border': isOnboardingDisabled
              ? 'solid var(--border-width, var(--default-border-width)) var(--color-border)'
              : 'none',
          }}
          shape={ButtonShape.Pill}
          onClick={openOnboardingDialog}
          state={{ isDisabled: isOnboardingDisabled }}
          action={ButtonAction.Primary}
        >
          {buttonContent}
        </Button>
      </div>
    </div>
  );
};
