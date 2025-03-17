import { ButtonAction, ButtonShape } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import useOnboardingFlow from '@/hooks/Onboarding/useOnboardingFlow';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';
import { getChartDotBackground } from '@/state/appUiConfigsSelectors';

const UnconnectedPortfolioOverview = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const chartDotBackground = useAppSelector(getChartDotBackground);
  const { openOnboardingDialog, isOnboardingDisabled } = useOnboardingFlow();

  return (
    <div
      tw="flexColumn relative justify-end border-b-[length:--border-width] border-l-0 border-r-0 border-t-0 border-solid border-color-border py-1"
      css={{
        background: `url(${chartDotBackground}) no-repeat`,
        backgroundSize: '200%',
      }}
      className={className}
    >
      <div tw="flexColumn absolute left-1.25 top-1.25 gap-0.125">
        <Output tw="text-color-text-2 font-extra-bold" value={0} type={OutputType.Fiat} />
        <Output tw="text-color-positive" value={0} type={OutputType.Percent} />
      </div>
      <div tw="flexColumn w-full items-center justify-center px-2 text-center">
        {stringGetter({ key: STRING_KEYS.NO_FUNDS })}

        <Button
          tw="mt-1 w-full"
          shape={ButtonShape.Pill}
          onClick={openOnboardingDialog}
          state={{ isDisabled: isOnboardingDisabled }}
          action={ButtonAction.Primary}
        >
          <Icon iconName={IconName.Wallet} />
          {stringGetter({ key: STRING_KEYS.GET_STARTED })}
        </Button>
      </div>
    </div>
  );
};

export default UnconnectedPortfolioOverview;
