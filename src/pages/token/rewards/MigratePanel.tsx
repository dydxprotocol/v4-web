import { useSelector } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { useAccountBalance, useBreakpoints, useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';
import { VerticalSeparator } from '@/components/Separator';
import { Tag } from '@/components/Tag';
import { WithReceipt } from '@/components/WithReceipt';

import { getSelectedNetwork } from '@/state/appSelectors';

import { MustBigNumber } from '@/lib/numbers';

const TOKEN_MIGRATION_LEARN_MORE_LINK =
  'https://www.dydx.foundation/blog/update-on-exploring-the-future-of-dydx';

export const MigratePanel = ({ className }: { className?: string }) => {
  const { isNotTablet } = useBreakpoints();
  const stringGetter = useStringGetter();

  const selectedNetwork = useSelector(getSelectedNetwork);

  const chainId = Number(ENVIRONMENT_CONFIG_MAP[selectedNetwork].ethereumChainId);

  // v3 token is only on mainnet
  const { balance: tokenBalance } = useAccountBalance({
    addressOrDenom: chainId === 1 ? import.meta.env.VITE_V3_TOKEN_ADDRESS : undefined,
    chainId: 1,
    isCosmosChain: false,
  });

  return isNotTablet ? (
    <$MigratePanel
      className={className}
      slotHeader={<$Title>{stringGetter({ key: STRING_KEYS.MIGRATE })}</$Title>}
      slotRight={
        <$MigrateAction>
          <div>
            <div>{stringGetter({ key: STRING_KEYS.AVAILABLE_TO_MIGRATE })}</div>
            <$Token type={OutputType.Asset} value={tokenBalance} />
          </div>
          {import.meta.env.VITE_TOKEN_MIGRATION_URI && (
            <Button
              action={MustBigNumber(tokenBalance).gt(0) ? ButtonAction.Primary : ButtonAction.Base}
              type={ButtonType.Link}
              href={import.meta.env.VITE_TOKEN_MIGRATION_URI}
              slotRight={<Icon iconName={IconName.LinkOut} />}
            >
              {stringGetter({ key: STRING_KEYS.MIGRATE_NOW })}
            </Button>
          )}
        </$MigrateAction>
      }
    >
      <$Description>
        {stringGetter({ key: STRING_KEYS.MIGRATE_DESCRIPTION })}
        <Link href={TOKEN_MIGRATION_LEARN_MORE_LINK}>
          {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
        </Link>
      </$Description>
    </$MigratePanel>
  ) : (
    <$MigratePanel
      className={className}
      slotHeader={
        <$MobileMigrateHeader>
          <h3>
            <Icon iconName={IconName.Migrate} />
            {stringGetter({ key: STRING_KEYS.MIGRATE })}
          </h3>
          <$VerticalSeparator />
          <span>
            {stringGetter({
              key: STRING_KEYS.FROM_TO,
              params: { FROM: <b>Ethereum</b>, TO: <b>dYdX Chain</b> },
            })}
          </span>
        </$MobileMigrateHeader>
      }
    >
      <$Column>
        <$WithReceipt
          slotReceipt={
            <$Details
              items={[
                {
                  key: 'available-to-migrate',
                  label: (
                    <$InlineRow>
                      {stringGetter({ key: STRING_KEYS.AVAILABLE_TO_MIGRATE })}
                      <Tag>DYDX</Tag>
                    </$InlineRow>
                  ),
                  value: <Output type={OutputType.Asset} value={tokenBalance} />,
                },
              ]}
            />
          }
        >
          {import.meta.env.VITE_TOKEN_MIGRATION_URI && (
            <Button
              action={tokenBalance ? ButtonAction.Primary : ButtonAction.Base}
              size={ButtonSize.Medium}
              slotRight={<Icon iconName={IconName.LinkOut} />}
              href={import.meta.env.VITE_TOKEN_MIGRATION_URI}
            >
              {stringGetter({ key: STRING_KEYS.MIGRATE_NOW })}
            </Button>
          )}
        </$WithReceipt>
        <$InlineRow>
          {stringGetter({ key: STRING_KEYS.WANT_TO_LEARN })}
          <Link href={TOKEN_MIGRATION_LEARN_MORE_LINK} withIcon>
            {stringGetter({ key: STRING_KEYS.CLICK_HERE })}
          </Link>
        </$InlineRow>
      </$Column>
    </$MigratePanel>
  );
};
const $MigratePanel = styled(Panel)`
  width: 100%;

  background-image: url('/dots-background.svg');
  background-position: right;
  background-repeat: no-repeat;
`;

const $Title = styled.h3`
  font: var(--font-medium-book);
  color: var(--color-text-2);

  padding: var(--panel-paddingY) var(--panel-paddingX) 0;
  margin-bottom: -0.5rem;
`;

const $MigrateAction = styled.div`
  ${layoutMixins.flexEqualColumns}
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin: 1rem;
  width: 100%;

  background-color: var(--color-layer-2);
  border: solid var(--border-width) var(--color-border);
  border-radius: 0.75rem;
`;

const $Token = styled(Output)`
  font: var(--font-large-book);
  color: var(--color-text-2);
`;

const $Description = styled.div`
  color: var(--color-text-0);
  --link-color: var(--color-text-1);

  a {
    display: inline;
    ::before {
      content: ' ';
    }
  }
`;

const $Column = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1rem;
  align-items: center;
`;

const $MobileMigrateHeader = styled.div`
  ${layoutMixins.inlineRow}
  gap: 1ch;

  font: var(--font-small-book);
  color: var(--color-text-0);

  padding: 1rem 1rem 0;

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

const $VerticalSeparator = styled(VerticalSeparator)`
  z-index: 1;

  && {
    height: 1.5rem;
  }
`;

const $Details = styled(Details)`
  padding: 0.5rem 1rem;
`;

const $WithReceipt = styled(WithReceipt)`
  width: 100%;
`;

const $InlineRow = styled.div`
  ${layoutMixins.inlineRow}
  color: var(--color-text-0);
  --link-color: var(--color-text-1);
`;
