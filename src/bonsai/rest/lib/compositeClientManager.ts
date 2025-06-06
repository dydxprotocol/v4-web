import { createStoreEffect } from '@/bonsai/lib/createStoreEffect';
import { getLazyStargateClient } from '@/bonsai/lib/lazyDynamicLibs';
import { ResourceCacheManager } from '@/bonsai/lib/resourceCacheManager';
import { logBonsaiError, logBonsaiInfo } from '@/bonsai/logs';
import { type StargateClient } from '@cosmjs/stargate';
import type { CompositeClient, IndexerClient } from '@dydxprotocol/v4-client-js';
import { weakMapMemoize } from 'reselect';

import { AnalyticsUserProperties, DEFAULT_TRANSACTION_MEMO } from '@/constants/analytics';
import {
  DydxChainId,
  DydxNetwork,
  ENVIRONMENT_CONFIG_MAP,
  TOKEN_CONFIG_MAP,
} from '@/constants/networks';

import { type AppDispatch, type RootStore } from '@/state/_store';
import { getSelectedNetwork } from '@/state/appSelectors';
import { setNetworkStateRaw } from '@/state/raw';

import { identify } from '@/lib/analytics/analytics';
import { browserTimeOffsetPromise } from '@/lib/timeOffset';
import { sleep } from '@/lib/timeUtils';

type ClientState<ClientType> = {
  dead: boolean;
  client: ClientType | undefined;
  // contains awaitable promise
  deferred: Deferred<ClientType>;
  currentOperationId: number;
};

export type CompositeClientWrapper = {
  dead?: boolean;
  // makes dead
  tearDown: () => void;
  // only really refreshes the composite and noble clients
  refreshConnections: () => void;

  compositeClient: ClientState<CompositeClient>;
  indexer: ClientState<IndexerClient>;
  nobleClient: ClientState<StargateClient>;
};

function makeCompositeClient({
  network,
  dispatch,
}: {
  network: DydxNetwork;
  dispatch: AppDispatch;
}): CompositeClientWrapper {
  const networkConfig = ENVIRONMENT_CONFIG_MAP[network];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!networkConfig) {
    throw new Error(`Unknown network: ${network}`);
  }
  const chainId = networkConfig.dydxChainId as DydxChainId;
  const tokens = TOKEN_CONFIG_MAP[chainId];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (tokens == null) {
    throw new Error(`Unknown chain id: ${chainId}`);
  }

  async function getIndexerConfig() {
    const indexerUrl = networkConfig.endpoints.indexers[0];
    if (indexerUrl == null) {
      throw new Error('No indexer urls found');
    }
    return new (await getLazyIndexerConfig())(indexerUrl.api, indexerUrl.socket);
  }

  async function initializeCompositeClient() {
    const indexerConfig = await getIndexerConfig();
    const validatorUrl = await getValidatorToUse(chainId, networkConfig.endpoints.validators);

    const compositeClient = await (
      await getLazyCompositeClient()
    ).connect(
      new (await getLazyNetwork())(
        chainId,
        indexerConfig,
        new (await getLazyValidatorConfig())(
          validatorUrl,
          chainId,
          {
            USDC_DENOM: tokens.usdc.denom,
            USDC_DECIMALS: tokens.usdc.decimals,
            USDC_GAS_DENOM: tokens.usdc.gasDenom,
            CHAINTOKEN_DENOM: tokens.chain.denom,
            CHAINTOKEN_DECIMALS: tokens.chain.decimals,
          },
          {
            broadcastPollIntervalMs: 3000,
            broadcastTimeoutMs: 60000,
          },
          DEFAULT_TRANSACTION_MEMO,
          true,
          (await browserTimeOffsetPromise).offset
        )
      )
    );
    return compositeClient;
  }

  async function initializeNobleClient() {
    return (await getLazyStargateClient()).connect(networkConfig.endpoints.nobleValidator);
  }

  async function initializeIndexerClient() {
    return new (await getLazyIndexerClient())(await getIndexerConfig());
  }

  const clientWrapper = initializeClientWrapper(dispatch, network, {
    compositeClient: initializeCompositeClient,
    indexer: initializeIndexerClient,
    nobleClient: initializeNobleClient,
  });

  return clientWrapper;
}

export const CompositeClientManager = new ResourceCacheManager({
  constructor: (config: { network: DydxNetwork; dispatch: AppDispatch }) =>
    makeCompositeClient(config),
  destroyer: (instance) => {
    instance.tearDown();
  },
  // store not part of serialization, assumed immutable
  keySerializer: ({ network }) => network,
});

// this just makes things simpler
export function alwaysUseCurrentNetworkClient(store: RootStore) {
  return createStoreEffect(store, getSelectedNetwork, (network) => {
    CompositeClientManager.use({ network, dispatch: store.dispatch });
    return () => {
      CompositeClientManager.markDone({ network, dispatch: store.dispatch });
    };
  });
}

async function getValidatorToUse(chainId: DydxChainId, validatorEndpoints: string[]) {
  const networkOptimizer = new (await getLazyNetworkOptimizer())();
  // Timer to measure how long it takes to find the optimal node
  const t0 = performance.now();
  const validatorUrl = await networkOptimizer.findOptimalNode(validatorEndpoints, chainId);
  const t1 = performance.now();

  identify(AnalyticsUserProperties.BonsaiValidatorUrl(validatorUrl));
  logBonsaiInfo('CompositeClientManager', 'findOptimalNode', {
    validatorUrl,
    validatorList: validatorEndpoints,
    chainId,
    duration: t1 - t0,
  });

  return validatorUrl;
}

function makeClientManager<ClientType>(args: {
  load: () => Promise<ClientType>;
  onSuccess: (version: number, result: ClientType) => void;
  onError: (e?: any) => void;
}): {
  clientState: ClientState<ClientType>;
  load: () => void;
  tearDown: () => void;
} {
  // mutable, stable reference
  const clientState: ClientState<ClientType> = {
    dead: false,
    client: undefined,
    currentOperationId: 0,
    deferred: createDeferred<ClientType>(),
  };

  const load = async () => {
    if (clientState.dead) {
      return;
    }

    clientState.currentOperationId += 1;
    const myId = clientState.currentOperationId;

    if (clientState.deferred.state.settled) {
      clientState.deferred = createDeferred<ClientType>();
    }

    try {
      const client = await withRetry(() => {
        if (clientState.dead || clientState.currentOperationId !== myId) {
          throw new Error('Client dead or operation preempted');
        }
        return args.load();
      });
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (clientState.dead || clientState.currentOperationId !== myId) {
        return;
      }
      clientState.client = client;
      clientState.deferred.resolve(client);
      args.onSuccess(myId, client);
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (clientState.dead || clientState.currentOperationId !== myId) {
        return;
      }
      clientState.client = undefined;
      clientState.deferred.reject(e);
      args.onError(e);
    }
  };

  return {
    clientState,
    load,
    tearDown: () => {
      clientState.dead = true;
      const tearDownError = new Error('client tear down');
      clientState.deferred.reject(tearDownError);
      // we assume wrapper will manage this
      // args.onError(tearDownError);
    },
  };
}

function initializeClientWrapper(
  dispatch: AppDispatch,
  network: DydxNetwork,
  loads: {
    compositeClient: () => Promise<CompositeClient>;
    indexer: () => Promise<IndexerClient>;
    nobleClient: () => Promise<StargateClient>;
  }
) {
  dispatch(
    setNetworkStateRaw({
      networkId: network,
      stateToMerge: {
        compositeClientReady: false,
        indexerClientReady: false,
        nobleClientReady: false,
      },
    })
  );

  const compositeClient = makeClientManager({
    load: loads.compositeClient,
    onSuccess: (_v, client) =>
      dispatch(
        setNetworkStateRaw({
          networkId: network,
          stateToMerge: {
            compositeClientReady: true,
            compositeClientUrl: client.validatorClient.config.restEndpoint,
          },
        })
      ),
    onError: (e) => {
      logBonsaiError('CompositeClientManager', 'error initializing composite client', { error: e });

      dispatch(
        setNetworkStateRaw({
          networkId: network,
          stateToMerge: { compositeClientReady: false, errorInitializing: true },
        })
      );
    },
  });
  const indexer = makeClientManager({
    load: loads.indexer,
    onSuccess: () =>
      dispatch(
        setNetworkStateRaw({
          networkId: network,
          stateToMerge: { indexerClientReady: true },
        })
      ),
    onError: (e) => {
      logBonsaiError('CompositeClientManager', 'error initializing indexer client', { error: e });
      dispatch(
        setNetworkStateRaw({
          networkId: network,
          stateToMerge: { indexerClientReady: false, errorInitializing: true },
        })
      );
    },
  });
  const nobleClient = makeClientManager({
    load: loads.nobleClient,
    onSuccess: () =>
      dispatch(
        setNetworkStateRaw({
          networkId: network,
          stateToMerge: { nobleClientReady: true },
        })
      ),
    onError: (e) => {
      logBonsaiError('CompositeClientManager', 'error initializing noble client', { error: e });
      dispatch(
        setNetworkStateRaw({
          networkId: network,
          stateToMerge: { nobleClientReady: false, errorInitializing: true },
        })
      );
    },
  });

  const clients = [compositeClient, indexer, nobleClient];

  const clientWrapper: CompositeClientWrapper = {
    dead: false,
    compositeClient: compositeClient.clientState,
    indexer: indexer.clientState,
    nobleClient: nobleClient.clientState,
    tearDown: () => {
      clientWrapper.dead = true;
      clients.forEach((c) => c.tearDown());
      dispatch(
        setNetworkStateRaw({
          networkId: network,
          stateToMerge: {
            compositeClientReady: false,
            indexerClientReady: false,
            nobleClientReady: false,
          },
        })
      );
    },
    refreshConnections: () => {
      // only composite client can meaningfully update - since it might select a new node
      compositeClient.load();
    },
  };
  clients.forEach((c) => c.load());
  return clientWrapper;
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error?: Error) => void;
  state: { settled: boolean };
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error?: Error) => void;
  const state = { settled: false };

  const promise = new Promise<T>((res, rej) => {
    resolve = (value: T) => {
      state.settled = true;
      res(value);
    };
    reject = (error?: Error) => {
      state.settled = true;
      rej(error);
    };
  });

  return { promise, resolve, reject, state };
}

async function withRetry<T>(
  operation: () => Promise<T>,
  options = { maxRetries: 3, initialDelay: 1000 }
): Promise<T> {
  for (let attempt = 0; attempt <= options.maxRetries; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await operation();
    } catch (error) {
      if (attempt < options.maxRetries) {
        const delay = options.initialDelay * 2 ** attempt;
        // eslint-disable-next-line no-await-in-loop
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  throw new Error('Failed to complete operation - this should be unreachable');
}

// must lazy load separately to ensure best-possible tree shaking/static analysis
const getLazyIndexerConfig = weakMapMemoize(async () => {
  return (await import('@dydxprotocol/v4-client-js')).IndexerConfig;
});

const getLazyCompositeClient = weakMapMemoize(async () => {
  return (await import('@dydxprotocol/v4-client-js')).CompositeClient;
});

const getLazyNetwork = weakMapMemoize(async () => {
  return (await import('@dydxprotocol/v4-client-js')).Network;
});

const getLazyValidatorConfig = weakMapMemoize(async () => {
  return (await import('@dydxprotocol/v4-client-js')).ValidatorConfig;
});

const getLazyIndexerClient = weakMapMemoize(async () => {
  return (await import('@dydxprotocol/v4-client-js')).IndexerClient;
});

const getLazyNetworkOptimizer = weakMapMemoize(async () => {
  return (await import('@dydxprotocol/v4-client-js')).NetworkOptimizer;
});
