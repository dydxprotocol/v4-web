import { FormEvent, useEffect, useMemo, useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import { Root, Item } from '@radix-ui/react-radio-group';
import { useDispatch, useSelector } from 'react-redux';

import { OnboardingState } from '@/constants/account';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { LIQUIDITY_TIERS, MOCK_DATA } from '@/constants/potentialMarkets';
import { useAccountBalance, useDydxClient } from '@/hooks';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { SearchSelectMenu } from '@/components/SearchSelectMenu';
import { WithReceipt } from '@/components/WithReceipt';

import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { getOnboardingState } from '@/state/accountSelectors';
import { openDialog } from '@/state/dialogs';

import { isTruthy } from '@/lib/isTruthy';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';
import { NewMarketPreviewForm } from './NewMarketPreviewForm';

enum NewMarketFormStep {
  SELECTION,
  PREVIEW,
}

export const NewMarketForm = () => {
  const { compositeClient } = useDydxClient();
  const dispatch = useDispatch();
  const { nativeTokenBalance } = useAccountBalance();
  const onboardingState = useSelector(getOnboardingState);
  const isDisconnected = onboardingState === OnboardingState.Disconnected;

  const [mode, setMode] = useState(NewMarketFormStep.SELECTION);
  const [assetToAdd, setAssetToAdd] = useState<(typeof MOCK_DATA)[number]>();
  const [liquidityTier, setLiquidityTier] = useState<string>();

  const alertMessage = useMemo(() => {
    if (nativeTokenBalance.lt(10_000)) {
      return {
        type: AlertType.Warning,
        message: 'You need at least 10,000 DYDX to add a market.',
      };
    }

    return null;
  }, [nativeTokenBalance]);

  useEffect(() => {
    if (assetToAdd) {
      setLiquidityTier(assetToAdd.liquidityTier);
    }
  }, [assetToAdd]);

  if (NewMarketFormStep.PREVIEW === mode) {
    if (assetToAdd && liquidityTier) {
      return (
        <NewMarketPreviewForm
          assetData={assetToAdd}
          liquidityTier={liquidityTier}
          onBack={() => setMode(NewMarketFormStep.SELECTION)}
        />
      );
    }
  }

  return (
    <Styled.Form
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMode(NewMarketFormStep.PREVIEW);
      }}
    >
      <h2>Add Market</h2>
      <Styled.SearchSelectMenu
        items={[
          {
            group: 'markets',
            groupLabel: 'Markets',
            items: MOCK_DATA.map((potentialMarket: (typeof MOCK_DATA)[number]) => ({
              value: potentialMarket.symbol,
              label: `${potentialMarket.symbol}-USD`,
              onSelect: () => {
                setAssetToAdd(potentialMarket);
              },
            })),
          },
        ]}
        label="Market"
      >
        {assetToAdd ? (
          <Styled.SelectedAsset>{assetToAdd?.symbol}-USD</Styled.SelectedAsset>
        ) : (
          'e.g. "BTC-USD"'
        )}
      </Styled.SearchSelectMenu>
      {assetToAdd && (
        <>
          <div>Populated details</div>
          <div>
            <Styled.Root value={liquidityTier} onValueChange={setLiquidityTier}>
              <Styled.Header>Liquidity tier</Styled.Header>

              {Object.keys(LIQUIDITY_TIERS).map((tier, idx) => {
                const { maintenanceMarginFraction, impactNotional, label, initialMarginFraction } =
                  LIQUIDITY_TIERS[tier as unknown as keyof typeof LIQUIDITY_TIERS];
                return (
                  <Styled.LiquidityTierRadioButton
                    key={tier}
                    value={tier}
                    selected={tier === liquidityTier}
                  >
                    <Styled.Header style={{ marginLeft: '1rem' }}>
                      {label}
                      {tier === assetToAdd?.liquidityTier && <span> - Recommended ✨</span>}
                    </Styled.Header>
                    <Styled.Details
                      layout="rowColumns"
                      withSeparators
                      items={[
                        {
                          key: 'imf',
                          label: 'IMF',
                          value: (
                            <Output
                              fractionDigits={2}
                              type={OutputType.Number}
                              value={initialMarginFraction}
                            />
                          ),
                        },
                        {
                          key: 'mmf',
                          label: 'Maintenance margin',
                          value: (
                            <Output
                              fractionDigits={2}
                              type={OutputType.Number}
                              value={maintenanceMarginFraction}
                            />
                          ),
                        },
                        {
                          key: 'impact-notional',
                          label: 'Impact notional',
                          value: <Output type={OutputType.Number} value={impactNotional} />,
                        },
                      ]}
                    />
                  </Styled.LiquidityTierRadioButton>
                );
              })}
            </Styled.Root>
          </div>
        </>
      )}
      {alertMessage && (
        <AlertMessage type={alertMessage.type}>{alertMessage.message} </AlertMessage>
      )}
      <WithReceipt
        slotReceipt={
          <Styled.ReceiptDetails
            items={[
              assetToAdd && {
                key: 'message-details',
                label: <span>Message Details</span>,
                value: (
                  <Button
                    action={ButtonAction.Navigation}
                    size={ButtonSize.Small}
                    onClick={() =>
                      dispatch(
                        openDialog({
                          type: DialogTypes.NewMarketMessageDetails,
                          dialogProps: { assetData: assetToAdd },
                        })
                      )
                    }
                  >
                    View Details →
                  </Button>
                ),
              },
              {
                key: 'dydx-required',
                label: (
                  <span>
                    Required balance <Tag>DYDX</Tag>
                  </span>
                ),
                value: (
                  <Output
                    type={OutputType.Number}
                    value={10000}
                    slotRight={<Styled.Disclaimer>or more</Styled.Disclaimer>}
                  />
                ),
              },
            ].filter(isTruthy)}
          />
        }
      >
        {isDisconnected ? (
          <OnboardingTriggerButton />
        ) : (
          <Button
            type={ButtonType.Submit}
            state={{ isDisabled: !assetToAdd }}
            action={ButtonAction.Primary}
          >
            Preview Market Proposal
          </Button>
        )}
      </WithReceipt>
    </Styled.Form>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Form = styled.form`
  ${formMixins.transfersForm}
  ${layoutMixins.stickyArea0}
  --stickyArea0-background: transparent;
`;

Styled.SearchSelectMenu = styled(SearchSelectMenu)``;

Styled.SelectedAsset = styled.span`
  color: var(--color-text-2);
`;

Styled.Disclaimer = styled.div`
  font: var(--font-small);
  color: var(--color-text-0);
  margin-left: 0.5ch;
`;

Styled.Header = styled.div`
  color: var(--color-text-2);
  font: var(--font-base-medium);
`;

Styled.Root = styled(Root)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid var(--color-layer-6);
  background-color: var(--color-layer-4);
`;

Styled.LiquidityTierRadioButton = styled(Item)<{ selected?: boolean }>`
  display: flex;
  flex-direction: column;
  border-radius: 0.625rem;
  border: 1px solid var(--color-layer-6);
  padding: 1rem 0;

  ${({ selected }) => selected && 'background-color: var(--color-layer-2)'}
`;

Styled.Details = styled(Details)`
  margin-top: 0.5rem;
  padding: 0;
`;

Styled.ReceiptDetails = styled(Details)`
  padding: 0.375rem 0.75rem 0.25rem;
  font-size: 0.8125em;
`;
