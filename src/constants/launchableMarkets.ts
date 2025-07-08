import { timeUnits } from './time';

export enum LaunchMarketStatus {
  PENDING,
  FAILURE,
  SUCCESS,
}

export const ESTIMATED_LAUNCH_TIMEOUT = timeUnits.minute;

export const MARKET_LAUNCH_TOKEN_LOCKUP_DURATION = 30; // 30 days
