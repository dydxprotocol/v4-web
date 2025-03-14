import { useState } from 'react';

import { BonsaiCore, BonsaiHooks } from '@/bonsai/ontology';
import { shallowEqual } from 'react-redux';

import { OnboardingState } from '@/constants/account';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { usePortfolioValues } from '@/hooks/PortfolioValues/usePortfolioValues';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { SimpleUiDropdownMenu } from '@/components/SimpleUiDropdownMenu';
import { PnlChart, PnlDatum } from '@/views/charts/PnlChart';

import { getOnboardingState, getSubaccount } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { orEmptyObj } from '@/lib/typeUtils';

const UnconnectedPortfolioOverview = () => {
  const stringGetter = useStringGetter();
  return (
    <div tw="flexColumn relative h-20 justify-end">
      <div tw="flexColumn absolute left-1.25 top-1.25 gap-0.125">
        <Output tw="text-color-text-2 font-extra-bold" value={0} type={OutputType.Fiat} />
        <Output tw="text-color-text-0" value={0} type={OutputType.Fiat} />
      </div>
      <div tw="flexColumn">
        {stringGetter({ key: STRING_KEYS.NO_FUNDS })}
        <Button shape={ButtonShape.Pill} size={ButtonSize.Large}>
          {stringGetter({ key: STRING_KEYS.GET_STARTED })}
          <Icon iconName={IconName.Apple} />
        </Button>
      </div>
    </div>
  );
};

const ConnectedPortfolioOverview = () => {
  const selectedLocale = useAppSelector(getSelectedLocale);
  const { equity, leverage, marginUsage } = orEmptyObj(useAppSelector(getSubaccount, shallowEqual));
  const isLoadingSubaccount =
    useAppSelector(BonsaiCore.account.parentSubaccountSummary.loading) === 'pending';
  const { isLoading: isLoadingPnl } = BonsaiHooks.useParentSubaccountHistoricalPnls();
  const [visibleData, setVisibleData] = useState<PnlDatum[]>();

  const { accountEquity, pnlDiff, pnlDiffPercent, pnlDiffSign } = usePortfolioValues({
    equity: equity?.toNumber(),
    visibleData,
  });

  return (
    <div tw="flexColumn relative h-20">
      <div tw="flexColumn absolute left-1.25 top-1.25 gap-0.125">
        <Output
          tw="text-color-text-2 font-extra-bold"
          value={accountEquity}
          type={OutputType.Fiat}
          isLoading={isLoadingSubaccount}
        />
        <Output
          tw="text-color-text-0"
          value={pnlDiff}
          type={OutputType.Fiat}
          isLoading={isLoadingSubaccount || isLoadingPnl}
          slotRight={
            <Output
              tw="ml-0.25"
              value={pnlDiffPercent}
              type={OutputType.Percent}
              slotLeft="("
              slotRight=")"
            />
          }
        />
      </div>

      <PnlChart
        onVisibleDataChange={setVisibleData}
        selectedLocale={selectedLocale}
        tw="flex flex-1"
        css={{
          '--pnl-line-color': {
            [NumberSign.Positive]: 'var(--color-positive)',
            [NumberSign.Negative]: 'var(--color-negative)',
            [NumberSign.Neutral]: 'var(--color-text-1)',
          }[pnlDiffSign],
        }}
      />
    </div>
  );
};

const PortfolioOverview = () => {
  const onboardingState = useAppSelector(getOnboardingState);
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const appMenu = (
    <SimpleUiDropdownMenu
      tw="absolute right-1.25 top-1.25"
      items={[
        {
          value: 'connect-wallet',
          label: stringGetter({ key: STRING_KEYS.CONNECT_WALLET }),
          icon: <Icon iconName={IconName.Positions} />,
        },
        {
          value: 'settings',
          label: stringGetter({ key: STRING_KEYS.SETTINGS }),
          icon: <Icon iconName={IconName.Settings} />,
        },
        {
          value: 'help',
          label: stringGetter({ key: STRING_KEYS.HELP }),
          icon: <Icon iconName={IconName.HelpCircle} />,
          onSelect: () => {
            dispatch(openDialog(DialogTypes.Help()));
          },
        },
      ]}
    >
      <Icon iconName={IconName.Menu} />
    </SimpleUiDropdownMenu>
  );

  return (
    <div tw="flexColumn relative h-20">
      {onboardingState === OnboardingState.Disconnected ? (
        <UnconnectedPortfolioOverview />
      ) : (
        <ConnectedPortfolioOverview />
      )}

      {appMenu}
    </div>
  );
};

export default PortfolioOverview;
