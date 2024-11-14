import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { UnlimitedAnnouncementDialogSteps } from '@/constants/unlimitedAnnouncement';

import { useCurrentAppThemeSetting } from '@/hooks/useAppThemeAndColorMode';
import { useStringGetter } from '@/hooks/useStringGetter';

import { LogoIcon } from '@/icons/logo';

import { AppTheme } from '@/state/appUiConfigs';

export const UnlimitedAnnouncementHeader = ({
  currentStep,
}: {
  currentStep: UnlimitedAnnouncementDialogSteps;
}) => {
  const stringGetter = useStringGetter();
  const theme = useCurrentAppThemeSetting();

  const themeName =
    theme === AppTheme.Classic ? 'original' : theme === AppTheme.Dark ? 'dark' : 'light';

  const backgrounds: {
    [key in UnlimitedAnnouncementDialogSteps]: string;
  } = {
    [UnlimitedAnnouncementDialogSteps.Announcement]: 'announcement',
    [UnlimitedAnnouncementDialogSteps.MarketListings]: 'launch',
    [UnlimitedAnnouncementDialogSteps.MegaVault]: 'vault',
    [UnlimitedAnnouncementDialogSteps.AffiliatesProgram]: 'affiliates',
    [UnlimitedAnnouncementDialogSteps.Incentives]: 'rewards',
  };

  switch (currentStep) {
    case UnlimitedAnnouncementDialogSteps.Announcement:
      return (
        <$Title>
          <img src="/unlimited/announcement.svg" tw="absolute top-0.75 h-auto w-full" alt="" />
          <div tw="relative flex h-full flex-col items-center justify-center gap-0.5">
            <h3>{stringGetter({ key: STRING_KEYS.INTRODUCING })}</h3>
            <span tw="flex items-center gap-0.75">
              <LogoIcon tw="h-2.5 w-min" />
              <$Unlimited>{stringGetter({ key: STRING_KEYS.UNLIMITED })}</$Unlimited>
            </span>
          </div>
        </$Title>
      );

    default:
      return (
        <$PlaceholderTitle>
          <img
            src={`/unlimited/${backgrounds[currentStep]}-${themeName}.png`}
            tw="absolute h-auto w-full"
            alt=""
          />
        </$PlaceholderTitle>
      );
  }
};

const $Title = styled.div`
  height: 200px;
  background-color: var(--color-layer-1);
  overflow: hidden;

  h3 {
    color: var(--color-text-0);
    font: var(--font-medium-bold);
  }

  border-bottom: var(--border);
`;

const $Unlimited = styled.div`
  border: 3px solid var(--color-border);
  border-radius: 1rem;
  padding: 0.25rem 0.5rem;

  color: var(--color-text-2);
  font: var(--font-extra-medium);
`;

const $PlaceholderTitle = styled.div`
  height: 360px;
  background-color: var(--color-layer-1);
  border-bottom: var(--border);
`;
