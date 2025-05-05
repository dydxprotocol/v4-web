import { type RootState } from './_store';

export const getCustomNotifications = (state: RootState) => state.notifications.customNotifications;
export const getCosmosWalletNotifications = (state: RootState) =>
  state.notifications.cosmosWalletNotifications;
