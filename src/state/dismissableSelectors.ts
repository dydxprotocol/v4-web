import { testFlags } from '@/lib/testFlags';

import { type RootState } from './_store';

export const getHasSeenPredictionMarketIntroDialog = (state: RootState) =>
  state.dismissable.hasSeenPredictionMarketIntroDialog;

export const getDismissedAffiliateBanner = (state: RootState) =>
  state.dismissable.dismissedAffiliateBanner;

export const getShouldShowUnlimitedAnnouncement = (state: RootState) =>
  testFlags.unlimitedAnnouncement && !state.dismissable.hasSeenUnlimitedAnnouncement;
