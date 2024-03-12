import { shallowEqual, useSelector } from 'react-redux';

import type { AbacusApiState, Nullable } from '@/constants/abacus';
import { AbacusApiStatus } from '@/constants/abacus';
import { STRING_KEYS, type StringGetterFunction } from '@/constants/localization';

import { getApiState, getInitializationError } from '@/state/appSelectors';

import { useStringGetter } from './useStringGetter';

export enum ConnectionErrorType {
  CHAIN_DISRUPTION = 'CHAIN_DISRUPTION',
  INDEXER_TRAILING = 'INDEXER_TRAILING',
}

const ErrorMessageMap = {
  [ConnectionErrorType.CHAIN_DISRUPTION]: {
    title: STRING_KEYS.CHAIN_DISRUPTION_DETECTED,
    body: STRING_KEYS.CHAIN_DISRUPTION_DETECTED_BODY,
  },
  [ConnectionErrorType.INDEXER_TRAILING]: {
    title: STRING_KEYS.ORDERBOOK_LAGGING,
    body: STRING_KEYS.ORDERBOOK_LAGGING_BODY,
  },
};

const getConnectionError = ({
  apiState,
  initializationError,
}: {
  apiState: Nullable<AbacusApiState>;
  initializationError?: string;
}) => {
  const { status } = apiState || {};

  if (initializationError) {
    return ConnectionErrorType.CHAIN_DISRUPTION;
  }

  switch (status) {
    case AbacusApiStatus.INDEXER_TRAILING: {
      return ConnectionErrorType.INDEXER_TRAILING;
    }
    case AbacusApiStatus.INDEXER_DOWN:
    case AbacusApiStatus.INDEXER_HALTED:
    case AbacusApiStatus.VALIDATOR_DOWN:
    case AbacusApiStatus.VALIDATOR_HALTED:
    case AbacusApiStatus.UNKNOWN: {
      return ConnectionErrorType.CHAIN_DISRUPTION;
    }
    case AbacusApiStatus.NORMAL:
    default: {
      return undefined;
    }
  }
};

const getStatusErrorMessage = ({
  connectionError,
  stringGetter,
}: {
  connectionError?: ConnectionErrorType;
  stringGetter: StringGetterFunction;
}) => {
  if (connectionError && ErrorMessageMap[connectionError]) {
    return {
      title: stringGetter({ key: ErrorMessageMap[connectionError].title }),
      body: stringGetter({ key: ErrorMessageMap[connectionError].body }),
    };
  }
  return null;
};

export const getIndexerHeight = (apiState: Nullable<AbacusApiState>) => {
  const { haltedBlock, trailingBlocks, status, height } = apiState || {};

  switch (status) {
    case AbacusApiStatus.INDEXER_HALTED: {
      return haltedBlock;
    }
    case AbacusApiStatus.INDEXER_TRAILING: {
      return height != null && trailingBlocks != null ? height - trailingBlocks : null;
    }
    default: {
      return height;
    }
  }
};

export const useApiState = () => {
  const stringGetter = useStringGetter();
  const apiState = useSelector(getApiState, shallowEqual);
  const initializationError = useSelector(getInitializationError);
  const { haltedBlock, height, status, trailingBlocks } = apiState ?? {};
  const connectionError = getConnectionError({
    apiState,
    initializationError,
  });
  const statusErrorMessage = getStatusErrorMessage({ connectionError, stringGetter });
  const indexerHeight = getIndexerHeight(apiState);

  return {
    haltedBlock,
    height,
    indexerHeight,
    status,
    connectionError,
    statusErrorMessage,
    trailingBlocks,
  };
};
