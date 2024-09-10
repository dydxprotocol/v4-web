import { useMemo, useState } from 'react';

import { LightningBoltIcon } from '@radix-ui/react-icons';
import styled from 'styled-components';

import { DialogProps, LaunchMarketDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog, DialogPlacement } from '@/components/Dialog';
import { Output, OutputType } from '@/components/Output';

import { NewMarketForm, NewMarketFormStep } from '../forms/NewMarketForm';

export const LaunchMarketDialog = ({ setIsOpen }: DialogProps<LaunchMarketDialogProps>) => {
  const { isMobile } = useBreakpoints();
  const [formStep, setFormStep] = useState<NewMarketFormStep>();
  const stringGetter = useStringGetter();

  const { title, description } = useMemo(() => {
    switch (formStep) {
      case NewMarketFormStep.SELECTION:
        return {
          title: (
            <$Title>
              {stringGetter({ key: STRING_KEYS.LAUNCH_A_MARKET })}
              <span tw="flex flex-row items-center text-small text-color-text-1">
                <LightningBoltIcon tw="text-color-warning" />{' '}
                {stringGetter({ key: STRING_KEYS.TRADE_INSTANTLY })}
              </span>
            </$Title>
          ),
          description: stringGetter({
            key: STRING_KEYS.MARKET_LAUNCH_DETAILS,
            params: {
              APR_PERCENTAGE: (
                <Output
                  type={OutputType.Percent}
                  tw="inline-block text-color-success"
                  value={0.3456}
                />
              ),
              DEPOSIT_AMOUNT: (
                <Output useGrouping type={OutputType.Fiat} tw="inline-block" value={10_000} />
              ),
              PAST_DAYS: 30,
            },
          }),
        };
      case NewMarketFormStep.PREVIEW:
        return {
          title: <$Title>{stringGetter({ key: STRING_KEYS.CONFIRM_LAUNCH_DETAILS })}</$Title>,
          description: stringGetter({
            key: STRING_KEYS.DEPOSIT_LOCKUP_DESCRIPTION,
            params: {
              NUM_DAYS: <span tw="text-color-text-1">30</span>,
              PAST_DAYS: 30,
              APR_PERCENTAGE: (
                <Output
                  type={OutputType.Percent}
                  tw="inline-block text-color-success"
                  value={0.3456}
                />
              ),
            },
          }),
        };
      case NewMarketFormStep.SUCCESS:
      default:
        return {
          title: null,
          description: null,
        };
    }
  }, [formStep, stringGetter]);

  return (
    <Dialog
      isOpen
      title={title}
      description={description}
      setIsOpen={setIsOpen}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <NewMarketForm setFormStep={setFormStep} />
    </Dialog>
  );
};

const $Title = styled.h2`
  ${layoutMixins.row}
  justify-content: space-between;
  margin: 0;
  font: var(--font-large-medium);
  color: var(--color-text-2);
`;
