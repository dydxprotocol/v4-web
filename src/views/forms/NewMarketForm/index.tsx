import { FormEvent, useEffect, useMemo, useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import { Root, Item } from '@radix-ui/react-radio-group';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

import { OnboardingState } from '@/constants/account';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { LIQUIDITY_TIERS, MOCK_DATA } from '@/constants/potentialMarkets';
import { useAccountBalance, useBreakpoints } from '@/hooks';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { SearchSelectMenu } from '@/components/SearchSelectMenu';
import { WithReceipt } from '@/components/WithReceipt';

import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { getOnboardingState } from '@/state/accountSelectors';
import { openDialog } from '@/state/dialogs';
import { getMarketIds } from '@/state/perpetualsSelectors';

import { isTruthy } from '@/lib/isTruthy';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';
import { breakpoints } from '@/styles';

import { NewMarketPreviewForm, NewMarketProposalSent } from './NewMarketPreviewForm';

enum NewMarketFormStep {
  SELECTION,
  PREVIEW,
  SUCCESS,
}

export const NewMarketForm = () => {
  const dispatch = useDispatch();
  const { nativeTokenBalance } = useAccountBalance();
  const onboardingState = useSelector(getOnboardingState);
  const isDisconnected = onboardingState === OnboardingState.Disconnected;
  const { isMobile } = useBreakpoints();
  const marketIds = useSelector(getMarketIds, shallowEqual);

  const [step, setStep] = useState(NewMarketFormStep.SELECTION);
  const [assetToAdd, setAssetToAdd] = useState<(typeof MOCK_DATA)[number]>();
  const [liquidityTier, setLiquidityTier] = useState<string>();
  const [canModifyLiqTier, setCanModifyLiqTier] = useState(false);

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

  const potentialMarkets = useMemo(() => {
    return MOCK_DATA.filter(
      (potentialMarket) =>
        potentialMarket.riskAssessment === 'Safe' &&
        !marketIds.includes(`${potentialMarket.symbol}-USD`)
    );
  }, [MOCK_DATA, marketIds]);

  if (NewMarketFormStep.SUCCESS === step) {
    return <NewMarketProposalSent onBack={() => setStep(NewMarketFormStep.SELECTION)} />;
  }

  if (NewMarketFormStep.PREVIEW === step) {
    if (assetToAdd && liquidityTier) {
      return (
        <NewMarketPreviewForm
          assetData={assetToAdd}
          liquidityTier={liquidityTier}
          onBack={() => setStep(NewMarketFormStep.SELECTION)}
          onSuccess={() => setStep(NewMarketFormStep.SUCCESS)}
        />
      );
    }
  }

  const isDisabled = !assetToAdd || liquidityTier === undefined;

  return (
    <Styled.Form
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStep(NewMarketFormStep.PREVIEW);
      }}
    >
      <h2>
        Add Market{' '}
        {assetToAdd && (
          <span>
            Ref. Price:{' '}
            <Output
              type={OutputType.Fiat}
              value={assetToAdd.referencePrice}
              fractionDigits={Math.abs(Number(assetToAdd.ticksizeExponent))}
            />
          </span>
        )}
      </h2>
      <Styled.SearchSelectMenu
        items={[
          {
            group: 'markets',
            groupLabel: 'Markets',
            items: potentialMarkets.map((potentialMarket: (typeof MOCK_DATA)[number]) => ({
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
              <Styled.Header>
                Liquidity tier{' '}
                <Button
                  shape={ButtonShape.Pill}
                  onClick={() => setCanModifyLiqTier(!canModifyLiqTier)}
                >
                  {canModifyLiqTier ? (
                    'Cancel'
                  ) : (
                    <>
                      Modify <Icon iconName={IconName.Pencil} />
                    </>
                  )}
                </Button>
              </Styled.Header>

              {Object.keys(LIQUIDITY_TIERS).map((tier, idx) => {
                const { maintenanceMarginFraction, impactNotional, label, initialMarginFraction } =
                  LIQUIDITY_TIERS[tier as unknown as keyof typeof LIQUIDITY_TIERS];
                return (
                  <Styled.LiquidityTierRadioButton
                    key={tier}
                    value={tier}
                    selected={tier === liquidityTier}
                    disabled={!canModifyLiqTier}
                  >
                    <Styled.Header style={{ marginLeft: '1rem' }}>
                      {label}{' '}
                      {tier === assetToAdd?.liquidityTier && (
                        <span style={{ marginLeft: '0.5ch' }}>- Recommended ✨</span>
                      )}
                    </Styled.Header>
                    <Styled.Details
                      layout={isMobile ? 'grid' : 'rowColumns'}
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
                          value: <Output type={OutputType.Fiat} value={impactNotional} />,
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
                label: <span>Message details</span>,
                value: (
                  <Button
                    action={ButtonAction.Navigation}
                    size={ButtonSize.Small}
                    onClick={() =>
                      dispatch(
                        openDialog({
                          type: DialogTypes.NewMarketMessageDetails,
                          dialogProps: { assetData: assetToAdd, liquidityTier },
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
          <Button type={ButtonType.Submit} state={{ isDisabled }} action={ButtonAction.Primary}>
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

  h2 {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    span {
      display: flex;
      align-items: center;
    }

    output {
      margin-left: 0.5ch;
    }
  }
`;

Styled.SearchSelectMenu = styled(SearchSelectMenu)``;

Styled.SelectedAsset = styled.span`
  color: var(--color-text-2);
`;

Styled.Disclaimer = styled.div`
  color: var(--color-text-0);
  margin-left: 0.5ch;
`;

Styled.Header = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  color: var(--color-text-2);
  font: var(--font-base-medium);
  justify-content: space-between;
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

  dt {
    text-align: left;
  }

  @media ${breakpoints.mobile} {
    padding: 0 1rem;

    dd {
      margin-bottom: 0.5rem;
    }
  }
`;

Styled.ReceiptDetails = styled(Details)`
  padding: 0.375rem 0.75rem 0.25rem;
`;
