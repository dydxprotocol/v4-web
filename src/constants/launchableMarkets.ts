import { timeUnits } from './time';

export enum LaunchMarketStatus {
  PENDING,
  FAILURE,
  SUCCESS,
}

export const ESTIMATED_LAUNCH_TIMEOUT = timeUnits.minute;
