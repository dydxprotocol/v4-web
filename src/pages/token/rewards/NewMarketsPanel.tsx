import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { AppRoute, MarketsRoute } from '@/constants/routes';

import { useGovernanceVariables } from '@/hooks/useGovernanceVariables';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';
import { Tag } from '@/components/Tag';

import { MustBigNumber } from '@/lib/numbers';

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

  if (!hasPotentialMarketsData) return null;

  return (
    <Panel
      className={className}
      slotHeaderContent={
        <$Title>
          {stringGetter({ key: STRING_KEYS.ADD_A_MARKET })}
          <$NewTag>{stringGetter({ key: STRING_KEYS.NEW })}</$NewTag>
        </$Title>
      }
      slotRight={
        <$Arrow>
          <$IconButton
            action={ButtonAction.Base}
            iconName={IconName.Arrow}
            size={ButtonSize.Small}
          />
        </$Arrow>
      }
      onClick={() => navigate(`${AppRoute.Markets}/${MarketsRoute.New}`)}
    >
      <$Description>
        {stringGetter({
          key: STRING_KEYS.NEW_MARKET_REWARDS_ENTRY_DESCRIPTION,
          params: {
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
        })}
      </$Description>
    </Panel>
  );
};
const $Description = styled.div`
  color: var(--color-text-0);
`;

const $IconButton = styled(IconButton)`
  color: var(--color-text-0);
  --color-border: var(--color-layer-6);
`;

const $Arrow = styled.div`
  padding-right: 1.5rem;
`;

const $Title = styled.h3`
  font: var(--font-medium-book);
  color: var(--color-text-2);
  margin-bottom: -1rem;
  ${layoutMixins.inlineRow}
`;

const $Output = styled(Output)`
  display: inline-block;
`;

const $NewTag = styled(Tag)`
  color: var(--color-accent);
  background-color: var(--color-accent-faded);
`;
