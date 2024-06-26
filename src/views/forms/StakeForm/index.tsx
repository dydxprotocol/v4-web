import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import BigNumber from 'bignumber.js';
import { debounce } from 'lodash';
import { type NumberFormatValues } from 'react-number-format';
import styled from 'styled-components';
import { formatUnits } from 'viem';

import { AMOUNT_RESERVED_FOR_GAS_DYDX } from '@/constants/account';
import { AlertType } from '@/constants/alerts';
import { AnalyticsEvents } from '@/constants/analytics';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useStakingValidator } from '@/hooks/useStakingValidator';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { formMixins } from '@/styles/formMixins';

import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { FormMaxInputToggleButton } from '@/components/FormMaxInputToggleButton';
import { InputType } from '@/components/Input';
import { Link } from '@/components/Link';
import { OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { StakeButtonAlert } from '@/views/StakeRewardButtonAndReceipt';
import { StakeButtonAndReceipt } from '@/views/forms/StakeForm/StakeButtonAndReceipt';

import { useAppDispatch } from '@/state/appTypes';
import { forceOpenDialog } from '@/state/dialogs';

import { track } from '@/lib/analytics';
import { BigNumberish, MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';
import { hashFromTx } from '@/lib/txUtils';

type StakeFormProps = {
  onDone?: () => void;
  className?: string;
};

export const StakeForm = ({ onDone, className }: StakeFormProps) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const { delegate, getDelegateFee } = useSubaccount();
  const { nativeTokenBalance: balance } = useAccountBalance();
  const { selectedValidator, setSelectedValidator, defaultValidator } = useStakingValidator() ?? {};
  const { chainTokenLabel, chainTokenDecimals } = useTokenConfigs();

  // Form states
  const [error, setError] = useState<StakeButtonAlert>();
  const [fee, setFee] = useState<BigNumberish>();
  const [amountBN, setAmountBN] = useState<BigNumber | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // BN
  const newBalanceBN = balance.minus(amountBN ?? 0);
  const maxAmountBN = MustBigNumber(Math.max(balance.toNumber() - AMOUNT_RESERVED_FOR_GAS_DYDX, 0));

  const isAmountValid = amountBN && amountBN.gt(0) && amountBN.lte(maxAmountBN);
  const isAmountEnoughForGas = balance.gte(AMOUNT_RESERVED_FOR_GAS_DYDX);

  useEffect(() => {
    // Initalize to default validator once on mount
    setSelectedValidator(defaultValidator);
  }, []);

  useEffect(() => {
    if (!isAmountEnoughForGas) {
      setError({
        key: STRING_KEYS.INSUFFICIENT_STAKE_BALANCE,
        type: AlertType.Error,
        message: stringGetter({ key: STRING_KEYS.INSUFFICIENT_STAKE_BALANCE }),
      });
    } else if (amountBN && !isAmountValid) {
      setError({
        key: STRING_KEYS.ISOLATED_MARGIN_ADJUSTMENT_INVALID_AMOUNT,
        type: AlertType.Error,
        message: stringGetter({ key: STRING_KEYS.ISOLATED_MARGIN_ADJUSTMENT_INVALID_AMOUNT }),
      });
    } else {
      setError(undefined);
    }
  }, [stringGetter, amountBN, isAmountValid]);

  useEffect(() => {
    if (isAmountValid && selectedValidator) {
      setIsLoading(true);
      getDelegateFee(selectedValidator.operatorAddress, amountBN.toNumber())
        .then((stdFee) => {
          if (stdFee.amount.length > 0) {
            const feeAmount = stdFee.amount[0].amount;
            setFee(MustBigNumber(formatUnits(BigInt(feeAmount), chainTokenDecimals)));
          }
        })
        .catch((err) => {
          log('StakeForm/getDelegateFee', err);
          setFee(undefined);
        })
        .then(() => {
          setIsLoading(false);
        });
    } else {
      setFee(undefined);
    }
  }, [getDelegateFee, amountBN, selectedValidator, isAmountValid, chainTokenDecimals]);

  const debouncedChangeTrack = useMemo(
    () =>
      debounce((amount?: number, validator?: string) => {
        track(
          AnalyticsEvents.StakeInput({
            amount,
            validatorAddress: validator,
          })
        );
      }, 1000),
    []
  );

  const onChangeAmount = (value?: BigNumber) => {
    setAmountBN(value);
    debouncedChangeTrack(value?.toNumber(), selectedValidator?.operatorAddress);
  };

  const onStake = useCallback(async () => {
    if (!isAmountValid || !selectedValidator) {
      return;
    }
    try {
      setIsLoading(true);
      const tx = await delegate(selectedValidator.operatorAddress, amountBN.toNumber());
      const txHash = hashFromTx(tx.hash);

      track(
        AnalyticsEvents.StakeTransaction({
          txHash,
          amount: amountBN.toNumber(),
          validatorAddress: selectedValidator.operatorAddress,
          defaultValidatorAddress: defaultValidator?.operatorAddress,
        })
      );
      onDone?.();
    } catch (err) {
      log('StakeForm/onStake', err);
      setError({ key: err.message, type: AlertType.Error, message: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [isAmountValid, selectedValidator, defaultValidator, amountBN, delegate, onDone]);

  const amountDetailItems = [
    {
      key: 'amount',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.UNSTAKED_BALANCE })} <Tag>{chainTokenLabel}</Tag>
        </span>
      ),
      value: (
        <DiffOutput
          type={OutputType.Asset}
          value={balance}
          sign={NumberSign.Negative}
          newValue={newBalanceBN}
          hasInvalidNewValue={newBalanceBN.isNegative()}
          withDiff={amountBN && balance && !amountBN.isNaN()}
        />
      ),
    },
  ];

  const openKeplrDialog = () => dispatch(forceOpenDialog(DialogTypes.ExternalNavKeplr()));

  const openStrideDialog = () => dispatch(forceOpenDialog(DialogTypes.ExternalNavStride()));

  return (
    <$Form
      className={className}
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onStake();
      }}
    >
      <$Description>
        {stringGetter({
          key: STRING_KEYS.STAKE_DESCRIPTION,
        })}
      </$Description>
      <$WithDetailsReceipt side="bottom" detailItems={amountDetailItems}>
        <FormInput
          id="stakeAmount"
          label={stringGetter({ key: STRING_KEYS.AMOUNT_TO_STAKE })}
          type={InputType.Number}
          onChange={({ floatValue }: NumberFormatValues) =>
            onChangeAmount(floatValue !== undefined ? MustBigNumber(floatValue) : undefined)
          }
          value={amountBN ? amountBN.toNumber() : undefined}
          slotRight={
            isAmountEnoughForGas && (
              <FormMaxInputToggleButton
                isInputEmpty={!amountBN}
                isLoading={isLoading}
                onPressedChange={(isPressed: boolean) =>
                  isPressed ? onChangeAmount(maxAmountBN) : onChangeAmount(undefined)
                }
              />
            )
          }
        />
      </$WithDetailsReceipt>

      <$Footer>
        <StakeButtonAndReceipt
          error={error}
          fee={fee}
          isLoading={isLoading}
          amount={amountBN}
          selectedValidator={selectedValidator}
          setSelectedValidator={setSelectedValidator}
        />
        <$LegalDisclaimer>
          {stringGetter({
            key: STRING_KEYS.STAKING_LEGAL_DISCLAIMER_WITH_DEFAULT,
            params: {
              KEPLR_DASHBOARD_LINK: (
                <Link withIcon onClick={openKeplrDialog} isInline>
                  {stringGetter({ key: STRING_KEYS.KEPLR_DASHBOARD })}
                </Link>
              ),
              STRIDE_LINK: (
                <Link withIcon onClick={openStrideDialog} isInline>
                  Stride
                </Link>
              ),
            },
          })}
        </$LegalDisclaimer>
      </$Footer>
    </$Form>
  );
};

const $Form = styled.form`
  ${formMixins.transfersForm}
  --color-text-form: var(--color-text-0);
`;

const $Description = styled.div`
  color: var(--color-text-0);
`;

const $Footer = styled.footer`
  ${formMixins.footer}
  --stickyFooterBackdrop-outsetY: var(--dialog-content-paddingBottom);

  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const $WithDetailsReceipt = styled(WithDetailsReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
  color: var(--color-text-form);
`;

const $LegalDisclaimer = styled.div`
  text-align: center;
  color: var(--color-text-0);
  font: var(--font-mini-book);
`;
