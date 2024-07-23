import { useCallback, useEffect, useMemo, useState } from 'react';

import { zipObject } from 'lodash';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { ErrorParams } from '@/constants/errors';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';
import { EMPTY_ARR } from '@/constants/objects';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { OutputType } from '@/components/Output';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';

import {
  getNonZeroPendingPositions,
  getPendingIsolatedOrders,
  getSubaccount,
} from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getAssets } from '@/state/assetsSelectors';

import { MustBigNumber } from '@/lib/numbers';

type CancelAllOrdersInMarketFormProps = {
  marketId: string;
  onCancelComplete(): void;
};

type OrderCancelStatus =
  | { type: 'pending' }
  | { type: 'success' }
  | { type: 'error'; errorParams?: ErrorParams };

export const CancelAllOrdersInMarketForm = ({
  marketId,
  onCancelComplete,
}: CancelAllOrdersInMarketFormProps) => {
  const stringGetter = useStringGetter();
  const pendingPositions = useAppSelector(getNonZeroPendingPositions, shallowEqual);
  const thisPendingPosition = useMemo(
    () => pendingPositions?.find((f) => f.marketId === marketId),
    [marketId, pendingPositions]
  );
  const allPending = useAppSelector(getPendingIsolatedOrders, shallowEqual);
  const pendingPositionOrders = allPending[marketId] ?? EMPTY_ARR;
  const assetsData = useAppSelector(getAssets, shallowEqual);

  const [cancellingStatus, setCancellingStatus] = useState<Record<string, OrderCancelStatus>>({});
  const isCancelling = useMemo(
    () => Object.values(cancellingStatus).some((s) => s.type === 'pending'),
    [cancellingStatus]
  );
  const { cancelOrder } = useSubaccount();
  const { freeCollateral: crossFreeCollateral } = useAppSelector(getSubaccount, shallowEqual) ?? {};

  const onCancel = useCallback(() => {
    if (isCancelling) {
      return;
    }
    setCancellingStatus(
      zipObject(
        pendingPositionOrders.map((p) => p.id),
        pendingPositionOrders.map(() => ({ type: 'pending' }))
      )
    );
    pendingPositionOrders.forEach((p) =>
      cancelOrder({
        orderId: p.id,
        onSuccess: () => {
          setCancellingStatus((old) => ({ ...old, [p.id]: { type: 'success' } }));
        },
        onError: (errorParams) => {
          setCancellingStatus((old) => ({
            ...old,
            [p.id]: { type: 'error', errorParams },
          }));
        },
      })
    );
  }, [cancelOrder, isCancelling, pendingPositionOrders]);

  useEffect(() => {
    const allResults = Object.values(cancellingStatus);
    if (allResults.length === 0) {
      return;
    }
    // if there are errors, user should be able to see the error notifications so we won't display inline.
    if (allResults.every((r) => r.type === 'success' || r.type === 'error')) {
      onCancelComplete();
    }
  }, [cancellingStatus, onCancelComplete]);

  const detailItems = useMemo(() => {
    return [
      {
        key: 'open-orders',
        label: <span>{stringGetter({ key: STRING_KEYS.OPEN_ORDERS })}</span>,
        value: (
          <DiffOutput
            type={OutputType.Number}
            value={pendingPositionOrders.length}
            newValue={0}
            sign={NumberSign.Negative}
            withDiff={pendingPositionOrders.length > 0}
          />
        ),
      },
      {
        key: 'position-margin',
        label: <span>{stringGetter({ key: STRING_KEYS.POSITION_MARGIN })}</span>,
        value: (
          <DiffOutput
            type={OutputType.Fiat}
            value={thisPendingPosition?.freeCollateral?.current ?? 0}
            newValue={0}
            sign={NumberSign.Negative}
            withDiff={(thisPendingPosition?.freeCollateral?.current ?? 0) > 0}
          />
        ),
      },
      {
        key: 'cross-free-collateral',
        label: <span>{stringGetter({ key: STRING_KEYS.CROSS_FREE_COLLATERAL })}</span>,
        value: (
          <DiffOutput
            type={OutputType.Fiat}
            value={crossFreeCollateral?.current}
            newValue={MustBigNumber(crossFreeCollateral?.current).plus(
              MustBigNumber(thisPendingPosition?.freeCollateral?.current ?? 0)
            )}
            sign={NumberSign.Positive}
            withDiff={(thisPendingPosition?.freeCollateral?.current ?? 0) > 0}
          />
        ),
      },
    ];
  }, [
    crossFreeCollateral,
    pendingPositionOrders.length,
    stringGetter,
    thisPendingPosition?.freeCollateral,
  ]);

  const submitButtonWithReceipt = (
    <WithDetailsReceipt detailItems={detailItems}>
      <Button
        action={ButtonAction.Destroy}
        onClick={onCancel}
        state={{ isDisabled: isCancelling, isLoading: isCancelling }}
        tw="w-full"
      >
        {pendingPositionOrders.length !== 1
          ? stringGetter({
              key: STRING_KEYS.CANCEL_ORDERS_COUNT,
              params: { COUNT: pendingPositionOrders.length },
            })
          : stringGetter({
              key: STRING_KEYS.CANCEL_ORDER,
            })}
      </Button>
    </WithDetailsReceipt>
  );
  return (
    <div>
      <div tw="mb-1">
        {stringGetter({
          key: STRING_KEYS.CANCEL_ORDERS_CONFIRMATION,
          params: {
            OPEN_ORDERS_TEXT:
              pendingPositionOrders.length === 1
                ? stringGetter({ key: STRING_KEYS.ONE_OPEN_ORDER })
                : stringGetter({
                    key: STRING_KEYS.N_OPEN_ORDERS,
                    params: { COUNT: pendingPositionOrders.length },
                  }),
            ASSET: assetsData?.[pendingPositionOrders[0]?.assetId ?? '']?.name ?? marketId,
            MARKET: marketId,
          },
        })}
      </div>
      {submitButtonWithReceipt}
    </div>
  );
};
