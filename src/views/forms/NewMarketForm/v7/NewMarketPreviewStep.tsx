import { FormEvent, useMemo, useState } from 'react';

import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { ISOLATED_LIQUIDITY_TIER_INFO } from '@/constants/markets';
import { DEFAULT_VAULT_DEPOSIT_FOR_LAUNCH } from '@/constants/numbers';

import { useMetadataServiceAssetFromId } from '@/hooks/useLaunchableMarkets';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Details, type DetailsItem } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { MegaVaultYieldOutput } from '@/views/MegaVaultYieldOutput';

import { selectSubaccountStateForVaults } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';

import { getDisplayableAssetFromTicker } from '@/lib/assetUtils';
import { MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';

import { NewMarketAgreement } from '../NewMarketAgreement';

type NewMarketPreviewStepProps = {
  ticker: string;
  onBack: () => void;
  onSuccess: (ticker: string) => void;
  receiptItems: DetailsItem[];
  shouldHideTitleAndDescription?: boolean;
};

export const NewMarketPreviewStep = ({
  ticker,
  onBack,
  onSuccess,
  receiptItems,
  shouldHideTitleAndDescription,
}: NewMarketPreviewStepProps) => {
  const stringGetter = useStringGetter();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const baseAsset = getDisplayableAssetFromTicker(ticker);
  const launchableAsset = useMetadataServiceAssetFromId(ticker);
  const { createPermissionlessMarket } = useSubaccount();
  const { usdcImage } = useTokenConfigs();
  const { freeCollateral } = useAppSelector(selectSubaccountStateForVaults);

  const { alertInfo, shouldDisableForm } = useMemo(() => {
    if (errorMessage) {
      return {
        alertInfo: {
          type: AlertType.Error,
          message: errorMessage,
        },
        shouldDisableForm: false,
      };
    }

    if (MustBigNumber(freeCollateral).lt(DEFAULT_VAULT_DEPOSIT_FOR_LAUNCH)) {
      return {
        alertInfo: {
          type: AlertType.Error,
          message: stringGetter({
            key: STRING_KEYS.LAUNCHING_MARKET_REQUIRES_USDC,
            params: {
              USDC_AMOUNT: DEFAULT_VAULT_DEPOSIT_FOR_LAUNCH,
            },
          }),
        },
        shouldDisableForm: true,
      };
    }

    return {
      alertInfo: undefined,
      shouldDisableForm: false,
    };
  }, [errorMessage, freeCollateral, stringGetter]);

  const heading = shouldHideTitleAndDescription ? null : (
    <>
      <h2>{stringGetter({ key: STRING_KEYS.CONFIRM_LAUNCH_DETAILS })}</h2>
      <span tw="text-color-text-0">
        {stringGetter({
          key: STRING_KEYS.DEPOSIT_LOCKUP_DESCRIPTION,
          params: {
            NUM_DAYS: <span tw="text-color-text-1">30</span>,
            PAST_DAYS: 30,
            APR_PERCENTAGE: <MegaVaultYieldOutput tw="inline-block" />,
          },
        })}
      </span>
    </>
  );

  const launchVisualization = (
    <div tw="mx-auto flex flex-row items-center gap-0.25">
      <div tw="flex flex-col items-center justify-center gap-0.5">
        <span tw="text-small text-color-text-0">
          {stringGetter({ key: STRING_KEYS.AMOUNT_TO_DEPOSIT })}
        </span>
        <div tw="flex w-[9.375rem] flex-col items-center justify-center gap-0.5 rounded-[0.625rem] bg-color-layer-4 py-1">
          <AssetIcon tw="h-2 w-2" logoUrl={usdcImage} symbol="USDC" />
          <Output useGrouping type={OutputType.Fiat} value={DEFAULT_VAULT_DEPOSIT_FOR_LAUNCH} />
        </div>
      </div>

      <Icon iconName={IconName.FastForward} size="1rem" tw="mt-[1.45rem] text-color-text-0" />

      <div tw="flex flex-col items-center justify-center gap-0.5">
        <span tw="text-small text-color-text-0">
          {stringGetter({ key: STRING_KEYS.MARKET_TO_LAUNCH })}
        </span>
        <div tw="flex w-[9.375rem] flex-col items-center justify-center gap-0.5 rounded-[0.625rem] bg-color-layer-4 py-1">
          <img src={launchableAsset?.logo} tw="h-2 w-2 rounded-[50%]" alt={baseAsset} />
          <Output useGrouping type={OutputType.Text} value={baseAsset} />
        </div>
      </div>
    </div>
  );

  const liquidityTier = (
    <div tw="relative flex flex-col gap-0.75 rounded-[0.625rem] bg-color-layer-2 p-1">
      <span tw="text-base text-color-text-0">
        {stringGetter({
          key: STRING_KEYS.LIQUIDITY_TIER_IS,
          params: {
            TIER: <span tw="text-color-text-1">{stringGetter({ key: STRING_KEYS.ISOLATED })}</span>,
          },
        })}
      </span>
      <$Details
        layout="rowColumns"
        tw="text-small"
        items={[
          {
            key: 'imf',
            label: stringGetter({ key: STRING_KEYS.INITIAL_MARGIN_FRACTION_SHORT }),
            value: (
              <Output
                type={OutputType.Number}
                value={ISOLATED_LIQUIDITY_TIER_INFO.initialMarginFraction}
                fractionDigits={2}
              />
            ),
          },
          {
            key: 'mainetnanace-margin',
            label: stringGetter({ key: STRING_KEYS.MAINTENANCE_MARGIN_FRACTION_SHORT }),
            value: (
              <Output
                type={OutputType.Number}
                value={ISOLATED_LIQUIDITY_TIER_INFO.maintenanceMarginFraction}
                fractionDigits={2}
              />
            ),
          },
          {
            key: 'impact-notional',
            label: stringGetter({ key: STRING_KEYS.IMPACT_NOTIONAL }),
            value: (
              <Output type={OutputType.Fiat} value={ISOLATED_LIQUIDITY_TIER_INFO.impactNotional} />
            ),
          },
        ]}
      />
    </div>
  );

  const alertMessage = alertInfo && (
    <AlertMessage type={alertInfo.type}>{alertInfo.message}</AlertMessage>
  );

  return (
    <$Form
      onSubmit={async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!hasAcceptedTerms) {
          setShowAgreement(true);
        } else {
          setIsLoading(true);
          setErrorMessage(undefined);

          try {
            const response = await createPermissionlessMarket(ticker);
            // eslint-disable-next-line no-console
            console.log('debug:createPermissionlessMarket', response);
            onSuccess(ticker);
          } catch (error) {
            log('NewMarketPreviewForm/createPermissionlessMarket', error);
            setErrorMessage(error.message);
          } finally {
            setIsLoading(false);
          }
        }
      }}
    >
      {showAgreement ? (
        <NewMarketAgreement
          onAccept={() => {
            setHasAcceptedTerms(true);
            setShowAgreement(false);
          }}
          onCancel={() => setShowAgreement(false)}
        />
      ) : (
        <>
          {heading}

          {launchVisualization}

          {liquidityTier}

          {alertMessage}

          <Details
            items={receiptItems}
            tw="rounded-[0.625rem] bg-color-layer-2 px-1 py-0.5 text-small"
          />

          <div tw="grid w-full grid-cols-[1fr_2fr] gap-1">
            <Button onClick={onBack}>{stringGetter({ key: STRING_KEYS.BACK })}</Button>
            <Button
              type={ButtonType.Submit}
              action={ButtonAction.Primary}
              state={{ isDisabled: shouldDisableForm, isLoading }}
            >
              {hasAcceptedTerms
                ? stringGetter({ key: STRING_KEYS.DEPOSIT_AND_LAUNCH })
                : stringGetter({ key: STRING_KEYS.ACKNOWLEDGE_TERMS })}
            </Button>
          </div>
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

const $Details = styled(Details)`
  & > div {
    position: relative;

    &:first-of-type {
      padding-left: 0;
    }

    &:not(:last-of-type):after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      right: 0;
      width: var(--border-width);
      height: 1.75rem;
      background-color: var(--color-border);
      margin: auto 0;
    }
  }
`;
