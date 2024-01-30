import styled, { AnyStyledComponent } from 'styled-components';
import { useNavigate } from 'react-router-dom';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { AppRoute, MarketsRoute } from '@/constants/routes';

import { useStringGetter, useTokenConfigs } from '@/hooks';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';
import { useGovernanceVariables } from '@/hooks/useGovernanceVariables';

import { Panel } from '@/components/Panel';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';

import { MustBigNumber } from '@/lib/numbers';

export const NewMarketsPanel = () => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();
  const { hasPotentialMarketsData } = usePotentialMarkets();
  const { chainTokenDecimals, chainTokenLabel } = useTokenConfigs();
  const { newMarketProposal } = useGovernanceVariables();
  const initialDepositAmountBN = MustBigNumber(newMarketProposal.initialDepositAmount).div(
    Number(`1e${chainTokenDecimals}`)
  );
  const initialDepositAmountDecimals = isMainnet ? 0 : chainTokenDecimals;

  if (!hasPotentialMarketsData) return null;

  return (
    <Panel
      slotHeaderContent={
        <Styled.Title>
          {stringGetter({ key: STRING_KEYS.ADD_A_MARKET })}
          <Styled.NewTag>{stringGetter({ key: STRING_KEYS.NEW })}</Styled.NewTag>
        </Styled.Title>
      }
      slotRight={
        <Styled.Arrow>
          <Styled.IconButton
            action={ButtonAction.Base}
            iconName={IconName.Arrow}
            size={ButtonSize.Small}
          />
        </Styled.Arrow>
      }
      onClick={() => navigate(`${AppRoute.Markets}/${MarketsRoute.New}`)}
    >
      <Styled.Description>
        {stringGetter({
          key: STRING_KEYS.NEW_MARKET_REWARDS_ENTRY_DESCRIPTION,
          params: {
            REQUIRED_NUM_TOKENS: (
              <Styled.Output
                useGrouping
                type={OutputType.Number}
                value={initialDepositAmountBN}
                fractionDigits={initialDepositAmountDecimals}
              />
            ),
            NATIVE_TOKEN_DENOM: chainTokenLabel,
          },
        })}
      </Styled.Description>
    </Panel>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Description = styled.div`
  color: var(--color-text-0);
  --link-color: var(--color-text-1);

  a {
    display: inline;
    ::before {
      content: ' ';
    }
  }
`;

Styled.IconButton = styled(IconButton)`
  color: var(--color-text-0);
  --color-border: var(--color-layer-6);
`;

Styled.Arrow = styled.div`
  padding-right: 1.5rem;
`;

Styled.Title = styled.h3`
  font: var(--font-medium-book);
  color: var(--color-text-2);
  margin-bottom: -1rem;
  display: flex;
  align-items: center;
`;

Styled.Output = styled(Output)`
  display: inline-block;
`;

Styled.NewTag = styled(Tag)`
  color: var(--color-accent);
  background-color: var(--color-accent-faded);
  margin-left: 0.5ch;
`;
