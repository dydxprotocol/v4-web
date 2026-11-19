import { timeUnits } from './time';

export const TIME_UNTIL_IDLE_WITHDRAW_IS_CONSIDERED_EXPIRED = 10 * timeUnits.minute;

// TEMP: Deposits are paused while multi-tx Injective routes are fixed. Flip to false to re-enable.
export const IS_DEPOSIT_UNDER_MAINTENANCE: boolean = true;
