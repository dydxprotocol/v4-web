import { useMemo } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { DoubleArrowUpIcon } from '@radix-ui/react-icons';
import styled from 'styled-components';

import { ButtonAction, ButtonShape } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useStakingTierLevel } from '@/hooks/useStakingTierLevel';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { formatNumberOutput, Output, OutputType } from '@/components/Output';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { MustBigNumber } from '@/lib/numbers';
import { truncateAddress } from '@/lib/wallet';

export const FeePageHeader = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const userStats = useAppSelector(BonsaiCore.account.stats.data);
  const feeTiers = useAppSelector(BonsaiCore.configs.feeTiers);
  const stakingTiers = useAppSelector(BonsaiCore.configs.stakingTiers);
  const hasStakingTiers = stakingTiers != null && stakingTiers.length > 0;
  const { referredBy } = useSubaccount();
  const { dydxAddress } = useAccounts();
  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();
  const selectedLocale = useAppSelector(getSelectedLocale);
  const currentStakingDiscountLevel: number | undefined = useStakingTierLevel();

  const feeTierOne = feeTiers?.[0];
  const accountStakingTier = useAppSelector(BonsaiCore.account.stakingTier.data);
  const stakedTokens = accountStakingTier?.stakedBaseTokens;
  const stakingTierDiscountPercent = accountStakingTier?.discountPercent;

  const volume = useMemo(() => {
    if (userStats.makerVolume30D !== undefined && userStats.takerVolume30D !== undefined) {
      return userStats.makerVolume30D + userStats.takerVolume30D;
    }
    return null;
  }, [userStats]);

  const userFeeTier = userStats.feeTierId;

  const hasReceivedFeeTierBonus =
    userFeeTier === '3' &&
    referredBy !== undefined &&
    MustBigNumber(volume).lt(feeTiers?.[2]?.volume ?? 0);

  const onStakeMore = () => {
    dispatch(openDialog(DialogTypes.Stake()));
  };

  const stakingTierDetails = hasStakingTiers ? (
    <div tw="flex flex-row">
      <$FeesDetails
        layout="rowColumns"
        withSeparators
        tw="rounded-r-0 pr-0"
        items={[
          {
            key: 'staking-tier',
            label: stringGetter({ key: STRING_KEYS.STAKING_TIER }),
            value: currentStakingDiscountLevel
              ? stringGetter({
                  key: STRING_KEYS.LEVEL_N,
                  params: { LEVEL: currentStakingDiscountLevel },
                })
              : stringGetter({ key: STRING_KEYS.NONE }),
          },
          {
            key: 'staking-discount',
            label: stringGetter({ key: STRING_KEYS.STAKING_FEE_DISCOUNT }),
            value: stringGetter({
              key: STRING_KEYS.PERCENT_OFF_FEES,
              params: {
                PERCENT: formatNumberOutput(stakingTierDiscountPercent, OutputType.Percent, {
                  decimalSeparator,
                  groupSeparator,
                  selectedLocale,
                }),
              },
            }),
          },
          {
            key: 'staked-dydx',
            label: stringGetter({ key: STRING_KEYS.STAKED_DYDX }),
            value: (
              <Output
                tw="row gap-0.25"
                type={OutputType.Asset}
                value={stakedTokens}
                fractionDigits={2}
                slotLeft={stakedTokens ? <AssetIcon symbol="DYDX" /> : undefined}
              />
            ),
          },
        ]}
      />
      <div tw="row rounded-[0.625rem] rounded-l-0 bg-color-layer-3 pr-1.5">
        <Button
          shape={ButtonShape.Pill}
          action={ButtonAction.Primary}
          css={{
            color: dydxAddress == null ? 'var(--color-text-0)' : 'var(--color-layer-0)',
          }}
          onClick={onStakeMore}
          state={{ isDisabled: dydxAddress == null }}
        >
          <Icon iconName={IconName.Deposit2} />
          {stringGetter({ key: STRING_KEYS.STAKE_MORE })}
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <div tw="flex flex-row gap-1">
      <$FeesDetails
        layout="rowColumns"
        withSeparators
        items={[
          {
            key: 'maker',
            label: stringGetter({ key: STRING_KEYS.YOUR_MAKER_FEE }),
            value: (
              <Output
                tw="text-color-accent"
                type={OutputType.SmallPercent}
                value={userStats.makerFeeRate ?? feeTierOne?.maker}
              />
            ),
          },
          {
            key: 'taker',
            label: stringGetter({ key: STRING_KEYS.YOUR_TAKER_FEE }),
            value: (
              <Output
                tw="text-color-accent"
                type={OutputType.SmallPercent}
                value={userStats.takerFeeRate ?? feeTierOne?.taker}
              />
            ),
          },
        ]}
      />

      <$FeesDetails
        layout="rowColumns"
        withSeparators
        items={[
          {
            key: 'fee-tier',
            label: (
              <$CardLabel>
                {stringGetter({ key: STRING_KEYS.FEE_TIER })}{' '}
                {hasReceivedFeeTierBonus && (
                  <WithTooltip
                    tooltipString={stringGetter({
                      key: STRING_KEYS.GIFTED_FEE_TIER_BONUS,
                      params: {
                        AFFILIATE: truncateAddress(referredBy),
                      },
                    })}
                  >
                    <DoubleArrowUpIcon tw="inline h-0.75 w-0.75 text-color-positive" />
                  </WithTooltip>
                )}
              </$CardLabel>
            ),
            value: (
              <span>
                {stringGetter({
                  key: STRING_KEYS.FEE_TIER_N,
                  params: { TIER: userFeeTier ?? feeTierOne?.tier },
                })}
              </span>
            ),
          },
          {
            key: 'volume',
            label: (
              <$CardLabel>
                <span>{stringGetter({ key: STRING_KEYS.TRAILING_VOLUME })}</span>
                <span>{stringGetter({ key: STRING_KEYS._30D })}</span>
              </$CardLabel>
            ),
            value: <Output type={OutputType.Fiat} value={volume} />,
          },
        ]}
      />

      {stakingTierDetails}
    </div>
  );
};

const $FeesDetails = styled(Details)`
  --separatorHeight-padding: 0rem;
  border-radius: 0.625rem;
  padding: 1rem 0.5rem;
  background-color: var(--color-layer-3);
  z-index: 0;

  > div {
    max-width: 16rem;
    align-content: normal;
  }

  dt {
    width: 100%;
    color: var(--color-text-0);
    font: var(--font-small-book);
  }

  dd {
    font: var(--font-base-bold);
  }
`;

const $TextRow = styled.div`
  ${layoutMixins.inlineRow}
  gap: 0.25rem;
`;

const $CardLabel = styled($TextRow)`
  height: 1.5rem;
`;
