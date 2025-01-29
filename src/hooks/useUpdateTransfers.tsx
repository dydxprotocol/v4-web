import { useEffect, useRef } from 'react';

import { StatusState } from '@skip-go/client';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { updateDeposit } from '@/state/transfers';
import { getPendingDeposits } from '@/state/transfersSelectors';

import { useSkipClient } from './transfers/skipClient';
import { useAccounts } from './useAccounts';

export function useUpdateTransfers() {
  const { dydxAddress } = useAccounts();
  const dispatch = useAppDispatch();
  const { skipClient } = useSkipClient();

  // TODO: generalize this to withdrawals too
  const pendingDeposits = useAppSelector((store) => getPendingDeposits(store, dydxAddress));

  // keep track of the transactions for which we've already started querying for statuses
  const transactionToCallback = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!dydxAddress || !pendingDeposits.length) return;

    for (let i = 0; i < pendingDeposits.length; i += 1) {
      const deposit = pendingDeposits[i]!;
      const depositKey = `${deposit.chainId}-${deposit.txHash}`;
      if (transactionToCallback.current[depositKey]) return;

      transactionToCallback.current[depositKey] = true;
      skipClient
        .waitForTransaction({ chainID: deposit.chainId, txHash: deposit.txHash })
        .then((response) => {
          dispatch(
            updateDeposit({
              dydxAddress,
              deposit: {
                ...deposit,
                status: handleResponseStatus(response.status),
              },
            })
          );
        });
    }
  }, [dydxAddress, pendingDeposits, skipClient, dispatch]);
}

function handleResponseStatus(status: StatusState) {
  switch (status) {
    case 'STATE_ABANDONED':
    case 'STATE_COMPLETED_ERROR':
    case 'STATE_PENDING_ERROR':
    case 'STATE_UNKNOWN':
      return 'error';
    case 'STATE_COMPLETED':
    case 'STATE_COMPLETED_SUCCESS':
      return 'success';
    default:
      return 'pending';
  }
}
