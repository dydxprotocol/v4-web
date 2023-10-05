import styled, { AnyStyledComponent } from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';

import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { STRING_KEYS } from '@/constants/localization';
import { ButtonAction, ButtonSize, ButtonState, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';

import { useAccountBalance, useBreakpoints, useStringGetter } from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Details } from '@/components/Details';
import { Panel } from '@/components/Panel';
import { IconName } from '@/components/Icon';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { VerticalSeparator } from '@/components/Separator';
import { WithReceipt } from '@/components/WithReceipt';

import { openDialog } from '@/state/dialogs';
import { getSelectedNetwork } from '@/state/appSelectors';

import { DYDXBalancePanel } from './DYDXBalancePanel';

// TODO: replace placeholder URL with real URLs when avaialble
const GOVERNANCE_HELP_URL = 'https://help.dydx.exchange/';
const STAKING_HELP_URL = 'https://help.dydx.exchange/';

export const RewardsPage = () => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();
  const { isTablet, isNotTablet } = useBreakpoints();

  const selectedNetwork = useSelector(getSelectedNetwork);

  // const chainId = Number(ENVIRONMENT_CONFIG_MAP[selectedNetwork].ethereumChainId);

  // const { balance } = useAccountBalance({
  //   addressOrDenom: import.meta.env.VITE_V3_TOKEN_ADDRESS,
  //   assetSymbol: 'DYDX',
  //   chainId,
  //   isCosmosChain: false,
  // });

  // const tokenBalance = import.meta.env.VITE_V3_TOKEN_ADDRESS ? balance : 0;

  return (
    <Styled.Page>
      {/* {isNotTablet ? (
        <Styled.Migrate>
          <Styled.TwoItemRow>
            <div>
              <Styled.MigrateTitle>
                {stringGetter({ key: STRING_KEYS.MIGRATE })}
              </Styled.MigrateTitle>
              <Styled.Description>
                {stringGetter({ key: STRING_KEYS.MIGRATE_DESCRIPTION })}
                <Link href={MIGRATE_HELP_URL}>
                  {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
                </Link>
              </Styled.Description>
            </div>
            <Styled.MigrateAction>
              <div>
                <div>{stringGetter({ key: STRING_KEYS.AVAILABLE_TO_MIGRATE })}</div>
                <div>
                  <Styled.Token type={OutputType.Asset} value={tokenBalance} />
                </div>
              </div>
              <Button
                action={tokenBalance ? ButtonAction.Primary : ButtonAction.Base}
                // type={ButtonType.Link}
                // href={BRIDGE_URL}
                disabled
              >
                {tokenBalance
                  ? `${stringGetter({ key: STRING_KEYS.MIGRATE_NOW })} →`
                  : stringGetter({ key: STRING_KEYS.NO_TOKENS_TO_MIGRATE })}
              </Button>
            </Styled.MigrateAction>
          </Styled.TwoItemRow>
        </Styled.Migrate>
      ) : (
        <Styled.MobileMigrateCard
          slotHeader={
            <Styled.MobileMigrateHeader>
              <h3>{stringGetter({ key: STRING_KEYS.MIGRATE })}</h3>
              <VerticalSeparator />
              <span>
                {stringGetter({
                  key: STRING_KEYS.FROM_TO,
                  params: { FROM: <strong>Ethereum</strong>, TO: <strong>dYdX Chain</strong> },
                })}
              </span>
            </Styled.MobileMigrateHeader>
          }
        >
          <Styled.WithReceipt
            slotReceipt={
              <Styled.Details
                items={[
                  {
                    key: 'available-to-migrate',
                    label: stringGetter({ key: STRING_KEYS.AVAILABLE_TO_MIGRATE }),
                    value: <Output type={OutputType.Asset} value={tokenBalance} />,
                  },
                ]}
              />
            }
          >
            <Button
              action={tokenBalance ? ButtonAction.Primary : ButtonAction.Base}
              size={ButtonSize.Medium}
              disabled
            >
              {tokenBalance
                ? `${stringGetter({ key: STRING_KEYS.MIGRATE_NOW })} →`
                : stringGetter({ key: STRING_KEYS.NO_TOKENS_TO_MIGRATE })}
            </Button>
          </Styled.WithReceipt>
          <Styled.LearnMore>
            {stringGetter({ key: STRING_KEYS.WANT_TO_LEARN })}
            <Link href={MIGRATE_HELP_URL}>{stringGetter({ key: STRING_KEYS.CLICK_HERE })}</Link>
          </Styled.LearnMore>
        </Styled.MobileMigrateCard>
      )} */}

      <Styled.PanelRow>
        {isTablet && (
          <Styled.BalancePanelContainer>
            <DYDXBalancePanel />
          </Styled.BalancePanelContainer>
        )}

        <Styled.Panel
          slotHeader={<Styled.Title>{stringGetter({ key: STRING_KEYS.GOVERNANCE })}</Styled.Title>}
          onClick={() => dispatch(openDialog({ type: DialogTypes.ExternalNavKeplr }))}
        >
          <Styled.Row>
            <Styled.Description>
              {stringGetter({ key: STRING_KEYS.GOVERNANCE_DESCRIPTION })}
              <Link href={GOVERNANCE_HELP_URL} onClick={(e) => e.stopPropagation()}>
                {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
              </Link>
            </Styled.Description>
            {/* TODO: vertically center based on Panel height */}
            <Styled.IconButton
              action={ButtonAction.Base}
              iconName={IconName.Arrow}
              size={ButtonSize.Small}
            />
          </Styled.Row>
        </Styled.Panel>

        <Styled.Panel
          slotHeader={<Styled.Title>{stringGetter({ key: STRING_KEYS.STAKING })}</Styled.Title>}
          onClick={() => dispatch(openDialog({ type: DialogTypes.ExternalNavKeplr }))}
        >
          <Styled.Row>
            <Styled.Description>
              {stringGetter({ key: STRING_KEYS.STAKING_DESCRIPTION })}
              <Link href={STAKING_HELP_URL} onClick={(e) => e.stopPropagation()}>
                {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
              </Link>
            </Styled.Description>
            {/* TODO: vertically center based on Panel height */}
            <Styled.IconButton
              action={ButtonAction.Base}
              iconName={IconName.Arrow}
              size={ButtonSize.Small}
            />
          </Styled.Row>
        </Styled.Panel>

        {isNotTablet && (
          <Styled.BalancePanelContainer>
            <DYDXBalancePanel />
          </Styled.BalancePanelContainer>
        )}
      </Styled.PanelRow>
    </Styled.Page>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Page = styled.div`
  ${layoutMixins.contentContainerPage}
  gap: 1.5rem;

  @media ${breakpoints.tablet} {
    padding: 1rem;
  }
`;

Styled.Panel = styled(Panel)`
  padding: 0 1.5rem 1rem;

  @media ${breakpoints.tablet} {
    max-width: calc(100vw - 2rem);
  }
`;

Styled.Row = styled.div`
  ${layoutMixins.spacedRow}
  gap: 1rem;

  align-items: center;
`;

Styled.Description = styled.div`
  color: var(--color-text-0);

  a {
    color: var(--color-text-1);
  }
`;

Styled.Migrate = styled.section`
  max-width: min(100vw, var(--content-max-width));

  padding: 1.5rem;

  background-color: var(--color-layer-3);
  border-radius: 0.875rem;
`;

Styled.TwoItemRow = styled(Styled.Row)`
  grid-template-columns: 1fr 1fr;
`;

Styled.MigrateAction = styled(Styled.TwoItemRow)`
  padding: 1rem;

  background-color: var(--color-layer-2);
  border: solid var(--border-width) var(--color-border);
  border-radius: 0.75rem;
`;

Styled.Token = styled(Output)`
  font: var(--font-large-book);
`;

Styled.PanelRow = styled(Styled.Row)`
  gap: 1.5rem;
  max-width: min(100vw, var(--content-max-width));
  align-items: flex-start;

  > section {
    cursor: pointer;
  }

  @media ${breakpoints.tablet} {
    grid-auto-flow: row;
    grid-template-columns: 1fr;
    max-width: auto;
  }
`;

Styled.BalancePanelContainer = styled.div`
  width: 21.25rem;

  @media ${breakpoints.tablet} {
    width: auto;
  }
`;

Styled.Title = styled.h3`
  ${layoutMixins.inlineRow}
  padding: 1.25rem 1.5rem 0.5rem;

  font: var(--font-medium-book);
  color: var(--color-text-2);
`;

Styled.MigrateTitle = styled(Styled.Title)`
  padding: 0 0 0.5rem;
`;

Styled.MobileMigrateCard = styled(Styled.Panel)`
  ${layoutMixins.flexColumn}
  gap: 1rem;

  align-items: center;
`;

Styled.MobileMigrateHeader = styled(Styled.Title)`
  ${layoutMixins.inlineRow}
  gap: 1ch;
  padding-bottom: 1rem;

  font: var(--font-small-book);
  color: var(--color-text-0);

  h3 {
    ${layoutMixins.inlineRow}
    font: var(--font-large-book);
    color: var(--color-text-2);

    svg {
      font-size: 1.75rem;
    }
  }

  span {
    margin-top: 0.2rem;
    b {
      font-weight: var(--fontWeight-book);
      color: var(--color-text-1);
    }
  }
`;

Styled.Details = styled(Details)`
  padding: 0.5rem 1rem;
`;

Styled.WithReceipt = styled(WithReceipt)`
  width: 100%;
`;

Styled.LearnMore = styled(Styled.Description)`
  ${layoutMixins.row}
  gap: 1ch;
`;

Styled.IconButton = styled(IconButton)`
  color: var(--color-text-0);
`;
