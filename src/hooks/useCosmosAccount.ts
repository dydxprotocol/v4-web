import { useEffect } from 'react';

import { Keplr } from '@keplr-wallet/provider-extension';
import type { Key } from '@keplr-wallet/types';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setCosmosAccount } from '@/state/cosmosAccount';
import { getCosmosAccount } from '@/state/cosmosAccountSelectors';

import { SUPPORTED_COSMOS_CHAINS } from '@/lib/cosmosChains';
import { log } from '@/lib/telemetry';

function assertFulfilled<T>(item: PromiseSettledResult<T>): item is PromiseFulfilledResult<T> {
  return item.status === 'fulfilled';
}

const getAccountsFromKeplr = async (keplr: Keplr) => {
  const settledAccounts = await Promise.allSettled(
    SUPPORTED_COSMOS_CHAINS.map(async (chainId) => {
      const key = await keplr.getKey(chainId);
      return { [chainId]: key };
    })
  );

  return settledAccounts
    .filter(assertFulfilled)
    .reduce((acc, { value }) => ({ ...acc, ...value }), {} as Record<string, Key>);
};

export const useCosmosAccount = () => {
  const dispatch = useAppDispatch();
  const accounts = useAppSelector(getCosmosAccount);

  const connectKeplr = async () => {
    try {
      const keplr = await Keplr.getKeplr();

      if (!keplr) {
        throw new Error('Keplr not found');
      }

      await keplr.enable(SUPPORTED_COSMOS_CHAINS);

      const cosmosAccounts = await getAccountsFromKeplr(keplr);
      dispatch(setCosmosAccount(cosmosAccounts));
    } catch (err) {
      log('useCosmosAccount/connectKeplr', err);
      dispatch(setCosmosAccount(undefined));
      throw err;
    }
  };

  const disconnectKeplr = async () => {
    dispatch(setCosmosAccount(undefined));
  };

  const isKeplrConnected = accounts !== undefined;

  const keplr = Keplr.getKeplr();

  return { keplr, isKeplrConnected, accounts, connectKeplr, disconnectKeplr };
};

export const useCosmosAccountChange = () => {
  const dispatch = useAppDispatch();
  const { isKeplrConnected } = useCosmosAccount();

  useEffect(() => {
    const handleKeystoreChange = async () => {
      try {
        const keplr = await Keplr.getKeplr();

        if (!keplr) {
          throw new Error('Keplr not found');
        }

        await keplr.enable(SUPPORTED_COSMOS_CHAINS);

        const cosmosAccounts = await getAccountsFromKeplr(keplr);

        dispatch(setCosmosAccount(cosmosAccounts));
      } catch (err) {
        log('useCosmosAccountChange/handleKeystoreChange', err);
        dispatch(setCosmosAccount(undefined));
      }
    };

    window.addEventListener('keplr_keystorechange', handleKeystoreChange);

    return () => {
      window.removeEventListener('keplr_keystorechange', handleKeystoreChange);
    };
  }, [isKeplrConnected]);
};
