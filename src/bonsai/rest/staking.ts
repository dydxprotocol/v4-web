import { useQuery } from '@tanstack/react-query';
import { groupBy, mapValues, sumBy } from 'lodash';

import { timeUnits } from '@/constants/time';

import { selectTokenConfigs } from '@/hooks/useTokenConfigs';

import { getUserWalletAddress } from '@/state/accountInfoSelectors';
import { useAppSelector } from '@/state/appTypes';

import { parseToPrimitives } from '@/lib/abacus/parseToPrimitives';
import { calc } from '@/lib/do';
import { isTruthy } from '@/lib/isTruthy';
import { MustNumber } from '@/lib/numbers';
import { isPresent } from '@/lib/typeUtils';

import { convertAmount, processCoinAmount } from '../calculators/balances';
import { queryResultToLoadable } from './lib/queryResultToLoadable';
import { useCompositeClient } from './lib/useIndexer';

export type Balance = {
  denom: string;
  amount: number;
};

export type Delegation = {
  validatorAddress: string;
  amount: number;
};

export type Balances = Record<string, Balance>;

export type StakingDelegationsResult = {
  balances: Balances;
  delegations: Delegation[];
};

export const useStakingDelegations = () => {
  const address = useAppSelector(getUserWalletAddress);
  const tokenConfigs = useAppSelector(selectTokenConfigs);
  const client = useCompositeClient();

  return queryResultToLoadable(
    useQuery({
      queryKey: ['validator', 'staking', 'delegations', address, client.key],
      enabled: isPresent(address) && isPresent(client),
      queryFn: async (): Promise<StakingDelegationsResult> => {
        if (!address || !client.compositeClient) {
          throw new Error('Invalid staking delegations query state');
        }

        const response =
          await client.compositeClient.validatorClient.get.getDelegatorDelegations(address);
        const parsedResponse = parseToPrimitives(response);

        const delegationsByDenom = groupBy(
          parsedResponse.delegationResponses.filter((d) => d.balance != null),
          (delegationResponse) => delegationResponse.balance!.denom
        );

        // Create aggregated balances object
        const balances = mapValues(delegationsByDenom, (denomResponses) => ({
          denom: denomResponses[0]!.balance!.denom,
          amount: sumBy(denomResponses, (denomBalance) =>
            MustNumber(
              processCoinAmount(
                tokenConfigs,
                denomBalance.balance!.denom,
                denomBalance.balance!.amount
              )
            )
          ),
        }));

        // Create delegations list
        const delegations = parsedResponse.delegationResponses
          .filter((item) => item.balance != null && item.delegation != null)
          .map((item) => ({
            validatorAddress: item.delegation!.validatorAddress,
            amount: MustNumber(
              processCoinAmount(tokenConfigs, item.balance!.denom, item.balance!.amount)
            ),
          }));

        return {
          balances,
          delegations,
        };
      },
      refetchInterval: timeUnits.hour,
      staleTime: timeUnits.hour,
    })
  );
};

export type UnbondingEntry = {
  completionTime: string;
  balance: string;
};

export type UnbondingResponse = {
  validatorAddress: string;
  entries: UnbondingEntry[];
};

export type UnbondingDelegation = {
  validatorAddress: string;
  completionTime: string;
  balance: string;
};

export const useUnbondingDelegations = () => {
  const address = useAppSelector(getUserWalletAddress);
  const client = useCompositeClient();

  return queryResultToLoadable(
    useQuery({
      queryKey: ['validator', 'staking', 'unbonding-delegations', address, client.key],
      enabled: isPresent(address) && isPresent(client),
      queryFn: async (): Promise<UnbondingDelegation[]> => {
        if (!address || !client.compositeClient) {
          throw new Error('Invalid unbonding delegations query state');
        }

        const response =
          await client.compositeClient.validatorClient.get.getDelegatorUnbondingDelegations(
            address
          );
        const parsedResponse = parseToPrimitives(response);

        const unbondingDelegations = parsedResponse.unbondingResponses.flatMap(
          (unbondingResponse) => {
            if (!unbondingResponse.validatorAddress) return [];

            return unbondingResponse.entries
              .filter((entry) => entry.completionTime && entry.balance)
              .map((entry) => ({
                validatorAddress: unbondingResponse.validatorAddress,
                completionTime: entry.completionTime!,
                balance: entry.balance!,
              }));
          }
        );

        return unbondingDelegations;
      },
      refetchInterval: timeUnits.hour,
      staleTime: timeUnits.hour,
    })
  );
};

export type AccountBalance = {
  denom: string;
  amount: number;
};

export type StakingRewards = {
  validators: string[];
  totalRewards: AccountBalance[];
};

export const useStakingRewards = () => {
  const address = useAppSelector(getUserWalletAddress);
  const tokenConfigs = useAppSelector(selectTokenConfigs);
  const client = useCompositeClient();

  return queryResultToLoadable(
    useQuery({
      queryKey: ['validator', 'staking', 'staking-rewards', address, client.key],
      enabled: isPresent(address) && isPresent(client),
      queryFn: async (): Promise<StakingRewards> => {
        if (!address || !client.compositeClient) {
          throw new Error('Invalid staking rewards query state');
        }

        const response =
          await client.compositeClient.validatorClient.get.getDelegationTotalRewards(address);
        const parsedResponse = parseToPrimitives(response);

        const validators = parsedResponse.rewards
          .map((validator) => validator.validatorAddress)
          .filter(isTruthy);

        const totalRewards = parsedResponse.total
          .filter((reward) => reward.denom && reward.amount)
          .map((reward) => {
            const actualAmount = calc(() => {
              const decimals = Object.values(tokenConfigs.tokensConfigs).find(
                (t) => t.denom === reward.denom
              )?.decimals;
              if (decimals == null) {
                return undefined;
              }

              // for some reason this endpoint adds 18 decimals
              return convertAmount(reward.amount, decimals + 18);
            });
            return {
              denom: reward.denom!,
              amount: MustNumber(actualAmount),
            };
          });

        return {
          validators,
          totalRewards,
        };
      },
      refetchInterval: timeUnits.hour,
      staleTime: timeUnits.hour,
    })
  );
};
