import { FormEvent, useMemo } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import { useDispatch } from 'react-redux';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { NumberSign, TOKEN_DECIMALS } from '@/constants/numbers';
import { LIQUIDITY_TIERS, MOCK_DATA } from '@/constants/potentialMarkets';
import { useAccountBalance, useDydxClient } from '@/hooks';
import { LinkOutIcon } from '@/icons';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { Output, OutputType } from '@/components/Output';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';

import { openDialog } from '@/state/dialogs';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

type NewMarketPreviewFormProps = {
  assetData: (typeof MOCK_DATA)[number];
  liquidityTier: string;
  onBack: () => void;
  onSuccess: () => void;
};

export const NewMarketPreviewForm = ({
  assetData,
  liquidityTier,
  onBack,
  onSuccess,
}: NewMarketPreviewFormProps) => {
  const { compositeClient } = useDydxClient();
  const { nativeTokenBalance } = useAccountBalance();
  const dispatch = useDispatch();

  const { label, initialMarginFraction, maintenanceMarginFraction, impactNotional } =
    LIQUIDITY_TIERS[liquidityTier as unknown as keyof typeof LIQUIDITY_TIERS];

  const alertMessage = useMemo(() => {
    if (nativeTokenBalance.lt(10_000)) {
      return {
        type: AlertType.Error,
        message: 'You need at least 10,000 DYDX to add a market.',
      };
    }

    return null;
  }, [nativeTokenBalance]);

  const isDisabled = false; // alertMessage !== null;

  return (
    <Styled.Form
      onSubmit={async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
          // const response = await compositeClient?.validatorClient.post.send()

          onSuccess();
        } catch (error) {
          console.error('[NewMarketPreviewForm] Error sending proposal', error);
        }
      }}
    >
      <h2>Confirm new market proposal</h2>
      <Styled.FormInput
        disabled
        label="Market"
        type={InputType.Text}
        value={`${assetData.symbol}-USD`}
      />
      <Styled.WithDetailsReceipt
        side="bottom"
        detailItems={[
          {
            key: 'imf',
            label: 'IMF',
            value: (
              <Output fractionDigits={2} type={OutputType.Number} value={initialMarginFraction} />
            ),
          },
          {
            key: 'mmf',
            label: 'MMF',
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
            label: 'Impact Notional',
            value: <Output type={OutputType.Fiat} value={impactNotional} />,
          },
        ]}
      >
        <Styled.FormInput disabled label="Liquidity tier" type={InputType.Text} value={label} />
      </Styled.WithDetailsReceipt>

      <Styled.WithDetailsReceipt
        side="bottom"
        detailItems={[
          {
            key: 'message-details',
            label: 'Message details',
            value: (
              <Button
                action={ButtonAction.Navigation}
                size={ButtonSize.Small}
                onClick={() =>
                  dispatch(
                    openDialog({
                      type: DialogTypes.NewMarketMessageDetails,
                      dialogProps: { assetData, liquidityTier },
                    })
                  )
                }
              >
                View Details →
              </Button>
            ),
          },
          {
            key: 'required-balance',
            label: 'Required balance',
            value: (
              <Output
                type={OutputType.Text}
                value="10,000+"
                slotRight={
                  <Styled.Icon
                    hasError={nativeTokenBalance?.lt(10_000)}
                    iconName={
                      nativeTokenBalance?.gt(10_000) ? IconName.CheckCircle : IconName.CautionCircle
                    }
                  />
                }
              />
            ),
          },
          {
            key: 'wallet-balance',
            label: 'Wallet balance',
            value: (
              <DiffOutput
                withDiff
                hasInvalidNewValue={isDisabled}
                sign={NumberSign.Negative}
                fractionDigits={TOKEN_DECIMALS}
                type={OutputType.Number}
                value={nativeTokenBalance}
                newValue={nativeTokenBalance.minus(10_000)}
              />
            ),
          },
        ]}
      >
        <div />
      </Styled.WithDetailsReceipt>
      {alertMessage && (
        <AlertMessage type={alertMessage.type}>{alertMessage.message} </AlertMessage>
      )}
      <Styled.ButtonRow>
        <Button onClick={onBack}>Back</Button>
        <Button type={ButtonType.Submit} action={ButtonAction.Primary} state={{ isDisabled }}>
          Propose new market
        </Button>
      </Styled.ButtonRow>
      <Styled.Disclaimer>
        When you submit a proposal, 10,000 DYDX will be deducted from your wallet. After the
        governance vote concludes, these tokens will be returned to your wallet, except if the
        proposal is vetoed.
      </Styled.Disclaimer>
    </Styled.Form>
  );
};

type NewMarketProposalSentProps = {
  onBack: () => void;
};

export const NewMarketProposalSent = ({ onBack }: NewMarketProposalSentProps) => {
  return (
    <Styled.ProposalSent>
      <Styled.OuterCircle>
        <Styled.InnerCircle>
          <Icon iconName={IconName.Check} />
        </Styled.InnerCircle>
      </Styled.OuterCircle>
      <h2>Submitted Proposal!</h2>
      <span>Your proposal is now going through governance.</span>
      <Styled.ButtonRow>
        <Button onClick={onBack}>Back</Button>
        <Button type={ButtonType.Link} href="https://google.com" action={ButtonAction.Primary}>
          View proposal
          <LinkOutIcon />
        </Button>
      </Styled.ButtonRow>
    </Styled.ProposalSent>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.ProposalSent = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
`;

Styled.OuterCircle = styled.div`
  width: 5.25rem;
  height: 5.25rem;
  min-width: 5.25rem;
  height: 5.25rem;
  border-radius: 50%;
  background-color: var(--color-gradient-positive);

  display: flex;
  align-items: center;
  justify-content: center;
`;

Styled.InnerCircle = styled.div`
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: var(--color-success);

  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    color: var(--color-layer-2);
  }
`;

Styled.Form = styled.form`
  ${formMixins.transfersForm}
  ${layoutMixins.stickyArea0}
  --stickyArea0-background: transparent;
`;

Styled.FormInput = styled(FormInput)`
  input {
    font-size: 1rem;
  }
`;

Styled.Icon = styled(Icon)<{ hasError?: boolean }>`
  margin-left: 0.5ch;

  ${({ hasError }) => (hasError ? 'color: var(--color-error);' : 'color: var(--color-success);')}
`;

Styled.WithDetailsReceipt = styled(WithDetailsReceipt)`
  --details-item-fontSize: 1rem;
`;

Styled.Disclaimer = styled.div`
  font: var(--font-small);
  color: var(--color-text-0);
  text-align: center;
  margin-left: 0.5ch;
`;

Styled.ButtonRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
`;
