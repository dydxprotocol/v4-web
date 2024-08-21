import { FormEvent, useMemo } from 'react';

import { LightningBoltIcon } from '@radix-ui/react-icons';
import styled from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { USD_DECIMALS } from '@/constants/numbers';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useGovernanceVariables } from '@/hooks/useGovernanceVariables';
import { useLaunchableMarkets } from '@/hooks/useLaunchableMarkets';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { OutputType } from '@/components/Output';
import { SearchSelectMenu } from '@/components/SearchSelectMenu';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { WithReceipt } from '@/components/WithReceipt';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { getOnboardingState } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { MustBigNumber } from '@/lib/numbers';

type NewMarketSelectionStepProps = {
  assetToAdd?: string;
  setAssetToAdd: (ticker: string) => void;
  onConfirmMarket: () => void;
  receiptItems: Parameters<typeof Details>[0]['items'];
};

export const NewMarketSelectionStep = ({
  assetToAdd,
  setAssetToAdd,
  onConfirmMarket,
  receiptItems,
}: NewMarketSelectionStepProps) => {
  const { nativeTokenBalance } = useAccountBalance();
  const onboardingState = useAppSelector(getOnboardingState);
  const isDisconnected = onboardingState === OnboardingState.Disconnected;
  const { chainTokenDecimals, chainTokenLabel } = useTokenConfigs();
  const launchableMarkets = useLaunchableMarkets();
  const stringGetter = useStringGetter();
  const { newMarketProposal } = useGovernanceVariables();
  const initialDepositAmountBN = MustBigNumber(newMarketProposal.initialDepositAmount).div(
    Number(`1e${chainTokenDecimals}`)
  );
  const initialDepositAmountDecimals = isMainnet ? 0 : chainTokenDecimals;
  const initialDepositAmount = initialDepositAmountBN.toFixed(initialDepositAmountDecimals);

  const alertMessage = useMemo(() => {
    let alert;
    if (nativeTokenBalance.lt(initialDepositAmountBN)) {
      alert = {
        type: AlertType.Warning,
        message: stringGetter({
          key: STRING_KEYS.NOT_ENOUGH_BALANCE,
          params: {
            NUM_TOKENS_REQUIRED: initialDepositAmount,
            NATIVE_TOKEN_DENOM: chainTokenLabel,
          },
        }),
      };
    }

    if (alert) return <AlertMessage type={alert.type}>{alert.message}</AlertMessage>;
    return null;
  }, [chainTokenLabel, initialDepositAmount, nativeTokenBalance, stringGetter]);

  const formHeader = useMemo(() => {
    return (
      <>
        <h2>
          Launch a Market
          <span tw="flex flex-row items-center text-small text-color-text-1">
            <LightningBoltIcon tw="text-color-warning" /> Trade Instantly
          </span>
        </h2>
        <span tw="text-base text-color-text-0">
          Select the market you’d like to launch and deposit $10,000 into MegaVault. Your deposit
          will earn an estimated 34.56% APR (based on the last 30 days).
        </span>
      </>
    );
  }, []);

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
                    label: launchableMarket.id,
                    tag: launchableMarket.ticker.currency_pair.Base,
                    onSelect: () => {
                      setAssetToAdd(launchableMarket.id);
                    },
                  })) ?? [],
              },
            ]}
            label={stringGetter({ key: STRING_KEYS.MARKETS })}
          >
            {assetToAdd ? (
              <span tw="text-color-text-2">
                {assetToAdd} <Tag>{assetToAdd}</Tag>
              </span>
            ) : (
              `${stringGetter({ key: STRING_KEYS.EG })} "BTC-USD"`
            )}
          </SearchSelectMenu>

          <WithDetailsReceipt
            side="bottom"
            detailItems={[
              {
                key: 'cross-free-collateral',
                label: stringGetter({ key: STRING_KEYS.CROSS_FREE_COLLATERAL }),
                value: (
                  <DiffOutput
                    withDiff
                    type={OutputType.Fiat}
                    value={100000}
                    newValue={88000}
                    fractionDigits={USD_DECIMALS}
                  />
                ),
              },
            ]}
            tw="[--withReceipt-backgroundColor:--color-layer-2]"
          >
            <FormInput
              type={InputType.Currency}
              label="Required Amount to Deposit"
              placeholder="$10,000"
              value="$10000"
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
                state={{ isDisabled: !assetToAdd }}
                action={ButtonAction.Primary}
              >
                Preview Launch
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
