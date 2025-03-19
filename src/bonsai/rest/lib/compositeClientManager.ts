import { createStoreEffect } from '@/bonsai/lib/createStoreEffect';
import { ResourceCacheManager } from '@/bonsai/lib/resourceCacheManager';
import { logBonsaiInfo } from '@/bonsai/logs';
import { StargateClient } from '@cosmjs/stargate';
import {
  CompositeClient,
  IndexerClient,
  IndexerConfig,
  Network,
  NetworkOptimizer,
  ValidatorConfig,
} from '@dydxprotocol/v4-client-js';

import { DEFAULT_TRANSACTION_MEMO } from '@/constants/analytics';
import {
  DydxChainId,
  DydxNetwork,
  ENVIRONMENT_CONFIG_MAP,
  TOKEN_CONFIG_MAP,
} from '@/constants/networks';

import { type AppDispatch, type RootStore } from '@/state/_store';
import { getSelectedNetwork } from '@/state/appSelectors';
import { setNetworkStateRaw } from '@/state/raw';

type CompositeClientWrapper = {
  dead?: boolean;
  compositeClient?: CompositeClient;
  indexer?: IndexerClient;
  nobleClient?: StargateClient;
  tearDown: () => void;
  compositeClientPromise: Promise<CompositeClient>;
  indexerPromise: Promise<IndexerClient>;
  nobleClientPromise: Promise<StargateClient>;
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

  const { clientWrapper, setCompositeClient, setIndexerClient, setNobleClient } =
    initializeClientWrapper(dispatch, network);

  (async () => {
    const indexerUrl = networkConfig.endpoints.indexers[0];
    if (indexerUrl == null) {
      throw new Error('No indexer urls found');
    }

    const validatorUrl = await getValidatorToUse(chainId, networkConfig.endpoints.validators);

    if (clientWrapper.dead) {
      return;
    }
    const indexerConfig = new IndexerConfig(indexerUrl.api, indexerUrl.socket);
    setIndexerClient(new IndexerClient(indexerConfig));

    const compositeClient = await CompositeClient.connect(
      new Network(
        chainId,
        indexerConfig,
        new ValidatorConfig(
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
            broadcastPollIntervalMs: 3_000,
            broadcastTimeoutMs: 60_000,
          },
          DEFAULT_TRANSACTION_MEMO,
          false
        )
      )
    );

    // this shouldn't be necessary - can actually be false
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (clientWrapper.dead) {
      return;
    }

    setCompositeClient(compositeClient);

    const nobleClient = await StargateClient.connect(networkConfig.endpoints.nobleValidator);

    // this shouldn't be necessary - can actually be false
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (clientWrapper.dead) {
      return;
    }

    setNobleClient(nobleClient);
  })();
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
  const networkOptimizer = new NetworkOptimizer();
  // Timer to measure how long it takes to find the optimal node
  const t0 = performance.now();
  const validatorUrl = await networkOptimizer.findOptimalNode(validatorEndpoints, chainId);
  const t1 = performance.now();

  logBonsaiInfo('CompositeClientManager', 'findOptimalNode', {
    validatorUrl,
    validatorList: validatorEndpoints,
    chainId,
    duration: t1 - t0,
  });

  return validatorUrl;
}

function initializeClientWrapper(dispatch: AppDispatch, network: DydxNetwork) {
  const indexerDeferred = createDeferred<IndexerClient>();
  const compositeClientDeferred = createDeferred<CompositeClient>();
  const nobleClientDeferred = createDeferred<StargateClient>();
  const clientWrapper: CompositeClientWrapper = {
    compositeClientPromise: compositeClientDeferred.promise,
    indexerPromise: indexerDeferred.promise,
    nobleClientPromise: nobleClientDeferred.promise,
    tearDown: () => {
      clientWrapper.dead = true;
      indexerDeferred.reject();
      compositeClientDeferred.reject();
      nobleClientDeferred.reject();
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
  };
  const setIndexerClient = (c: IndexerClient) => {
    clientWrapper.indexer = c;
    indexerDeferred.resolve(c);
    dispatch(
      setNetworkStateRaw({
        networkId: network,
        stateToMerge: { indexerClientReady: true },
      })
    );
  };
  const setCompositeClient = (c: CompositeClient) => {
    clientWrapper.compositeClient = c;
    compositeClientDeferred.resolve(c);
    dispatch(
      setNetworkStateRaw({
        networkId: network,
        stateToMerge: { compositeClientReady: true },
      })
    );
  };
  const setNobleClient = (c: StargateClient) => {
    clientWrapper.nobleClient = c;
    nobleClientDeferred.resolve(c);
    dispatch(
      setNetworkStateRaw({
        networkId: network,
        stateToMerge: { nobleClientReady: true },
      })
    );
  };
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
  return {
    clientWrapper,
    setIndexerClient,
    setCompositeClient,
    setNobleClient,
  };
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error?: Error) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error?: Error) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
