import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { AbacusNotification } from '@/constants/abacus';
import { CustomNotification } from '@/constants/notifications';

export interface NotificationsState {
  abacusNotifications: AbacusNotification[];
  customNotifications: CustomNotification[];
}

const initialState: NotificationsState = {
  abacusNotifications: [],
  customNotifications: [],
};

export const notificationsSlice = createSlice({
  name: 'Notifications',
  initialState,
  reducers: {
    updateNotifications: (state, action: PayloadAction<AbacusNotification[]>) => {
      state.abacusNotifications = action.payload;
    },
    addCustomNotification: (state, action: PayloadAction<CustomNotification>) => {
      const newNotification = action.payload;
      state.customNotifications = [...state.customNotifications, newNotification];
    },
  },
});

export const { updateNotifications, addCustomNotification } = notificationsSlice.actions;
