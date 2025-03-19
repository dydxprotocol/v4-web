import { useCallback } from 'react';

import { shallowEqual } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { AnalyticsEvents } from '@/constants/analytics';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';
import { ColorToken } from '@/constants/styles/base';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useLoadedVaultAccount, useLoadedVaultDetails } from '@/hooks/vaultsHooks';

import { Link } from '@/components/Link';
import { Output, OutputType, formatNumberOutput } from '@/components/Output';
import { Tag, TagSign, TagType } from '@/components/Tag';
import { WithLabel } from '@/components/WithLabel';
import { WithTooltip } from '@/components/WithTooltip';

import { getSubaccount } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { track } from '@/lib/analytics/analytics';
import { mapIfPresent } from '@/lib/do';
import { orEmptyObj } from '@/lib/typeUtils';

const EMBARRASSING_APR_THRESHOLD = 0.02;

export const MegavaultYieldTag = () => {
  const stringGetter = useStringGetter();
  const vault = useLoadedVaultDetails().data;

  if (
    vault?.thirtyDayReturnPercent == null ||
    vault.thirtyDayReturnPercent < EMBARRASSING_APR_THRESHOLD
  ) {
    return null;
  }

  return (
    <Tag type={TagType.Number} sign={TagSign.Positive}>
      {stringGetter({
        key: STRING_KEYS.APR,
        params: {
          PERCENT: (
            <Output
              tw="mr-0.25"
              type={OutputType.Percent}
              value={vault.thirtyDayReturnPercent}
              fractionDigits={0}
            />
          ),
        },
      })}
    </Tag>
  );
};

export const AccountOverviewSection = () => {
  const navigate = useNavigate();
  const stringGetter = useStringGetter();

  const { equity, freeCollateral } = orEmptyObj(useAppSelector(getSubaccount, shallowEqual));
  const { balanceUsdc: vaultBalance } = orEmptyObj(useLoadedVaultAccount().data);
  const totalValue = mapIfPresent(equity?.toNumber(), (e) => e + (vaultBalance ?? 0));

  const handleViewVault = useCallback(() => {
    track(AnalyticsEvents.ClickViewVaultFromOverview());
    navigate(`${AppRoute.Vault}`, {
      state: { from: AppRoute.Portfolio },
    });
  }, [navigate]);

  const { isTablet } = useBreakpoints();

  const pieSections = [
    {
      id: 'free-collateral',
      label: stringGetter({ key: STRING_KEYS.FREE_COLLATERAL }),
      amount: mapIfPresent(freeCollateral?.toNumber(), (fc) => Math.max(fc, 0.0)),
      color: ColorToken.GrayPurple2,
    },
    {
      id: 'open-positions',
      label: stringGetter({ key: STRING_KEYS.POSITION_MARGIN }),
      amount: mapIfPresent(equity?.toNumber(), freeCollateral?.toNumber(), (e, f) =>
        Math.max(e - Math.max(f, 0), 0)
      ),
      color: ColorToken.Yellow1,
    },
    {
      id: 'megavault',
      label: (
        <Link onClick={() => handleViewVault()} tw="text-color-text-0 underline">
          {stringGetter({ key: STRING_KEYS.MEGAVAULT })}
        </Link>
      ),
      labelString: stringGetter({ key: STRING_KEYS.MEGAVAULT }),
      amount: vaultBalance,
      color: ColorToken.Purple1,
    },
  ];

  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();
  const selectedLocale = useAppSelector(getSelectedLocale);

  return (
    <$AccountOverviewWrapper>
      <div tw="row w-full justify-between p-1">
        <$WithLabel label={stringGetter({ key: STRING_KEYS.PORTFOLIO_VALUE })}>
          <Output tw="font-extra-book" type={OutputType.Fiat} value={totalValue} />
        </$WithLabel>
      </div>
      <div tw="row w-full gap-1 p-1">
        <div tw="row gap-2">
          {pieSections.map((section) => (
            <div tw="row items-start gap-0.5" key={section.id}>
              <$ColorSwatch $color={section.color} />
              <div tw="column gap-0.25">
                <div>
                  <Output type={OutputType.Fiat} value={section.amount} />
                </div>
                <div tw="text-color-text-0 font-small-book">{section.label}</div>
              </div>
            </div>
          ))}
        </div>
        {!isTablet && (
          <div tw="flexColumn flex-1 pt-0.5">
            <div tw="row h-1 w-full overflow-hidden rounded-1">
              {pieSections.map((section) => {
                if (
                  section.amount == null ||
                  totalValue == null ||
                  totalValue <= 0 ||
                  section.amount <= 0
                ) {
                  return undefined;
                }
                const formattedDollars = formatNumberOutput(section.amount, OutputType.Fiat, {
                  decimalSeparator,
                  groupSeparator,
                  selectedLocale,
                });
                const formattedPercent = formatNumberOutput(
                  section.amount / totalValue,
                  OutputType.Percent,
                  { fractionDigits: 0, decimalSeparator, groupSeparator, selectedLocale }
                );
                return (
                  <WithTooltip
                    key={section.id}
                    tooltipStringTitle={`${section.labelString ?? section.label}: ${formattedDollars} (${formattedPercent})`}
                    slotTrigger={
                      <$LineSegment
                        tw="h-full"
                        $color={section.color}
                        $widthPercent={section.amount / totalValue}
                      />
                    }
                  />
                );
              })}
            </div>
            <div tw="row w-full flex-1 text-center">
              {pieSections.map(
                (section) =>
                  section.amount != null &&
                  totalValue != null &&
                  totalValue > 0 &&
                  section.amount > 0 && (
                    <$LineSegment key={section.id} $widthPercent={section.amount / totalValue}>
                      {section.amount / totalValue > 0.09 && (
                        <Output
                          tw="text-color-text-0 font-small-book"
                          type={OutputType.Percent}
                          fractionDigits={0}
                          value={section.amount / totalValue}
                        />
                      )}
                    </$LineSegment>
                  )
              )}
            </div>
          </div>
        )}
      </div>
    </$AccountOverviewWrapper>
  );
};

const $LineSegment = styled.div<{ $color?: string; $widthPercent: number }>`
  width: ${({ $widthPercent }) => $widthPercent * 100}%;
  background-color: ${({ $color }) => $color};
`;

const $ColorSwatch = styled.div<{ $color: string }>`
  position: relative;
  top: 0.6rem;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 0.5rem;
  background-color: ${({ $color }) => $color};
`;

const $AccountOverviewWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
`;

const $WithLabel = styled(WithLabel)`
  --label-textColor: var(--color-text-0);

  label {
    font: var(--font-base-book);
  }
`;
