import { Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useState } from 'react';

import { IndexedTx } from '@cosmjs/stargate';
import { encodeJson } from '@dydxprotocol/v4-client-js';
import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { ISOLATED_LIQUIDITY_TIER_INFO } from '@/constants/markets';
import { DEFAULT_VAULT_DEPOSIT_FOR_LAUNCH } from '@/constants/numbers';
import { timeUnits } from '@/constants/time';

import { useMetadataServiceAssetFromId } from '@/hooks/useLaunchableMarkets';
import { useNow } from '@/hooks/useNow';
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
import { useAppSelector } from '@/state/appTypes';
import { getMarketOraclePrice } from '@/state/perpetualsSelectors';

import { getDisplayableAssetFromTicker } from '@/lib/assetUtils';
import { MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';

const ESTIMATED_LAUNCH_TIMEOUT = timeUnits.minute;

type NewMarketPreviewStepProps = {
  ticker: string;
  onBack: () => void;
  onSuccess: (txHash: string) => void;
  receiptItems: DetailsItem[];
  setIsParentLoading?: Dispatch<SetStateAction<boolean>>;
  shouldHideTitleAndDescription?: boolean;
};

export const NewMarketPreviewStep = ({
  ticker,
  onBack,
  onSuccess,
  receiptItems,
  setIsParentLoading,
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
  const marketOraclePrice = useAppSelector((s) => getMarketOraclePrice(s, ticker));
  const [txHash, setTxHash] = useState<string>();
  const [eta, setEta] = useState<number>(0);
  const now = useNow();

  // Countdown timer used to wait for OraclePrice as well as a hard block before allowing user to navigate/re-subscribe
  const secondsLeft = isLoading ? Math.max(0, (eta - now) / timeUnits.second) : 0;
  const fullTimeElapsed = isLoading && secondsLeft === 0;

  /**
   * @description Side effect to set loading to false after ticker is returned from v4_markets channel and added to marketIds
   */
  useEffect(() => {
    if (marketOraclePrice && txHash && fullTimeElapsed) {
      setIsLoading(false);
      setIsParentLoading?.(false);
      setEta(0);
      onSuccess(txHash);
    }
  }, [marketOraclePrice, fullTimeElapsed, ticker, txHash, onSuccess, setIsParentLoading]);

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

        setIsLoading(true);
        setIsParentLoading?.(true);
        setErrorMessage(undefined);

        try {
          const tx = await createPermissionlessMarket(ticker);

          // Add try/catch for encode/parse so that it doesn't mess with loading states below
          try {
            if ((tx as IndexedTx | undefined)?.code === 0) {
              const encodedTx = encodeJson(tx);
              const parsedTx = JSON.parse(encodedTx);
              const hash = parsedTx.hash.toUpperCase();

              if (!hash) {
                throw new Error('Invalid transaction hash');
              }

              setTxHash(hash);
            }
          } catch (error) {
            setErrorMessage(error.message);
          }

          setEta(Date.now() + ESTIMATED_LAUNCH_TIMEOUT);
        } catch (error) {
          log('NewMarketPreviewForm/createPermissionlessMarket', error);
          setErrorMessage(error.message);
          setIsLoading(false);
          setIsParentLoading?.(false);
        }
      }}
    >
      {heading}

      {launchVisualization}

      {liquidityTier}

      {alertMessage}

      <Details
        items={receiptItems}
        tw="rounded-[0.625rem] bg-color-layer-2 px-1 py-0.5 text-small"
      />

      <Checkbox
        checked={hasAcceptedTerms}
        onCheckedChange={(checked) => setHasAcceptedTerms(checked)}
        id="launch-market-ack"
        label={
          <span>
            {stringGetter({
              key: STRING_KEYS.MEGAVAULT_TERMS_TEXT,
              params: {
                CONFIRM_BUTTON_TEXT: stringGetter({ key: STRING_KEYS.DEPOSIT_AND_LAUNCH }),
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
          {stringGetter({ key: STRING_KEYS.DEPOSIT_AND_LAUNCH })}
        </Button>
      </div>

      <span tw="text-center text-color-text-1 font-small-book">
        {secondsLeft > 0 &&
          stringGetter({
            key:
              Math.ceil(secondsLeft) === 1
                ? STRING_KEYS.WAIT_SECONDS_SINGULAR
                : STRING_KEYS.WAIT_SECONDS,
            params: {
              SECONDS: String(Math.ceil(secondsLeft)),
            },
          })}
      </span>
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
