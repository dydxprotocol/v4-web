import { shallowEqual } from 'react-redux';
import styled from 'styled-components';
import { formatUnits } from 'viem';

import { STRING_KEYS } from '@/constants/localization';

import { useStakingValidator } from '@/hooks/useStakingValidator';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';
import { ValidatorFaviconIcon } from '@/components/ValidatorName';

import { getUnbondingDelegations } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

export const UnbondingPanels = () => {
  const stringGetter = useStringGetter();
  const unbondingDelegations = useAppSelector(getUnbondingDelegations, shallowEqual);
  const { unbondingValidators } = useStakingValidator() ?? {};
  const { chainTokenLabel, chainTokenDecimals } = useTokenConfigs();

  if (!unbondingDelegations?.length) {
    return null;
  }

  return (
    <$Container>
      {unbondingDelegations.map((delegation) => {
        const completionDate = new Date(delegation.completionTime).getTime();
        const currentDate = new Date().getTime();
        const timeDifference = completionDate - currentDate;

        const dayDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

        return (
          <Panel
            key={delegation.validator}
            slotHeaderContent={
              <>
                <$Title>
                  {stringGetter({
                    key: STRING_KEYS.UNSTAKING_FROM,
                    params: {
                      VALIDATOR:
                        unbondingValidators?.[delegation.validator]?.[0]?.description?.moniker,
                    },
                  })}
                </$Title>
                <$ValidatorFaviconIcon
                  url={unbondingValidators?.[delegation.validator]?.[0]?.description?.website}
                  fallbackText={
                    unbondingValidators?.[delegation.validator]?.[0]?.description?.moniker
                  }
                />
              </>
            }
          >
            <$Content>
              <$Balance
                type={OutputType.Asset}
                value={formatUnits(BigInt(delegation.balance), chainTokenDecimals)}
                slotRight={<$AssetIcon symbol={chainTokenLabel} />}
              />
              <$Footer>
                {stringGetter({
                  key: STRING_KEYS.AVAILABLE_IN_DAYS,
                  params: {
                    DAYS: dayDifference,
                  },
                })}
              </$Footer>
            </$Content>
          </Panel>
        );
      })}
    </$Container>
  );
};

const $Container = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1.5rem;
  flex: 1;
`;

const $Title = styled.h3`
  ${layoutMixins.inlineRow}
  margin-bottom: -1.5rem;

  font: var(--font-medium-book);
  color: var(--color-text-1);
`;

const $Content = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1rem;
`;

const $ValidatorFaviconIcon = styled(ValidatorFaviconIcon)`
  margin-bottom: -1.5rem;
`;

const $Balance = styled(Output)`
  font: var(--font-large-book);
  color: var(--color-text-3);
`;

const $AssetIcon = styled(AssetIcon)`
  margin-left: 0.5rem;
`;

const $Footer = styled.div`
  color: var(--color-text-0);
`;
