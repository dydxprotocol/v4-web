import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { CustomNotification } from '@/constants/notifications';

export interface NotificationsState {
  customNotifications: CustomNotification[];
}

const initialState: NotificationsState = {
  customNotifications: [],
};

export const notificationsSlice = createSlice({
  name: 'Notifications',
  initialState,
  reducers: {
    addCustomNotification: (state, action: PayloadAction<CustomNotification>) => {
      const newNotification = action.payload;
      state.customNotifications = [...state.customNotifications, newNotification];
    },
  },
});

export const { addCustomNotification } = notificationsSlice.actions;
