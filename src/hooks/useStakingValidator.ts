import { useState } from 'react';

import { BonsaiHooks } from '@/bonsai/ontology';
import {
  BondStatus,
  Validator,
} from '@dydxprotocol/v4-proto/src/codegen/cosmos/staking/v1beta1/staking';
import { useQuery } from '@tanstack/react-query';
import { groupBy } from 'lodash';

import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { EMPTY_ARR } from '@/constants/objects';

import { useDydxClient } from '@/hooks/useDydxClient';

import { appQueryClient } from '@/state/appQueryClient';
import { getSelectedNetwork } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { MustBigNumber } from '@/lib/numbers';

export const refreshStakingData = () => {
  appQueryClient.invalidateQueries({
    queryKey: ['validator', 'staking'],
  });
  appQueryClient.invalidateQueries({
    queryKey: ['validator', 'accountBalances'],
  });
};

export const useSortedUnbondingDelegations = () => {
  const unbondingDelegations = BonsaiHooks.useUnbondingDelegations().data;
  if (unbondingDelegations == null) {
    return unbondingDelegations;
  }
  return [...unbondingDelegations].sort(
    (a, b) => new Date(a.completionTime).getTime() - new Date(b.completionTime).getTime()
  );
};

export const getValidatorWithFewestTokens = (validators: Validator[]) =>
  validators.reduce<Validator | undefined>((selected, validator) => {
    return selected == null || BigInt(validator.tokens) < BigInt(selected.tokens)
      ? validator
      : selected;
  }, undefined);

export const compareValidators = (validatorA: Validator, validatorB: Validator) => {
  const commissionComparison = MustBigNumber(
    validatorA.commission?.commissionRates?.rate ?? 0
  ).comparedTo(validatorB.commission?.commissionRates?.rate ?? 0);

  if (commissionComparison != null && commissionComparison !== 0) {
    return commissionComparison;
  }

  return MustBigNumber(validatorB.delegatorShares).comparedTo(validatorA.delegatorShares) ?? 0;
};

export const useStakingValidator = () => {
  const { getValidators, isCompositeClientConnected } = useDydxClient();
  const selectedNetwork = useAppSelector(getSelectedNetwork);
  const unbondingDelegations = useSortedUnbondingDelegations();
  const currentDelegations = BonsaiHooks.useStakingDelegations().data?.delegations.map(
    (delegation) => {
      return {
        validator: delegation.validatorAddress.toLowerCase(),
        amount: delegation.amount,
      };
    }
  );

  const [selectedValidator, setSelectedValidator] = useState<Validator>();

  const validatorWhitelist = ENVIRONMENT_CONFIG_MAP[selectedNetwork].stakingValidators.map(
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
    availableValidators.sort(compareValidators);

    // Set the default validator to be the validator with the fewest tokens, selected from validators configured in the whitelist
    const whitelistedValidators = availableValidators.filter((validator) =>
      validatorOptions.includes(validator.operatorAddress.toLowerCase())
    );
    const validatorWithFewestTokens = getValidatorWithFewestTokens(
      whitelistedValidators.length > 0 ? whitelistedValidators : availableValidators
    );

    const stakingValidators =
      response?.validators.filter((validator) =>
        currentDelegations?.some((d) => d.validator === validator.operatorAddress.toLowerCase())
      ) ?? [];

    const unbondingValidators =
      response?.validators.filter((validator) =>
        unbondingDelegations?.some(
          (d) => d.validatorAddress.toLowerCase() === validator.operatorAddress.toLowerCase()
        )
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
    currentDelegations: currentDelegations ?? EMPTY_ARR,
  };
};
