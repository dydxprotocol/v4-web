import { useState } from 'react';

import styled from 'styled-components';

import { DialogProps, UnlimitedAnnouncementDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { UnlimitedAnnouncementDialogSteps } from '@/constants/unlimitedAnnouncement';

import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog } from '@/components/Dialog';

import { UnlimitedAnnouncementFooter } from './UnlimitedAnnouncementFooter';
import { UnlimitedAnnouncementHeader } from './UnlimitedAnnouncementHeader';

export const UnlimitedAnnouncementDialog = ({
  setIsOpen,
}: DialogProps<UnlimitedAnnouncementDialogProps>) => {
  const stringGetter = useStringGetter();

  const [currentStep, setCurrentStep] = useState(UnlimitedAnnouncementDialogSteps.Announcement);

  const dialogStrings: {
    [key in UnlimitedAnnouncementDialogSteps]: {
      title: string;
      description: string;
    };
  } = {
    [UnlimitedAnnouncementDialogSteps.Announcement]: {
      title: '',
      description: '',
    },
    [UnlimitedAnnouncementDialogSteps.MarketListings]: {
      title: stringGetter({
        key: STRING_KEYS.PERMISIONLESS_MARKET_LISTINGS,
      }),
      description: stringGetter({
        key: STRING_KEYS.PERMISIONLESS_MARKET_LISTINGS_DESCRIPTION,
      }),
    },
    [UnlimitedAnnouncementDialogSteps.MegaVault]: {
      title: stringGetter({
        key: STRING_KEYS.MEGAVAULT,
      }),
      description: stringGetter({
        key: STRING_KEYS.MEGAVAULT_DESCRIPTION,
      }),
    },
    [UnlimitedAnnouncementDialogSteps.AffiliatesProgram]: {
      title: stringGetter({
        key: STRING_KEYS.AFFILIATES_PROGRAM,
      }),
      description: stringGetter({
        key: STRING_KEYS.AFFILIATES_PROGRAM_DESCRIPTION,
      }),
    },
    [UnlimitedAnnouncementDialogSteps.Incentives]: {
      title: stringGetter({
        key: STRING_KEYS.INCENTIVES_PROGRAM,
      }),
      description: stringGetter({
        key: STRING_KEYS.INCENTIVES_PROGRAM_DESCRIPTION,
      }),
    },
  };

  return (
    <$Dialog
      isOpen
      setIsOpen={setIsOpen}
      slotHeader={<UnlimitedAnnouncementHeader currentStep={currentStep} />}
      slotFooter={
        <UnlimitedAnnouncementFooter
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          onDone={() => setIsOpen(false)}
        />
      }
      tw="[--dialog-footer-paddingBottom: 1.5rem]"
    >
      {currentStep === UnlimitedAnnouncementDialogSteps.Announcement ? (
        <div tw="flex flex-col gap-1.5">
          <div tw="flex flex-col gap-1">
            {[
              {
                title: STRING_KEYS.MARKET_LISTINGS,
                description: STRING_KEYS.MARKET_LISTINGS_DESCRIPTION,
              },
              { title: STRING_KEYS.MEGAVAULT, description: STRING_KEYS.MEGAVAULT_DESCRIPTION },
              {
                title: STRING_KEYS.AFFILIATES_PROGRAM,
                description: STRING_KEYS.AFFILIATES_PROGRAM_DESCRIPTION,
              },
              {
                title: STRING_KEYS.INCENTIVES_PROGRAM,
                description: STRING_KEYS.INCENTIVES_PROGRAM_DESCRIPTION,
              },
            ].map(({ title, description }, idx) => (
              <$Row key={title} tw="flex gap-1.5">
                <$AssetIcon symbol={(idx + 1).toString()} />
                <span tw="flex flex-col gap-0.25">
                  <h3>{stringGetter({ key: title })} </h3>
                  <p>{stringGetter({ key: description })}</p>
                </span>
              </$Row>
            ))}
          </div>
        </div>
      ) : (
        <$Row tw="flex flex-col gap-0.25 h-[4.5rem]">
          <h2>{dialogStrings[currentStep].title} </h2>
          <p>{dialogStrings[currentStep].description}</p>
        </$Row>
      )}
    </$Dialog>
  );
};

const $Dialog = styled(Dialog)`
  --dialog-content-paddingTop: var(--dialog-content-paddingBottom);
`;

const $Row = styled.div`
  h2 {
    color: var(--color-text-1);
    font: var(--font-medium-bold);
  }

  h3 {
    color: var(--color-text-1);
    font: var(--font-medium-book);
  }

  p {
    color: var(--color-text-0);
  }
`;

const $AssetIcon = styled(AssetIcon)`
  --asset-icon-size: 3rem;
  span {
    font-size: 1em;
  }
`;
