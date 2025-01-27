import { ReactNode } from 'react';

import ConnectingLine from '@/icons/connecting-line.svg';

import { Icon, IconName } from '@/components/Icon';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';

import { DepositStep } from './utils';

type DepositStepsProps = {
  steps: DepositStep[];
  currentStep: number;
  showRetry: boolean;
  onRetry: () => void;
};

const STEP_TYPE_TO_INFO: { [type: string]: { title: string; icon: ReactNode } } = {
  network: {
    title: 'Switch networks',
    icon: <Icon size="1.25rem" iconName={IconName.Switch} />,
  },
  approve: {
    title: 'Approve USDC',
    icon: <Icon size="1.25rem" iconName={IconName.Usdc} />,
  },
  deposit: {
    title: 'Confirm deposit',
    icon: <Icon size="1.25rem" iconName={IconName.Deposit} />,
  },
};

export const DepositSteps = ({ steps, currentStep, showRetry, onRetry }: DepositStepsProps) => {
  return (
    <div tw="flex flex-col">
      {steps.map((step, i) => {
        const stepInfo = STEP_TYPE_TO_INFO[step.type]!;
        return (
          <div key={step.type} tw="flex flex-col items-start">
            <div tw="flex items-center gap-0.125">
              <div tw="relative p-0.5">
                <LoadingSpinner
                  id={`deposit-step-${step.type}`}
                  size="100%"
                  strokeWidth="2"
                  stroke=""
                  tw="absolute left-0 top-0 flex h-full w-full items-center justify-center text-color-accent"
                  style={{ visibility: i === currentStep && !showRetry ? undefined : 'hidden' }}
                />
                <div tw="flex items-center justify-center rounded-4 bg-color-layer-5 p-0.5">
                  {stepInfo.icon}
                </div>
              </div>
              <div tw="flex items-center gap-0.5">
                <div
                  tw="opacity-50 transition-all duration-300"
                  style={{ opacity: i === currentStep ? '100%' : undefined }}
                >
                  {stepInfo.title}
                </div>
                {showRetry && i === currentStep && (
                  <button
                    tw="rounded-0.5 border border-solid border-color-accent p-0.125 text-color-accent"
                    type="button"
                    onClick={onRetry}
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
            {i !== steps.length - 1 && <ConnectingLine tw="ml-[25px]" />}
          </div>
        );
      })}
    </div>
  );
};
