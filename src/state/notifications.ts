import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { AbacusNotification } from '@/constants/abacus';

export interface NotificationsState {
  abacusNotifications: AbacusNotification[];
}

const initialState: NotificationsState = {
  abacusNotifications: [],
};

export const notificationsSlice = createSlice({
  name: 'Notifications',
  initialState,
  reducers: {
    updateNotifications: (state, action: PayloadAction<AbacusNotification[]>) => {
      state.abacusNotifications = action.payload;
    },
  },
});

export const { updateNotifications } = notificationsSlice.actions;
