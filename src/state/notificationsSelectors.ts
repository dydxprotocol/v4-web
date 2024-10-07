import { type RootState } from './_store';

export const getAbacusNotifications = (state: RootState) => state.notifications.abacusNotifications;

export const getCustomNotifications = (state: RootState) => state.notifications.customNotifications;
