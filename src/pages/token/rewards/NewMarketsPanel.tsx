import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { AppRoute, MarketsRoute } from '@/constants/routes';

import { useGovernanceVariables } from '@/hooks/useGovernanceVariables';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { Output, OutputType } from '@/components/Output';

import { MustBigNumber } from '@/lib/numbers';
import { testFlags } from '@/lib/testFlags';

import { RewardsNavPanel } from './RewardsNavPanel';

export const NewMarketsPanel = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();
  const { hasPotentialMarketsData } = usePotentialMarkets();
  const { chainTokenDecimals, chainTokenLabel } = useTokenConfigs();
  const { newMarketProposal } = useGovernanceVariables();
  const initialDepositAmountDecimals = isMainnet ? 0 : 11;
  const initialDepositAmountBN = MustBigNumber(newMarketProposal.initialDepositAmount).div(
    Number(`1e${chainTokenDecimals}`)
  );

  const tradingRewardsRehaulEnabled = testFlags.tradingRewardsRehaul;
  const navToMarket = useCallback(
    () => navigate(`${AppRoute.Markets}/${MarketsRoute.New}`),
    [navigate]
  );

  if (!hasPotentialMarketsData) return null;

  const description = stringGetter({
    key: tradingRewardsRehaulEnabled
      ? STRING_KEYS.ADD_NEW_MARKET_DETAILS
      : STRING_KEYS.NEW_MARKET_REWARDS_ENTRY_DESCRIPTION,
    params: tradingRewardsRehaulEnabled
      ? {
          AMOUNT: (
            <$Output
              useGrouping
              type={OutputType.Number}
              value={initialDepositAmountBN}
              fractionDigits={initialDepositAmountDecimals}
            />
          ),
          NATIVE_TOKEN_DENOM: chainTokenLabel,
        }
      : {
          REQUIRED_NUM_TOKENS: (
            <$Output
              useGrouping
              type={OutputType.Number}
              value={initialDepositAmountBN}
              fractionDigits={initialDepositAmountDecimals}
            />
          ),
          NATIVE_TOKEN_DENOM: chainTokenLabel,
        },
  });

  return (
    <RewardsNavPanel
      title={stringGetter({
        key: tradingRewardsRehaulEnabled
          ? STRING_KEYS.ADD_NEW_MARKET_CAPITALIZED
          : STRING_KEYS.ADD_A_MARKET,
      })}
      titleTag={tradingRewardsRehaulEnabled ? undefined : stringGetter({ key: STRING_KEYS.NEW })}
      description={description}
      onNav={navToMarket}
      className={className}
    />
  );
};

const $Output = styled(Output)`
  display: inline-block;
`;
