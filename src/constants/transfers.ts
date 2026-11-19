import { timeUnits } from './time';

export const TIME_UNTIL_IDLE_WITHDRAW_IS_CONSIDERED_EXPIRED = 10 * timeUnits.minute;

// TODO(inj-gas-sponsorship): enable once the endpoint is deployed.
export const IS_GAS_SPONSORSHIP_ENABLED: boolean = true;
