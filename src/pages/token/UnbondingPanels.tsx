import styled from 'styled-components';
import { formatUnits } from 'viem';

import { STRING_KEYS } from '@/constants/localization';
import { timeUnits } from '@/constants/time';

import { useSortedUnbondingDelegations, useStakingValidator } from '@/hooks/useStakingValidator';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';
import { ValidatorFaviconIcon } from '@/components/ValidatorFaviconIcon';

export const UnbondingPanels = () => {
  const stringGetter = useStringGetter();
  const unbondingDelegations = useSortedUnbondingDelegations();
  const { unbondingValidators } = useStakingValidator();
  const { chainTokenDecimals, chainTokenImage, chainTokenLabel } = useTokenConfigs();

  if (!unbondingDelegations?.length) {
    return null;
  }

  return (
    <div tw="flexColumn gap-1.5">
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

        const unbondingValidator = unbondingValidators?.[delegation.validatorAddress]?.[0];

        return (
          <Panel
            key={`${delegation.validatorAddress}-${delegation.completionTime}`}
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
            <div tw="flexColumn gap-1">
              <Output
                type={OutputType.Asset}
                value={formatUnits(BigInt(delegation.balance), chainTokenDecimals)}
                slotRight={
                  <AssetIcon logoUrl={chainTokenImage} symbol={chainTokenLabel} tw="ml-0.5" />
                }
                tw="text-color-text-2 font-large-book"
              />
              <div tw="text-color-text-0">{availableInText}</div>
            </div>
          </Panel>
        );
      })}
    </div>
  );
};
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
