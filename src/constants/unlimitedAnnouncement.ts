export enum UnlimitedAnnouncementDialogSteps {
  Announcement = 'Announcement',
  MarketListings = 'MarketListings',
  MegaVault = 'MegaVault',
  AffiliatesProgram = 'Affiliates',
  Incentives = 'Incentives',
}

export const unlimitedAnnouncementStepOrder = [
  UnlimitedAnnouncementDialogSteps.Announcement,
  UnlimitedAnnouncementDialogSteps.MarketListings,
  UnlimitedAnnouncementDialogSteps.MegaVault,
  UnlimitedAnnouncementDialogSteps.AffiliatesProgram,
  UnlimitedAnnouncementDialogSteps.Incentives,
] as const;
