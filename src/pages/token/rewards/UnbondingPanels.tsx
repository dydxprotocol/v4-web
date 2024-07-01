import { shallowEqual } from 'react-redux';
import styled from 'styled-components';
import { formatUnits } from 'viem';

import { STRING_KEYS } from '@/constants/localization';
import { timeUnits } from '@/constants/time';

import { useStakingValidator } from '@/hooks/useStakingValidator';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';
import { ValidatorFaviconIcon } from '@/components/ValidatorFaviconIcon';

import { calculateSortedUnbondingDelegations } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';

export const UnbondingPanels = () => {
  const stringGetter = useStringGetter();
  const unbondingDelegations = useAppSelector(calculateSortedUnbondingDelegations, shallowEqual);
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

        const dayDifference = Math.floor(timeDifference / timeUnits.day);
        const hourDifference = Math.floor(timeDifference / timeUnits.hour);
        const minuteDifference = Math.floor(timeDifference / timeUnits.minute);

        const availableInText =
          dayDifference > 1
            ? stringGetter({
                key: STRING_KEYS.AVAILABLE_IN_DAYS,
                params: {
                  DAYS: dayDifference,
                },
              })
            : hourDifference >= 1
              ? stringGetter({
                  key: STRING_KEYS.AVAILABLE_IN,
                  params: {
                    DURATION: stringGetter({
                      key: STRING_KEYS.X_HOURS_LOWERCASED,
                      params: {
                        X: hourDifference,
                      },
                    }),
                  },
                })
              : stringGetter({
                  key: STRING_KEYS.AVAILABLE_IN,
                  params: {
                    DURATION: stringGetter({
                      key: STRING_KEYS.X_MINUTES_LOWERCASED,
                      params: {
                        X: minuteDifference,
                      },
                    }),
                  },
                });

        const unbondingValidator = unbondingValidators?.[delegation.validator]?.[0];

        return (
          <Panel
            key={`${delegation.validator}-${delegation.completionTime}`}
            slotHeader={
              <$Header>
                <$Title>
                  {stringGetter({
                    key: STRING_KEYS.UNSTAKING_FROM,
                    params: {
                      VALIDATOR: unbondingValidator?.description?.moniker,
                    },
                  })}
                </$Title>
                <ValidatorFaviconIcon
                  url={unbondingValidator?.description?.website}
                  fallbackText={unbondingValidator?.description?.moniker}
                />
              </$Header>
            }
          >
            <$Content>
              <$Balance
                type={OutputType.Asset}
                value={formatUnits(BigInt(delegation.balance), chainTokenDecimals)}
                slotRight={<$AssetIcon symbol={chainTokenLabel} />}
              />
              <$Footer>{availableInText}</$Footer>
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
`;

const $Header = styled.div`
  ${layoutMixins.spacedRow}
  padding: var(--panel-paddingY) var(--panel-paddingX) 0;
`;

const $Title = styled.h3`
  ${layoutMixins.inlineRow}
  ${layoutMixins.textTruncate}

  font: var(--font-medium-book);
  color: var(--color-text-1);
`;

const $Content = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1rem;
`;

const $Balance = styled(Output)`
  font: var(--font-large-book);
  color: var(--color-text-2);
`;

const $AssetIcon = styled(AssetIcon)`
  margin-left: 0.5rem;
`;

const $Footer = styled.div`
  color: var(--color-text-0);
`;
