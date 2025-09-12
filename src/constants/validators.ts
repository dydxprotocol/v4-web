import BigNumber from 'bignumber.js';

export type ValidatorData = {
  name: string;
  operatorAddress: string;
  votingPower: BigNumber;
  commissionRate: BigNumber;
  website?: string;
};

export type AccountAuthenticator = {
  id: Long;

  type: string;

  config: Uint8Array;
};
