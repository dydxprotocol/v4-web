import { useMemo } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { formatUnits } from 'viem';

import { useAppSelector } from '@/state/appTypes';

import { MustBigNumber } from '@/lib/numbers';

import { useTokenConfigs } from './useTokenConfigs';

export const useStakingTierLevel = () => {
  const accountStakingTier = useAppSelector(BonsaiCore.account.stakingTier.data);
  const stakingTiers = useAppSelector(BonsaiCore.configs.stakingTiers);
  const stakedTokens = accountStakingTier?.stakedBaseTokens;
  const userStakingTier = accountStakingTier?.feeTierName;
  const { chainTokenDecimals } = useTokenConfigs();

  const currentStakingDiscountLevel: number | undefined = useMemo(() => {
    const maybeUserStakingTierData = stakingTiers?.find(
      (tier) => tier.feeTierName === userStakingTier
    );

    if (stakedTokens == null || maybeUserStakingTierData == null) return undefined;
    const levels = maybeUserStakingTierData.levels;

    // Check staked tokens against each level's minStakedBaseTokens and return the highest level that the staked tokens meet or exceed
    const currentLevel = levels.reduce((maxLevel, level, idx) => {
      const minStakedTokens = formatUnits(BigInt(level.minStakedBaseTokens), chainTokenDecimals);
      const minStakedTokensNum = MustBigNumber(minStakedTokens).toNumber();
      const stakedTokensNum = MustBigNumber(stakedTokens).toNumber();

      if (minStakedTokensNum <= stakedTokensNum) {
        return Math.max(maxLevel, idx + 1);
      }

      return maxLevel;
    }, 0);

    return currentLevel > 0 ? currentLevel : undefined;
  }, [stakedTokens, userStakingTier, stakingTiers, chainTokenDecimals]);

  return currentStakingDiscountLevel;
};
