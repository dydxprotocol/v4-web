import { useState } from 'react';

import {
  BondStatus,
  Validator,
} from '@dydxprotocol/v4-proto/src/codegen/cosmos/staking/v1beta1/staking';
import { useQuery } from '@tanstack/react-query';
import { groupBy } from 'lodash';
import { shallowEqual } from 'react-redux';

import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { useDydxClient } from '@/hooks/useDydxClient';

import { calculateSortedUnbondingDelegations } from '@/state/accountCalculators';
import { getStakingDelegations } from '@/state/accountSelectors';
import { getSelectedNetwork } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { MustBigNumber } from '@/lib/numbers';

export const useStakingValidator = () => {
  const { getValidators, isCompositeClientConnected } = useDydxClient();
  const selectedNetwork = useAppSelector(getSelectedNetwork);
  const unbondingDelegations = useAppSelector(calculateSortedUnbondingDelegations, shallowEqual);
  const currentDelegations = useAppSelector(getStakingDelegations, shallowEqual)?.map(
    (delegation) => {
      return {
        validator: delegation.validator.toLowerCase(),
        amount: delegation.amount,
      };
    }
  );

  const [selectedValidator, setSelectedValidator] = useState<Validator>();

  const validatorWhitelist = ENVIRONMENT_CONFIG_MAP[selectedNetwork].stakingValidators?.map(
    (delegation) => {
      return delegation.toLowerCase();
    }
  );

  const queryFn = async () => {
    const validatorOptions: string[] = [];
    const intersection = validatorWhitelist.filter((delegation) =>
      currentDelegations?.map((d) => d.validator).includes(delegation)
    );

    if (intersection.length > 0) {
      validatorOptions.push(...intersection);
    } else {
      validatorOptions.push(...validatorWhitelist);
    }

    const response = await getValidators();

    // Filter out jailed and unbonded validators
    const availableValidators =
      response?.validators.filter(
        (validator: Validator) =>
          validator.status === BondStatus.BOND_STATUS_BONDED && validator.jailed === false
      ) ?? [];

    // Sort validators 1/ in ascending commission and 2/ by descending stake weight
    const sortByCommission = (validatorA: Validator, validatorB: Validator): number => {
      return MustBigNumber(validatorA.commission?.commissionRates?.rate ?? 0).gt(
        MustBigNumber(validatorB.commission?.commissionRates?.rate ?? 0)
      )
        ? 1
        : -1;
    };

    const sortByCommissionAndStakeWeight = (
      validatorA: Validator,
      validatorB: Validator
    ): number => {
      if (
        (validatorA.commission?.commissionRates?.rate ?? 0) ===
        (validatorB.commission?.commissionRates?.rate ?? 0)
      ) {
        return MustBigNumber(validatorA.delegatorShares).gt(
          MustBigNumber(validatorB.delegatorShares)
        )
          ? -1
          : 1;
      }
      return 0;
    };

    availableValidators.sort(sortByCommission);
    availableValidators.sort(sortByCommissionAndStakeWeight);

    // Set the default validator to be the validator with the fewest tokens, selected from validators configured in the whitelist
    const whitelistedValidators = response?.validators.filter((validator) =>
      validatorOptions.includes(validator.operatorAddress.toLowerCase())
    );

    const validatorWithFewestTokens = (whitelistedValidators ?? availableValidators ?? []).reduce(
      (prev, curr) => {
        return BigInt(curr.tokens) < BigInt(prev.tokens) ? curr : prev;
      }
    );

    const stakingValidators =
      response?.validators.filter((validator) =>
        currentDelegations?.some((d) => d.validator === validator.operatorAddress.toLowerCase())
      ) ?? [];

    const unbondingValidators =
      response?.validators.filter((validator) =>
        unbondingDelegations?.some((d) => d.validator === validator.operatorAddress.toLowerCase())
      ) ?? [];

    return {
      validatorWithFewestTokens,
      availableValidators,
      stakingValidators: groupBy(stakingValidators, ({ operatorAddress }) => operatorAddress),
      unbondingValidators: groupBy(unbondingValidators, ({ operatorAddress }) => operatorAddress),
    };
  };

  const { data } = useQuery({
    queryKey: ['stakingValidator', selectedNetwork, currentDelegations, unbondingDelegations],
    queryFn,
    enabled: Boolean(isCompositeClientConnected),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    selectedValidator,
    setSelectedValidator,
    defaultValidator: data?.validatorWithFewestTokens,
    availableValidators: data?.availableValidators,
    stakingValidators: data?.stakingValidators,
    unbondingValidators: data?.unbondingValidators,
    currentDelegations,
  };
};
