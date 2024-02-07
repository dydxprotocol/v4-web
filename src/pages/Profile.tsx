import styled, { AnyStyledComponent, css } from 'styled-components';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEnsName } from 'wagmi';
import { useNavigate } from 'react-router-dom';

import { ButtonSize } from '@/constants/buttons';
import { TransferType } from '@/constants/abacus';

import { layoutMixins } from '@/styles/layoutMixins';

import { Details } from '@/components/Details';
import { FillsTable, FillsTableColumnKey } from '@/views/tables/FillsTable';
import { Icon, IconName } from '@/components/Icon';
import { IconButton, type IconButtonProps } from '@/components/IconButton';
import { Panel } from '@/components/Panel';
import { Toolbar } from '@/components/Toolbar';

import { OnboardingState } from '@/constants/account';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, PortfolioRoute, HistoryRoute } from '@/constants/routes';
import { wallets } from '@/constants/wallets';
import { useAccounts, useStringGetter, useTokenConfigs } from '@/hooks';

import {
  getHistoricalTradingRewardsForCurrentWeek,
  getOnboardingState,
} from '@/state/accountSelectors';
import { openDialog } from '@/state/dialogs';

import { isTruthy } from '@/lib/isTruthy';
import { truncateAddress } from '@/lib/wallet';

import { DYDXBalancePanel } from './token/rewards/DYDXBalancePanel';
import { MigratePanel } from './token/rewards/MigratePanel';
import { GovernancePanel } from './token/rewards/GovernancePanel';
import { StakingPanel } from './token/staking/StakingPanel';
import { StrideStakingPanel } from './token/staking/StrideStakingPanel';
import { NewMarketsPanel } from './token/rewards/NewMarketsPanel';
import { breakpoints } from '@/styles';

const ENS_CHAIN_ID = 1; // Ethereum

const Profile = () => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onboardingState = useSelector(getOnboardingState);
  const isConnected = onboardingState !== OnboardingState.Disconnected;

  const { evmAddress, dydxAddress, walletType } = useAccounts();
  const { chainTokenLabel } = useTokenConfigs();

  const { data: ensName } = useEnsName({
    address: evmAddress,
    chainId: ENS_CHAIN_ID,
  });

  const currentWeekTradingReward = useSelector(getHistoricalTradingRewardsForCurrentWeek);

  const actions = [
    {
      key: 'deposit',
      label: stringGetter({ key: STRING_KEYS.DEPOSIT }),
      icon: { iconName: IconName.Deposit },
      onClick: () => {
        dispatch(
          openDialog({
            type: DialogTypes.ManageFunds,
            dialogProps: {
              selectedTransferType: TransferType.deposit.rawValue,
            },
          })
        );
      },
    },
    {
      key: 'withdraw',
      label: stringGetter({ key: STRING_KEYS.WITHDRAW }),
      icon: { iconName: IconName.Withdraw },
      onClick: () => {
        dispatch(
          openDialog({
            type: DialogTypes.ManageFunds,
            dialogProps: {
              selectedTransferType: TransferType.withdrawal.rawValue,
            },
          })
        );
      },
    },
    {
      key: 'transfer',
      label: stringGetter({ key: STRING_KEYS.TRANSFER }),
      icon: { iconName: IconName.Send },
      onClick: () => {
        dispatch(
          openDialog({
            type: DialogTypes.ManageFunds,
            dialogProps: {
              selectedTransferType: TransferType.transferOut.rawValue,
            },
          })
        );
      },
    },
    isConnected
      ? {
          key: 'sign-out',
          label: stringGetter({ key: STRING_KEYS.SIGN_OUT }),
          icon: { iconName: IconName.Close },
          onClick: () => {
            dispatch(openDialog({ type: DialogTypes.DisconnectWallet }));
          },
        }
      : {
          key: 'connect',
          label: stringGetter({ key: STRING_KEYS.CONNECT }),
          icon: { iconName: IconName.Transfer },
          onClick: () => {
            dispatch(openDialog({ type: DialogTypes.Onboarding }));
          },
        },
  ].filter(isTruthy) as {
    key: string;
    label: string;
    icon: IconButtonProps;
    href?: string;
    onClick?: () => void;
  }[];

  return (
    <Styled.MobileProfileLayout>
      <Styled.Header>
        <Styled.ProfileIcon />
        <div>
          <Styled.Address>
            {isConnected ? ensName || truncateAddress(dydxAddress) : '-'}
          </Styled.Address>
          {isConnected && walletType ? (
            <Styled.SubHeader>
              <Styled.ConnectedIcon />
              <span>{stringGetter({ key: STRING_KEYS.CONNECTED_TO })}</span>
              <span>{stringGetter({ key: wallets[walletType].stringKey })}</span>
            </Styled.SubHeader>
          ) : (
            <span>-</span>
          )}
        </div>
      </Styled.Header>
      <Styled.Actions withSeparators={false}>
        {actions.map(({ key, label, href, icon, onClick }) => {
          const action = (
            <>
              <Styled.ActionButton {...icon} size={ButtonSize.Large} onClick={onClick} />
              <span>{label}</span>
            </>
          );
          return href ? (
            <Link to={href} key={key}>
              {action}
            </Link>
          ) : (
            <label key={key}>{action}</label>
          );
        })}
      </Styled.Actions>

      <Styled.SettingsButton
        slotHeader={
          <Styled.InlineRow>
            <Icon iconName={IconName.Gear} />
            {stringGetter({ key: STRING_KEYS.SETTINGS })}
          </Styled.InlineRow>
        }
        onClick={() => navigate(AppRoute.Settings)}
      />
      <Styled.HelpButton
        slotHeader={
          <Styled.InlineRow>
            <Icon iconName={IconName.HelpCircle} />
            {stringGetter({ key: STRING_KEYS.HELP })}
          </Styled.InlineRow>
        }
        onClick={() => dispatch(openDialog({ type: DialogTypes.Help }))}
      />

      <Styled.MigratePanel />

      <Styled.DYDXBalancePanel />

      <Styled.RewardsPanel
        slotHeaderContent={stringGetter({ key: STRING_KEYS.TRADING_REWARDS })}
        href={`/${chainTokenLabel}`}
        hasSeparator
      >
        <Styled.Details
          items={[
            {
              key: 'week-rewards',
              label: stringGetter({ key: STRING_KEYS.THIS_WEEK }),
              value: currentWeekTradingReward?.amount ?? '-',
            },
          ]}
          layout="grid"
        />
      </Styled.RewardsPanel>
      <Styled.FeesPanel
        slotHeaderContent={stringGetter({ key: STRING_KEYS.FEES })}
        href={`${AppRoute.Portfolio}/${PortfolioRoute.Fees}`}
        hasSeparator
      >
        <Styled.Details
          items={[
            { key: 'maker', label: stringGetter({ key: STRING_KEYS.MAKER }), value: '-' },
            { key: 'taker', label: stringGetter({ key: STRING_KEYS.TAKER }), value: '-' },
            { key: 'volume', label: stringGetter({ key: STRING_KEYS.VOLUME_30D }), value: '-' },
          ]}
          layout="grid"
        />
      </Styled.FeesPanel>

      <Styled.HistoryPanel
        slotHeaderContent={stringGetter({ key: STRING_KEYS.HISTORY })}
        href={`${AppRoute.Portfolio}/${PortfolioRoute.History}/${HistoryRoute.Trades}`}
        hasSeparator
      >
        <FillsTable
          columnKeys={[
            FillsTableColumnKey.Action,
            FillsTableColumnKey.SideLongShort,
            FillsTableColumnKey.Type,
            FillsTableColumnKey.AmountTag,
          ]}
          withInnerBorders={false}
        />
      </Styled.HistoryPanel>

      <Styled.GovernancePanel />
      <Styled.NewMarketsPanel />
      <Styled.StakingPanel />
      <Styled.StrideStakingPanel />
    </Styled.MobileProfileLayout>
  );
};

export default Profile;

const Styled: Record<string, AnyStyledComponent> = {};

Styled.MobileProfileLayout = styled.div`
  ${layoutMixins.contentContainerPage}

  display: grid;
  gap: 1rem;
  padding: 1.25rem 0.9rem;
  max-width: 100vw;

  grid-template-columns: 1fr 1fr;

  grid-template-areas:
    'header header'
    'actions actions'
    'settings help'
    'migrate migrate'
    'balance balance'
    'rewards fees'
    'history history'
    'governance newMarkets'
    'keplr stride';

  @media ${breakpoints.mobile} {
    grid-template-areas:
      'header header'
      'actions actions'
      'settings help'
      'migrate migrate'
      'balance balance'
      'rewards fees'
      'history history'
      'governance governance'
      'newMarkets newMarkets'
      'keplr keplr'
      'stride stride';
  }
`;

Styled.Header = styled.header`
  grid-area: header;
  ${layoutMixins.row}
  padding: 0 1rem;
`;

Styled.ProfileIcon = styled.div`
  width: 4rem;
  height: 4rem;
  margin-right: 1rem;

  border-radius: 50%;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.profileYellow} 0%,
    ${({ theme }) => theme.profileRed} 100%
  );
`;

Styled.SubHeader = styled.div`
  ${layoutMixins.row}
  gap: 0.25rem;

  color: var(--color-text-0);

  font: var(--font-small-book);

  span:last-child {
    color: var(--color-text-1);
  }
`;

Styled.ConnectedIcon = styled.div`
  height: 0.5rem;
  width: 0.5rem;
  margin-right: 0.25rem;
  background: var(--color-success);

  border-radius: 50%;
  box-shadow: 0 0 0 0.2rem var(--color-gradient-success);
`;

Styled.Address = styled.h1`
  font: var(--font-extra-medium);
`;

Styled.Actions = styled(Toolbar)`
  ${layoutMixins.spacedRow}
  --stickyArea-topHeight: 5rem;
  grid-area: actions;

  > a,
  > label {
    ${layoutMixins.flexColumn}
    align-items: center;

    span {
      color: var(--color-text-0);
      font: var(--font-small-book);
    }
  }
`;

Styled.ActionButton = styled(IconButton)<{ iconName?: IconName }>`
  margin-bottom: 0.5rem;

  ${({ iconName }) =>
    iconName === IconName.Close
      ? css`
          --button-textColor: var(--color-red);
          --button-icon-size: 0.75em;
        `
      : iconName === IconName.Transfer &&
        css`
          --button-icon-size: 1.25em;
          --button-textColor: var(--color-text-2);
          --button-backgroundColor: var(--color-accent);
        `}
`;

Styled.Details = styled(Details)`
  font: var(--font-small-book);
  --details-value-font: var(--font-medium-book);
`;

Styled.RewardsPanel = styled(Panel)`
  grid-area: rewards;
  align-self: flex-start;
  height: 100%;
  > div {
    height: 100%;
  }

  dl {
    --details-grid-numColumns: 1;
  }
`;

Styled.FeesPanel = styled(Panel)`
  grid-area: fees;
`;

Styled.HistoryPanel = styled(Panel)`
  grid-area: history;
  --panel-content-paddingY: 0;
  --panel-content-paddingX: 0;

  > div > div {
    margin-top: 0.5rem;
    --scrollArea-height: 10rem;
    border-radius: 0.875rem;
  }

  table {
    max-height: 10rem;
    --tableCell-padding: 0.25rem 1rem;
    --tableRow-backgroundColor: var(--color-layer-3);
    background-color: var(--color-layer-3);
    thead {
      color: var(--color-text-0);
    }

    tbody {
      tr {
        td:nth-child(2),
        td:nth-child(3) {
          color: var(--color-text-0);
        }
      }
    }
  }
`;

Styled.InlineRow = styled.div`
  ${layoutMixins.inlineRow}
  padding: 1rem;
  gap: 0.5rem;
`;

Styled.PanelButton = styled(Panel)`
  --panel-paddingY: 0
  --panel-paddingX:0;
`;

Styled.SettingsButton = styled(Styled.PanelButton)`
  grid-area: settings;
`;

Styled.HelpButton = styled(Styled.PanelButton)`
  grid-area: help;
`;

Styled.MigratePanel = styled(MigratePanel)`
  grid-area: migrate;
`;

Styled.DYDXBalancePanel = styled(DYDXBalancePanel)`
  grid-area: balance;
`;

Styled.GovernancePanel = styled(GovernancePanel)`
  grid-area: governance;
`;

Styled.StakingPanel = styled(StakingPanel)`
  grid-area: keplr;
`;

Styled.NewMarketsPanel = styled(NewMarketsPanel)`
  grid-area: newMarkets;
`;

Styled.StrideStakingPanel = styled(StrideStakingPanel)`
  grid-area: stride;
`;
