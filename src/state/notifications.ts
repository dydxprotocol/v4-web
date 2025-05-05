import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { CosmosWalletNotificationTypes, CustomNotification } from '@/constants/notifications';

export interface NotificationsState {
  customNotifications: CustomNotification[];
  cosmosWalletNotifications: Record<CosmosWalletNotificationTypes, boolean | undefined>;
}

const initialState: NotificationsState = {
  customNotifications: [],
  cosmosWalletNotifications: {
    [CosmosWalletNotificationTypes.GasRebalance]: undefined,
    [CosmosWalletNotificationTypes.ReclaimChildSubaccountFunds]: undefined,
    [CosmosWalletNotificationTypes.CancelOrphanedTriggers]: undefined,
  },
};

export const notificationsSlice = createSlice({
  name: 'Notifications',
  initialState,
  reducers: {
    addCustomNotification: (state, action: PayloadAction<CustomNotification>) => {
      const newNotification = action.payload;
      state.customNotifications = [...state.customNotifications, newNotification];
    },
    addCosmosWalletNotification: (state, action: PayloadAction<CosmosWalletNotificationTypes>) => {
      state.cosmosWalletNotifications[action.payload] = true;
    },
    removeCosmosWalletNotification: (
      state,
      action: PayloadAction<CosmosWalletNotificationTypes>
    ) => {
      const notifType = action.payload;
      if (state.cosmosWalletNotifications[notifType]) {
        state.cosmosWalletNotifications[notifType] = undefined;
      }
    },
  },
});

export const {
  addCustomNotification,
  addCosmosWalletNotification,
  removeCosmosWalletNotification,
} = notificationsSlice.actions;
