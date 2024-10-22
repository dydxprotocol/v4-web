import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { DEFAULT_VAULT_DEPOSIT_FOR_LAUNCH } from '@/constants/numbers';
import { AppRoute } from '@/constants/routes';

import { useMetadataServiceAssetFromId } from '@/hooks/useLaunchableMarkets';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { LinkOutIcon } from '@/icons';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Output, OutputType } from '@/components/Output';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';

import { MegaVaultYieldOutput } from './MegaVaultYieldOutput';

export const LaunchMarketSidePanel = ({
  className,
  launchableMarketId,
}: {
  className?: string;
  launchableMarketId?: string;
}) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const launchableAsset = useMetadataServiceAssetFromId(launchableMarketId);
  const baseAsset = launchableAsset && getDisplayableAssetFromBaseAsset(launchableAsset.id);
  const { usdcImage } = useTokenConfigs();

  const items = [
    {
      title: stringGetter({
        key: STRING_KEYS.DEPOSIT_TO_DESTINATION,
        params: { DESTINATION_CHAIN: 'MegaVault' },
      }),
      body: stringGetter({
        key: STRING_KEYS.MARKET_LAUNCH_DETAILS_2,
        params: {
          DEPOSIT_AMOUNT: (
            <Output
              tw="inline-block"
              type={OutputType.Asset}
              value={DEFAULT_VAULT_DEPOSIT_FOR_LAUNCH}
              slotRight={
                <AssetIcon
                  tw="mb-[-0.125rem] ml-0.25 inline-block"
                  logoUrl={usdcImage}
                  symbol="USDC"
                />
              }
              fractionDigits={0}
            />
          ),
          APR_PERCENTAGE: <MegaVaultYieldOutput tw="inline-block" />,
          PAST_DAYS: 30,
          MEGAVAULT_LINK: (
            <Link
              tw="inline-flex items-center gap-[0.25ch] text-[var(--link-color)] [--link-color:var(--color-text-1)] hover:underline"
              to={AppRoute.Vault}
            >
              {stringGetter({ key: STRING_KEYS.MEGAVAULT })}
              <LinkOutIcon />
            </Link>
          ),
        },
      }),
    },
    {
      title: stringGetter({ key: STRING_KEYS.TRADE }),
      body: stringGetter({
        key: STRING_KEYS.AVAILABLE_TO_TRADE_POST_LAUNCH,
        params: { MARKET: baseAsset },
      }),
    },
  ];

  const steps = items.map((item, idx) => (
    <div key={item.title} tw="flex flex-row gap-0.5">
      <div tw="flex h-3 w-3 min-w-3 items-center justify-center rounded-[50%] bg-color-layer-3 text-color-text-0">
        {idx + 1}
      </div>
      <div tw="flex flex-col">
        <span tw="text-color-text-1">{item.title}</span>
        <span tw="text-color-text-0">{item.body}</span>
      </div>
    </div>
  ));

  return (
    <$Container className={className}>
      <h2 tw="text-large text-color-text-2">
        {stringGetter({
          key: STRING_KEYS.INSTANTLY_LAUNCH,
          params: { MARKET: baseAsset },
        })}
      </h2>

      <div tw="flex flex-col gap-1">{steps}</div>

      <WithDetailsReceipt
        side="top"
        detailItems={[
          {
            key: 'deposit',
            label: stringGetter({ key: STRING_KEYS.DEPOSIT }),
            value: (
              <Output
                tw="inline text-color-text-1"
                type={OutputType.Asset}
                value={DEFAULT_VAULT_DEPOSIT_FOR_LAUNCH}
                slotRight={
                  <AssetIcon tw="mb-[-0.125rem] ml-0.25 inline" logoUrl={usdcImage} symbol="USDC" />
                }
                fractionDigits={0}
              />
            ),
          },
          {
            key: 'time-until-live',
            label: stringGetter({ key: STRING_KEYS.TIME_UNTIL_LIVE }),
            value: (
              <span tw="text-color-positive">{stringGetter({ key: STRING_KEYS.INSTANT })}</span>
            ),
          },
        ]}
      >
        <Button
          action={ButtonAction.Primary}
          disabled={!launchableAsset}
          onClick={() => {
            if (launchableMarketId) {
              dispatch(
                openDialog(
                  DialogTypes.LaunchMarket({ defaultLaunchableMarketId: launchableMarketId })
                )
              );
            }
          }}
        >
          {stringGetter({ key: STRING_KEYS.BEGIN_LAUNCH })} →
        </Button>
      </WithDetailsReceipt>
    </$Container>
  );
};

const $Container = styled.section`
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
  padding: 1rem;

  button {
    width: 100%;
  }
`;
