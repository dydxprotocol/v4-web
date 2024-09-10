import { FormEvent, useMemo, useState } from 'react';

import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Details, type DetailsItem } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { log } from '@/lib/telemetry';

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
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const [errorMessage, setErrorMessage] = useState();
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const alertMessage = useMemo(() => {
    let alert;
    if (errorMessage) {
      alert = {
        type: AlertType.Error,
        message: errorMessage,
      };
    }

    if (alert) {
      <AlertMessage type={alert.type}>{alert.message} </AlertMessage>;
    }

    return null;
  }, [errorMessage]);

  const isDisabled = alertMessage !== null;

  const heading = shouldHideTitleAndDescription ? null : (
    <>
      <h2>{stringGetter({ key: STRING_KEYS.CONFIRM_LAUNCH_DETAILS })}</h2>
      <span tw="text-color-text-0">
        {stringGetter({
          key: STRING_KEYS.DEPOSIT_LOCKUP_DESCRIPTION,
          params: {
            NUM_DAYS: <span tw="text-color-text-1">30</span>,
            PAST_DAYS: 30,
            APR_PERCENTAGE: (
              <Output
                type={OutputType.Percent}
                tw="inline-block text-color-success"
                value={0.3456}
              />
            ),
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
          <AssetIcon tw="h-2 w-2" symbol="USDC" />
          <Output useGrouping type={OutputType.Fiat} value={10_000} />
        </div>
      </div>

      <Icon iconName={IconName.FastForward} tw="mt-[1.45rem] h-[1rem] w-[1rem] text-color-text-0" />

      <div tw="flex flex-col items-center justify-center gap-0.5">
        <span tw="text-small text-color-text-0">
          {stringGetter({ key: STRING_KEYS.MARKET_TO_LAUNCH })}
        </span>
        <div tw="flex w-[9.375rem] flex-col items-center justify-center gap-0.5 rounded-[0.625rem] bg-color-layer-4 py-1">
          <AssetIcon tw="h-2 w-2" symbol="ETH" />
          <Output useGrouping type={OutputType.Text} value="ETH" />
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
            TIER: (
              <span tw="text-color-text-1">{stringGetter({ key: STRING_KEYS.LONG_TAIL })}</span>
            ),
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
            value: <Output type={OutputType.Number} value={0.2} fractionDigits={1} />,
          },
          {
            key: 'mainetnanace-margin',
            label: stringGetter({ key: STRING_KEYS.MAINTENANCE_MARGIN_FRACTION_SHORT }),
            value: <Output type={OutputType.Number} value={0.1} fractionDigits={1} />,
          },
          {
            key: 'impact-notional',
            label: stringGetter({ key: STRING_KEYS.IMPACT_NOTIONAL }),
            value: <Output type={OutputType.Fiat} value={2_500} />,
          },
        ]}
      />
    </div>
  );

  return (
    <$Form
      onSubmit={async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!hasAcceptedTerms) {
          dispatch(
            openDialog(
              DialogTypes.NewMarketAgreement({
                acceptTerms: () => setHasAcceptedTerms(true),
              })
            )
          );
        } else {
          setIsLoading(true);
          setErrorMessage(undefined);

          try {
            onSuccess(ticker);
          } catch (error) {
            log('NewMarketPreviewForm/submitNewMarketProposal', error);
            setErrorMessage(error.message);
          } finally {
            setIsLoading(false);
          }
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

      <div tw="grid w-full grid-cols-[1fr_2fr] gap-1">
        <Button onClick={onBack}>{stringGetter({ key: STRING_KEYS.BACK })}</Button>
        <Button
          type={ButtonType.Submit}
          action={ButtonAction.Primary}
          state={{ isDisabled, isLoading }}
        >
          {hasAcceptedTerms
            ? stringGetter({ key: STRING_KEYS.PROPOSE_NEW_MARKET })
            : stringGetter({ key: STRING_KEYS.ACKNOWLEDGE_TERMS })}
        </Button>
      </div>
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
