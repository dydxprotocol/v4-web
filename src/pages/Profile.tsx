import styled, { AnyStyledComponent, css } from 'styled-components';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEnsName } from 'wagmi';

import { ButtonSize } from '@/constants/buttons';

import { Details } from '@/components/Details';
import { FillsTable, FillsTableColumnKey } from '@/views/tables/FillsTable';
import { IconName } from '@/components/Icon';
import { IconButton, type IconButtonProps } from '@/components/IconButton';
import { Panel } from '@/components/Panel';
import { Toolbar } from '@/components/Toolbar';

import { OnboardingState } from '@/constants/account';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, PortfolioRoute, HistoryRoute } from '@/constants/routes';
import { wallets, WalletType } from '@/constants/wallets';
import { useAccounts, useStringGetter, useTokenConfigs } from '@/hooks';

import { getOnboardingState } from '@/state/accountSelectors';
import { openDialog } from '@/state/dialogs';

import { isTruthy } from '@/lib/isTruthy';
import { truncateAddress } from '@/lib/wallet';

import { layoutMixins } from '@/styles/layoutMixins';

const ENS_CHAIN_ID = 1; // Ethereum

const Profile = () => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();

  const onboardingState = useSelector(getOnboardingState);
  const isConnected = onboardingState !== OnboardingState.Disconnected;

  const { evmAddress, dydxAddress, walletType } = useAccounts();
  const { chainTokenLabel } = useTokenConfigs();

  const { data: ensName } = useEnsName({
    address: evmAddress,
    chainId: ENS_CHAIN_ID,
  });

  const actions = [
    {
      key: 'settings',
      label: stringGetter({ key: STRING_KEYS.SETTINGS }),
      icon: { iconName: IconName.Gear },
      href: AppRoute.Settings,
    },
    // {
    //   key: 'tutorials',
    //   label: stringGetter({ key: STRING_KEYS.TUTORIALS }),
    //   icon: { iconName: IconName.Comment },
    // },
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
          key: 'wallet',
          label: stringGetter({ key: STRING_KEYS.WALLET }),
          icon: { iconComponent: wallets[walletType || WalletType.OtherWallet].icon },
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
              <Styled.ActionButton
                {...icon}
                size={ButtonSize.Large}
                onClick={onClick}
                isCloseIcon={icon.iconName === IconName.Close}
              />
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

      <Styled.EqualGrid>
        <Panel
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
        </Panel>
        <Styled.RewardsPanel
          slotHeaderContent={stringGetter({ key: STRING_KEYS.REWARDS })}
          href={`/${chainTokenLabel}`}
          hasSeparator
        >
          <Styled.Details
            items={[
              { key: 'maker', label: stringGetter({ key: STRING_KEYS.YOU_WILL_EARN }), value: '-' },
              { key: 'taker', label: stringGetter({ key: STRING_KEYS.EPOCH_ENDS_IN }), value: '-' },
            ]}
            layout="grid"
          />
        </Styled.RewardsPanel>
      </Styled.EqualGrid>

      <Styled.TablePanel
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
      </Styled.TablePanel>
    </Styled.MobileProfileLayout>
  );
};

export default Profile;

const Styled: Record<string, AnyStyledComponent> = {};

Styled.MobileProfileLayout = styled.div`
  ${layoutMixins.contentContainerPage}

  gap: 1rem;
  padding: 1.25rem;
`;

Styled.Header = styled.header`
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
    var(--theme-classic-color-yellow) 0%,
    var(--theme-classic-color-red) 100%
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
  background: var(--color-positive);

  border-radius: 50%;
  box-shadow: 0 0 0 0.2rem var(--color-gradient-positive);
`;

Styled.Address = styled.h1`
  font: var(--font-extra-medium);
`;

Styled.Actions = styled(Toolbar)`
  ${layoutMixins.spacedRow}
  --stickyArea-topHeight: 5rem;

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

Styled.ActionButton = styled(IconButton)<{ isCloseIcon?: boolean }>`
  margin-bottom: 0.5rem;

  ${({ isCloseIcon }) =>
    isCloseIcon &&
    css`
      --button-textColor: var(--color-negative);

      svg {
        width: 0.875em;
        height: 0.875em;
      }
    `}
`;

Styled.EqualGrid = styled.div`
  ${layoutMixins.gridEqualColumns}

  gap: 1rem;
`;

Styled.Details = styled(Details)`
  font: var(--font-small-book);
  --details-value-font: var(--font-medium-book);
`;

Styled.RewardsPanel = styled(Panel)`
  dl {
    --details-grid-numColumns: 1;
  }
`;

Styled.TablePanel = styled(Panel)`
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
