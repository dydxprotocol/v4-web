import { useCallback } from 'react';

import { useQuery } from '@tanstack/react-query';
import { groupBy } from 'lodash';
import { shallowEqual, useSelector } from 'react-redux';

import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { getStakingDelegations } from '@/state/accountSelectors';
import { getSelectedNetwork } from '@/state/appSelectors';

import { useDydxClient } from './useDydxClient';

export const useStakingValidator = () => {
  const { getValidators, isCompositeClientConnected } = useDydxClient();
  const selectedNetwork = useSelector(getSelectedNetwork);
  const currentDelegations = useSelector(getStakingDelegations, shallowEqual)?.map((delegation) => {
    return {
      validator: delegation.validator.toLowerCase(),
      amount: delegation.amount,
    };
  });
  const validatorWhitelist = ENVIRONMENT_CONFIG_MAP[selectedNetwork].stakingValidators?.map(
    (delegation) => {
      return delegation.toLowerCase();
    }
  );

  const queryFn = useCallback(async () => {
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

    const filteredValidators = response?.validators.filter((validator) =>
      validatorOptions.includes(validator.operatorAddress.toLowerCase())
    );

    const stakingValidators =
      response?.validators.filter((validator) =>
        currentDelegations
          ?.map((d) => d.validator)
          .includes(validator.operatorAddress.toLowerCase())
      ) ?? [];

    if (!filteredValidators || filteredValidators.length === 0) {
      return undefined;
    }

    // Find the validator with the fewest tokens
    const validatorWithFewestTokens = filteredValidators.reduce((prev, curr) => {
      return BigInt(curr.tokens) < BigInt(prev.tokens) ? curr : prev;
    });

    return {
      selectedValidator: validatorWithFewestTokens,
      stakingValidators: groupBy(stakingValidators, ({ operatorAddress }) => operatorAddress),
      currentDelegations,
    };
  }, [validatorWhitelist, getValidators, currentDelegations]);

  const { data } = useQuery({
    queryKey: ['stakingValidator', selectedNetwork],
    queryFn,
    enabled: Boolean(isCompositeClientConnected && validatorWhitelist?.length > 0),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return data;
};
