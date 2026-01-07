export enum LocalStorageKey {
  // Onboarding / Accounts
  EvmAddress = 'dydx.EvmAddress',
  SolAddress = 'dydx.SolAddress',
  DydxAddress = 'dydx.DydxAddress',
  OnboardingSelectedWallet = 'dydx.OnboardingSelectedWallet',
  OnboardingHasAcknowledgedTerms = 'dydx.OnboardingHasAcknowledgedTerms',
  KeplrCompliance = 'dydx.KeplrCompliance',

  EvmDerivedAddresses = 'dydx.EvmDerivedAddresses', // Deprecated
  SolDerivedAddresses = 'dydx.SolDerivedAddresses', // Deprecated

  // Gas
  SelectedGasDenom = 'dydx.SelectedGasDenom',

  // Notifications
  Notifications = 'dydx.Notifications',
  NotificationsLastUpdated = 'dydx.NotificationsLastUpdated',
  AppInitialized = 'dydx.AppInitialized',
  PushNotificationsEnabled = 'dydx.PushNotificationsEnabled',
  PushNotificationsLastUpdated = 'dydx.PushNotificationsLastUpdated',
  TransferNotifications = 'dydx.TransferNotifications',
  NotificationPreferences = 'dydx.NotificationPreferences',

  // UI State
  LastViewedMarket = 'dydx.LastViewedMarket',
  LastViewedSpotToken = 'dydx.LastViewedSpotToken',
  SelectedLocale = 'dydx.SelectedLocale',
  SelectedNetwork = 'dydx.SelectedNetwork',
  SelectedTradeLayout = 'dydx.SelectedTradeLayout',

  HasSeenUiRefresh = 'dydx.HasSeenUiRefresh',
  // Discoverability
  HasSeenElectionBannerTRUMPWIN = 'dydx.HasSeenElectionBannerTRUMPWIN',
  HasSeenTradeFormMessageTRUMPWIN = 'dydx.HasSeenTradeFormMessageTRUMPWIN',
  HasSeenSurgeBanner = 'dydx.HasSeenSurgeBanner',

  CustomFlags = 'dydx.CustomFlags',
}

export const LOCAL_STORAGE_VERSIONS = {
  [LocalStorageKey.EvmDerivedAddresses]: 'v2',
  [LocalStorageKey.SolDerivedAddresses]: 'v1',
  [LocalStorageKey.NotificationPreferences]: 'v2',
  [LocalStorageKey.TransferNotifications]: 'v1',
  [LocalStorageKey.Notifications]: 'v1',
  [LocalStorageKey.KeplrCompliance]: 'v1',
  [LocalStorageKey.SelectedTradeLayout]: 'v1',
  // TODO: version all localStorage keys
};
