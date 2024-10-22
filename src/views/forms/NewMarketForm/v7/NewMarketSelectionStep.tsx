import { FormEvent, useMemo } from 'react';

import { LightningBoltIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { DEFAULT_VAULT_DEPOSIT_FOR_LAUNCH } from '@/constants/numbers';
import { AppRoute } from '@/constants/routes';

import { useLaunchableMarkets } from '@/hooks/useLaunchableMarkets';
import { useStringGetter } from '@/hooks/useStringGetter';

import { LinkOutIcon } from '@/icons';
import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { Details, type DetailsItem } from '@/components/Details';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';
import { SearchSelectMenu } from '@/components/SearchSelectMenu';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { WithReceipt } from '@/components/WithReceipt';
import { MegaVaultYieldOutput } from '@/views/MegaVaultYieldOutput';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { getOnboardingState } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { getDisplayableAssetFromBaseAsset, getDisplayableTickerFromMarket } from '@/lib/assetUtils';

type NewMarketSelectionStepProps = {
  tickerToAdd?: string;
  setTickerToAdd: (ticker: string) => void;
  onConfirmMarket: () => void;
  freeCollateralDetailItem: DetailsItem;
  receiptItems: DetailsItem[];
  shouldHideTitleAndDescription?: boolean;
};

export const NewMarketSelectionStep = ({
  tickerToAdd,
  setTickerToAdd,
  onConfirmMarket,
  freeCollateralDetailItem,
  receiptItems,
  shouldHideTitleAndDescription,
}: NewMarketSelectionStepProps) => {
  const onboardingState = useAppSelector(getOnboardingState);
  const isDisconnected = onboardingState === OnboardingState.Disconnected;
  const launchableMarkets = useLaunchableMarkets();
  const stringGetter = useStringGetter();

  const alertMessage = useMemo(() => {
    let alert: { type: AlertType; message: string } | undefined;
    if (alert) return <AlertMessage type={alert.type}>{alert.message}</AlertMessage>;
    return null;
  }, []);

  const formHeader = useMemo(() => {
    if (shouldHideTitleAndDescription) return null;

    return (
      <>
        <h2>
          {stringGetter({ key: STRING_KEYS.LAUNCH_A_MARKET })}
          <span tw="flex flex-row items-center text-small text-color-text-1">
            <LightningBoltIcon tw="mr-0.25 text-color-warning" />{' '}
            {stringGetter({ key: STRING_KEYS.TRADE_INSTANTLY })}
          </span>
        </h2>
        <span tw="text-base text-color-text-0">
          {stringGetter({
            key: STRING_KEYS.MARKET_LAUNCH_DETAILS_3,
            params: {
              APR_PERCENTAGE: <MegaVaultYieldOutput tw="inline-block" />,
              DEPOSIT_AMOUNT: (
                <Output
                  useGrouping
                  type={OutputType.Fiat}
                  tw="inline-block"
                  value={DEFAULT_VAULT_DEPOSIT_FOR_LAUNCH}
                />
              ),
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
          })}
        </span>
      </>
    );
  }, [shouldHideTitleAndDescription, stringGetter]);

  const shortenedTicker = tickerToAdd ? getDisplayableTickerFromMarket(tickerToAdd) : tickerToAdd;

  return (
    <$Form
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onConfirmMarket();
      }}
    >
      {formHeader}

      {launchableMarkets.isLoading ? (
        <LoadingSpace id="launch-markets" />
      ) : (
        <>
          <SearchSelectMenu
            items={[
              {
                group: 'markets',
                groupLabel: stringGetter({ key: STRING_KEYS.MARKETS }),
                items:
                  launchableMarkets.data?.map((launchableMarket) => ({
                    value: launchableMarket.id,
                    label: getDisplayableTickerFromMarket(launchableMarket.id),
                    tag: getDisplayableAssetFromBaseAsset(launchableMarket.asset),
                    onSelect: () => {
                      setTickerToAdd(launchableMarket.id);
                    },
                  })) ?? [],
              },
            ]}
            label={stringGetter({ key: STRING_KEYS.MARKETS })}
          >
            {shortenedTicker ? (
              <span tw="text-color-text-2">
                {shortenedTicker} <Tag>{shortenedTicker}</Tag>
              </span>
            ) : (
              `${stringGetter({ key: STRING_KEYS.EG })} "BTC-USD"`
            )}
          </SearchSelectMenu>

          <WithDetailsReceipt
            side="bottom"
            detailItems={[freeCollateralDetailItem]}
            tw="[--withReceipt-backgroundColor:--color-layer-2]"
          >
            <FormInput
              disabled
              type={InputType.Currency}
              label={stringGetter({ key: STRING_KEYS.REQUIRED_AMOUNT_TO_DEPOSIT })}
              placeholder="$10,000"
              value={`$${DEFAULT_VAULT_DEPOSIT_FOR_LAUNCH}`}
            />
          </WithDetailsReceipt>

          {alertMessage}

          <WithReceipt
            tw="[--withReceipt-backgroundColor:--color-layer-2]"
            slotReceipt={<Details items={receiptItems} tw="px-0.75 pb-0.25 pt-0.375 text-small" />}
          >
            {isDisconnected ? (
              <OnboardingTriggerButton />
            ) : (
              <Button
                type={ButtonType.Submit}
                state={{ isDisabled: !tickerToAdd }}
                action={ButtonAction.Primary}
              >
                {stringGetter({ key: STRING_KEYS.PREVIEW_LAUNCH })}
              </Button>
            )}
          </WithReceipt>
        </>
      )}
    </$Form>
  );
};
const $Form = styled.form`
  ${formMixins.transfersForm}
  ${layoutMixins.stickyArea0}
  --stickyArea0-background: transparent;

  h2 {
    ${layoutMixins.row}
    justify-content: space-between;
    margin: 0;
    font: var(--font-large-medium);
    color: var(--color-text-2);
  }
`;
