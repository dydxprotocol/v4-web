import { useCallback, useEffect, useMemo, useState } from 'react';

import { SelectedGasDenom } from '@dydxprotocol/v4-client-js/src/clients/constants';
import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';
import { formatUnits } from 'viem';

import { AlertType } from '@/constants/alerts';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, SMALL_USD_DECIMALS } from '@/constants/numbers';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog } from '@/components/Dialog';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { Tag } from '@/components/Tag';
import {
  StakeRewardButtonAndReceipt,
  type StakeButtonAlert,
} from '@/views/StakeRewardButtonAndReceipt';

import { getSubaccountEquity } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getChartDotBackground } from '@/state/configsSelectors';

import { BigNumberish, MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';

type ElementProps = {
  validators: string[];
  usdcRewards: BigNumberish;
  setIsOpen: (open: boolean) => void;
};

export const StakingRewardDialog = ({ validators, usdcRewards, setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { usdcLabel, usdcDecimals } = useTokenConfigs();

  const { getWithdrawRewardFee, withdrawReward } = useSubaccount();

  const chartDotsBackground = useAppSelector(getChartDotBackground);
  const { current: equity } = useAppSelector(getSubaccountEquity, shallowEqual) ?? {};

  const [error, setError] = useState<StakeButtonAlert>();
  const [fee, setFee] = useState<BigNumberish>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getWithdrawRewardFee(validators)
      .then((stdFee) => {
        if (stdFee.amount.length > 0) {
          const feeAmount = stdFee.amount[0].amount;
          setFee(MustBigNumber(formatUnits(BigInt(feeAmount), usdcDecimals)));
        } else {
          setFee(undefined);
        }
      })
      .catch((err) => {
        log('StakeRewardDialog/getWithdrawRewardFee', err);
        setFee(undefined);
      });
  }, [getWithdrawRewardFee, usdcDecimals, validators]);

  useEffect(() => {
    if (fee && MustBigNumber(fee).gt(MustBigNumber(usdcRewards))) {
      setError({
        key: STRING_KEYS.GAS_FEE_GREATER_THAN_REWARD_ERROR,
        type: AlertType.Error,
        message: stringGetter({ key: STRING_KEYS.GAS_FEE_GREATER_THAN_REWARD_ERROR }),
      });
    }
  }, [stringGetter, fee, usdcRewards]);

  const detailItems = useMemo(() => {
    const newEquity = MustBigNumber(equity).plus(usdcRewards);
    return [
      {
        key: 'equity',
        label: (
          <>
            {stringGetter({ key: STRING_KEYS.EQUITY })} <Tag>{usdcLabel}</Tag>
          </>
        ),
        value: (
          <DiffOutput
            type={OutputType.Fiat}
            value={equity}
            newValue={newEquity}
            sign={NumberSign.Positive}
            withDiff={MustBigNumber(equity) !== newEquity}
          />
        ),
      },
      {
        key: 'gas-fees',
        label: (
          <>
            {stringGetter({ key: STRING_KEYS.EST_GAS })} <Tag>{usdcLabel}</Tag>
          </>
        ),
        value: <Output type={OutputType.Fiat} value={fee} />,
      },
    ];
  }, [equity, usdcLabel, usdcRewards, fee, stringGetter]);

  const claimRewards = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      await withdrawReward(validators);
      setIsOpen(false);
    } catch (err) {
      log('StakeRewardDialog/withdrawReward', err);
      setError({
        key: err.msg,
        type: AlertType.Error,
        message: err.msg,
      });
    } finally {
      setIsLoading(false);
    }
  }, [validators, withdrawReward, setIsOpen]);

  return (
    <$Dialog isOpen setIsOpen={setIsOpen} hasHeaderBlur={false}>
      <$Container backgroundImagePath={chartDotsBackground}>
        <$AssetContainer>
          <$Pill>
            <$PositiveOutput
              type={OutputType.Asset}
              value={usdcRewards}
              showSign={ShowSign.Both}
              minimumFractionDigits={SMALL_USD_DECIMALS}
            />
            {usdcLabel}
          </$Pill>
          <$AssetIcon symbol="USDC" />
        </$AssetContainer>
        <$Heading>{stringGetter({ key: STRING_KEYS.YOU_EARNED })}</$Heading>

        <$StakeRewardButtonAndReceipt
          detailItems={detailItems}
          alert={error}
          buttonText={
            <span>
              {stringGetter({
                key: STRING_KEYS.CLAIM_USDC_AMOUNT,
                params: {
                  USDC_AMOUNT: (
                    <$AmountOutput
                      type={OutputType.Asset}
                      value={usdcRewards}
                      showSign={ShowSign.None}
                      minimumFractionDigits={SMALL_USD_DECIMALS}
                    />
                  ),
                },
              })}
            </span>
          }
          gasFee={fee}
          gasDenom={SelectedGasDenom.USDC}
          isLoading={isLoading}
          isForm={false}
          onClick={claimRewards}
        />
      </$Container>
    </$Dialog>
  );
};

const $Dialog = styled(Dialog)`
  --dialog-header-paddingBottom: 0rem;
`;

const $Container = styled.div<{ backgroundImagePath: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;

    ${({ backgroundImagePath }) => css`
      background-image: url(${backgroundImagePath}),
        linear-gradient(to top, var(--color-layer-3) 60%, var(--color-positive-dark));
    `}
    mask-image: linear-gradient(to bottom, var(--color-layer-3) 20%, transparent);
  }
`;

const $AssetContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  flex-direction: column;
`;

const $Pill = styled.div`
  border-radius: 1rem;
  display: inline-flex;
  padding: 0.25rem 0.5rem;
  gap: 0.5ch;

  background: var(--color-positive-dark);
  color: var(--color-text-2);

  margin-bottom: -0.5rem;
  z-index: 1;
`;

const $AssetIcon = styled(AssetIcon)`
  font-size: 5rem;
`;

const $Heading = styled.h3`
  font: var(--font-extra-bold);
  color: var(--color-text-2);
  z-index: 1;
`;

const $StakeRewardButtonAndReceipt = styled(StakeRewardButtonAndReceipt)`
  z-index: 1;
`;

const $AmountOutput = styled(Output)`
  display: inline;
`;

const $PositiveOutput = styled(Output)`
  --output-sign-color: var(--color-positive);
`;
