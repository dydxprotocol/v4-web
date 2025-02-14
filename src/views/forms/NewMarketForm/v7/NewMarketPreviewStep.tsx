import { FormEvent, useEffect, useMemo, useState } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import { IndexedTx } from '@cosmjs/stargate';
import { encodeJson } from '@dydxprotocol/v4-client-js';
import styled from 'styled-components';
import tw from 'twin.macro';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonType } from '@/constants/buttons';
import { ESTIMATED_LAUNCH_TIMEOUT, LaunchMarketStatus } from '@/constants/launchableMarkets';
import { STRING_KEYS } from '@/constants/localization';
import { ISOLATED_LIQUIDITY_TIER_INFO } from '@/constants/markets';
import { DEFAULT_VAULT_DEPOSIT_FOR_LAUNCH } from '@/constants/numbers';
import { timeUnits } from '@/constants/time';

import { useCustomNotification } from '@/hooks/useCustomNotification';
import { useMetadataServiceAssetFromId } from '@/hooks/useMetadataService';
import { useNow } from '@/hooks/useNow';
import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Details, type DetailsItem } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';
import { MegaVaultYieldOutput } from '@/views/MegaVaultYieldOutput';

import { selectSubaccountStateForVaults } from '@/state/accountCalculators';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setLaunchMarketIds } from '@/state/perpetuals';

import { getDisplayableAssetFromTicker, getDisplayableTickerFromMarket } from '@/lib/assetUtils';
import { MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';

type NewMarketPreviewStepProps = {
  ticker: string;
  onBack: () => void;
  onSuccess: (txHash: string) => void;
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
  const { launchMarketTos } = useURLConfigs();
  const [isLoading, setIsLoading] = useState(false);
  const baseAsset = getDisplayableAssetFromTicker(ticker);
  const launchableAsset = useMetadataServiceAssetFromId(ticker);
  const { createPermissionlessMarket } = useSubaccount();
  const { usdcImage } = useTokenConfigs();
  const { freeCollateral } = useAppSelector(selectSubaccountStateForVaults);
  const marketOraclePrice = useParameterizedSelector(
    BonsaiHelpers.markets.createSelectMarketSummaryById,
    ticker
  )?.oraclePrice;
  const [txHash, setTxHash] = useState<string>();
  const [eta, setEta] = useState<number>(0);
  const now = useNow();
  const dispatch = useAppDispatch();
  const notify = useCustomNotification();

  // Countdown timer used to wait for OraclePrice as well as a hard block before allowing user to navigate/re-subscribe
  const secondsLeft = isLoading ? Math.max(0, (eta - now) / timeUnits.second) : 0;
  const fullTimeElapsed = isLoading && secondsLeft === 0;

  /**
   * @description Side effect to set loading to false after ticker is returned from v4_markets channel and added to marketIds
   */
  useEffect(() => {
    if (marketOraclePrice && txHash && fullTimeElapsed) {
      setIsLoading(false);
      setEta(0);
      onSuccess(txHash);
    }
  }, [marketOraclePrice, fullTimeElapsed, ticker, txHash, onSuccess]);

  /**
   * @description Side effect to clear error message when ticker changes
   */
  useEffect(() => {
    setErrorMessage(undefined);
  }, [ticker]);

  const { alertInfo, shouldDisableForm } = useMemo(() => {
    if (!isLoading) {
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
    }

    return {
      alertInfo: undefined,
      shouldDisableForm: false,
    };
  }, [errorMessage, freeCollateral, isLoading, stringGetter]);

  const heading = shouldHideTitleAndDescription ? null : (
    <div tw="flex flex-col gap-1">
      <h2>
        {isLoading ? (
          <span tw="flex flex-row items-center gap-[0.5ch]">
            <$LoadingSpinner />
            {stringGetter({ key: STRING_KEYS.LAUNCHING_MARKET_LOADING })}
          </span>
        ) : (
          stringGetter({ key: STRING_KEYS.CONFIRM_LAUNCH_DETAILS })
        )}
      </h2>

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
    </div>
  );

  const launchVisualization = (
    <div tw="mx-auto flex flex-row items-center gap-0.25">
      <$AssetContainer>
        <$LabelText>{stringGetter({ key: STRING_KEYS.AMOUNT_TO_DEPOSIT })}</$LabelText>
        <$AssetIconContainer>
          <AssetIcon tw="[--asset-icon-size:2rem]" logoUrl={usdcImage} symbol="USDC" />
          <Output useGrouping type={OutputType.Fiat} value={DEFAULT_VAULT_DEPOSIT_FOR_LAUNCH} />
        </$AssetIconContainer>
      </$AssetContainer>

      <Icon iconName={IconName.FastForward} size="1rem" tw="mt-[1.45rem] text-color-text-0" />

      <$AssetContainer>
        <$LabelText>{stringGetter({ key: STRING_KEYS.MARKET_TO_LAUNCH })}</$LabelText>
        <$AssetIconContainer>
          <AssetIcon
            tw="[--asset-icon-size:2rem]"
            logoUrl={launchableAsset?.logo}
            symbol={baseAsset}
          />
          <Output useGrouping type={OutputType.Text} value={baseAsset} />
        </$AssetIconContainer>
      </$AssetContainer>
    </div>
  );

  const liquidityTier = (
    <$LiquidityTier tw="relative flex flex-col gap-0.75 rounded-[0.625rem] p-1">
      <span tw="text-base text-color-text-0">
        {stringGetter({
          key: STRING_KEYS.LIQUIDITY_TIER_IS,
          params: {
            TIER: <span tw="text-color-text-1">{stringGetter({ key: STRING_KEYS.ISOLATED })}</span>,
          },
        })}
      </span>
      <$LiquidityTierDetails
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
    </$LiquidityTier>
  );

  const alertMessage = alertInfo && (
    <AlertMessage type={alertInfo.type}>{alertInfo.message}</AlertMessage>
  );

  return (
    <$Form
      onSubmit={async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setIsLoading(true);
        setErrorMessage(undefined);

        notify(
          {
            slotTitleLeft: <$LoadingSpinner />,
            title: stringGetter({ key: STRING_KEYS.LAUNCHING_MARKET_LOADING }),
            body: stringGetter({
              key: STRING_KEYS.AVAILABLE_TO_TRADE_POST_LAUNCH,
              params: { MARKET: getDisplayableTickerFromMarket(ticker) },
            }),
          },
          {
            id: `launch-${ticker}`,
            toastDuration: Infinity,
          }
        );

        dispatch(
          setLaunchMarketIds({ launchedMarketId: ticker, launchStatus: LaunchMarketStatus.PENDING })
        );

        try {
          const tx = await createPermissionlessMarket(ticker);

          if ((tx as IndexedTx | undefined)?.code === 0) {
            const encodedTx = encodeJson(tx);
            const parsedTx = JSON.parse(encodedTx);
            const hash = parsedTx.hash.toUpperCase();

            if (!hash) {
              throw new Error('Invalid transaction hash');
            }

            setTxHash(hash);
          }

          setEta(Date.now() + ESTIMATED_LAUNCH_TIMEOUT);

          setTimeout(() => {
            dispatch(
              setLaunchMarketIds({
                launchedMarketId: ticker,
                launchStatus: LaunchMarketStatus.SUCCESS,
              })
            );

            notify(
              {
                slotTitleLeft: <$CheckCircleIcon iconName={IconName.CheckCircle} />,
                title: stringGetter({ key: STRING_KEYS.MARKET_LAUNCHED }),
                body: stringGetter({
                  key: STRING_KEYS.MARKET_NOW_LIVE_TRADE,
                  params: { MARKET: getDisplayableTickerFromMarket(ticker) },
                }),
              },
              {
                id: `launch-${ticker}`,
              }
            );
          }, ESTIMATED_LAUNCH_TIMEOUT);
        } catch (error) {
          dispatch(
            setLaunchMarketIds({
              launchedMarketId: ticker,
              launchStatus: LaunchMarketStatus.FAILURE,
            })
          );

          log('NewMarketPreviewForm/createPermissionlessMarket', error);
          setErrorMessage(error.message);
          setIsLoading(false);
        }
      }}
    >
      {heading}

      {launchVisualization}

      {liquidityTier}

      {alertMessage}

      {secondsLeft > 0 ? (
        <AlertMessage type={AlertType.Info}>
          {stringGetter({
            key:
              Math.ceil(secondsLeft) === 1
                ? STRING_KEYS.WAIT_SECONDS_SINGULAR
                : STRING_KEYS.WAIT_SECONDS,
            params: {
              SECONDS: String(Math.ceil(secondsLeft)),
            },
          })}
        </AlertMessage>
      ) : (
        <$Details items={receiptItems} tw="rounded-[0.625rem] px-1 py-0.5 text-small" />
      )}

      <div tw="flex flex-col gap-1">
        <Checkbox
          checked={hasAcceptedTerms}
          onCheckedChange={(checked) => setHasAcceptedTerms(checked)}
          id="launch-market-ack"
          disabled={isLoading}
          label={
            <span>
              {stringGetter({
                key: STRING_KEYS.MEGAVAULT_TERMS_TEXT,
                params: {
                  CONFIRM_BUTTON_TEXT: stringGetter({ key: STRING_KEYS.ADD_FUNDS_AND_LAUNCH }),
                  LINK: (
                    <Link tw="inline-flex" href={launchMarketTos} withIcon>
                      {stringGetter({ key: STRING_KEYS.LAUNCH_MARKET_TERMS })}
                    </Link>
                  ),
                },
              })}
            </span>
          }
        />

        <div tw="grid w-full grid-cols-[1fr_2fr] gap-1">
          <Button onClick={onBack} state={{ isDisabled: isLoading }}>
            {stringGetter({ key: STRING_KEYS.BACK })}
          </Button>
          <Button
            type={ButtonType.Submit}
            action={ButtonAction.Primary}
            state={{ isDisabled: shouldDisableForm || !hasAcceptedTerms, isLoading }}
          >
            {stringGetter({ key: STRING_KEYS.ADD_FUNDS_AND_LAUNCH })}
          </Button>
        </div>
      </div>
    </$Form>
  );
};

const $LoadingSpinner = styled(LoadingSpinner)`
  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`;

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

const $LiquidityTier = styled.div`
  background-color: var(--innerElement-backgroundColor, var(--color-layer-2));
`;

const $Details = styled(Details)`
  background-color: var(--innerElement-backgroundColor, var(--color-layer-2));
`;

const $LiquidityTierDetails = styled(Details)`
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

const $AssetContainer = tw.div`flex flex-col items-center justify-center gap-0.5`;

const $LabelText = tw.span`text-small text-color-text-0`;

const $AssetIconContainer = styled.div`
  width: var(--launchMarketPreview-width, 9.375rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.625rem;
  background-color: var(--color-layer-4);
  padding: 1rem 0;
`;

const $CheckCircleIcon = styled(Icon)`
  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`;
