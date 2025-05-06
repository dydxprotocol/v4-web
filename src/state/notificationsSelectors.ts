import { type RootState } from './_store';

export const getCustomNotifications = (state: RootState) => state.notifications.customNotifications;
