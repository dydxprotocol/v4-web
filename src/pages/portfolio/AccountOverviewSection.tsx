import { useCallback } from 'react';

import { shallowEqual } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';
import { ColorToken } from '@/constants/styles/base';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useLoadedVaultAccount, useLoadedVaultDetails } from '@/hooks/vaultsHooks';

import { Button } from '@/components/Button';
import { Output, OutputType } from '@/components/Output';
import { NewTag, Tag, TagSign, TagType } from '@/components/Tag';
import { WithLabel } from '@/components/WithLabel';

import { getSubaccount } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { track } from '@/lib/analytics/analytics';
import { mapIfPresent } from '@/lib/do';
import { isTruthy } from '@/lib/isTruthy';
import { testFlags } from '@/lib/testFlags';
import { orEmptyObj } from '@/lib/typeUtils';

const EMBARRASSING_APR_THRESHOLD = 0.02;

export const MegavaultYieldTag = () => {
  const stringGetter = useStringGetter();
  const vault = useLoadedVaultDetails().data;
  if (
    vault?.thirtyDayReturnPercent == null ||
    vault.thirtyDayReturnPercent < EMBARRASSING_APR_THRESHOLD
  ) {
    return <NewTag>{stringGetter({ key: STRING_KEYS.NEW })}</NewTag>;
  }

  return (
    <Tag type={TagType.Number} sign={TagSign.Positive}>
      {stringGetter({
        key: STRING_KEYS.APR,
        params: {
          PERCENT: (
            <Output tw="mr-0.25" type={OutputType.Percent} value={vault?.thirtyDayReturnPercent} />
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
  const totalValue = mapIfPresent(equity?.current, (e) => e + (vaultBalance ?? 0));

  const handleViewVault = useCallback(() => {
    track(AnalyticsEvents.ClickViewVaultFromOverview());
    navigate(`${AppRoute.Vault}`, {
      state: { from: AppRoute.Portfolio },
    });
  }, [navigate]);

  const showVaults = testFlags.enableVaults;
  const { isTablet } = useBreakpoints();

  const pieSections = [
    {
      id: 'free-collateral',
      label: stringGetter({ key: STRING_KEYS.FREE_COLLATERAL }),
      amount: freeCollateral?.current,
      color: ColorToken.GrayPurple2,
    },
    {
      id: 'open-positions',
      label: stringGetter({ key: STRING_KEYS.POSITION_MARGIN }),
      amount: mapIfPresent(equity?.current, freeCollateral?.current, (e, f) => e - f),
      color: ColorToken.Green2,
    },
    (showVaults || (vaultBalance ?? 0) > 0.01) && {
      id: 'megavault',
      label: stringGetter({ key: STRING_KEYS.MEGAVAULT }),
      amount: vaultBalance,
      color: ColorToken.Purple1,
    },
  ].filter(isTruthy);

  return (
    <$AccountOverviewWrapper>
      <div tw="row w-full justify-between p-1">
        <$WithLabel label={stringGetter({ key: STRING_KEYS.PORTFOLIO_VALUE })}>
          <Output tw="font-extra-book" type={OutputType.Fiat} value={totalValue} />
        </$WithLabel>
        {showVaults && (
          <Button action={ButtonAction.Base} onClick={handleViewVault}>
            {stringGetter({ key: STRING_KEYS.VIEW_MEGAVAULT })}
            <MegavaultYieldTag />
          </Button>
        )}
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
              {pieSections.map(
                (section) =>
                  section.amount != null &&
                  totalValue != null &&
                  section.amount > 0 && (
                    <$LineSegment
                      key={section.id}
                      tw="h-full"
                      $color={section.color}
                      $widthPercent={section.amount / totalValue}
                    />
                  )
              )}
            </div>
            <div tw="row w-full flex-1 text-center">
              {pieSections.map(
                (section) =>
                  section.amount != null &&
                  totalValue != null &&
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
