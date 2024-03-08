import { shallowEqual, useSelector } from 'react-redux';

import type { AbacusApiState, Nullable } from '@/constants/abacus';
import { AbacusApiStatus } from '@/constants/abacus';
import { STRING_KEYS, type StringGetterFunction } from '@/constants/localization';

import { getApiState, getInitializationError } from '@/state/appSelectors';

import { useStringGetter } from './useStringGetter';

const getStatusErrorMessage = ({
  apiState,
  initializationError,
  stringGetter,
}: {
  apiState: Nullable<AbacusApiState>;
  initializationError?: string;
  stringGetter: StringGetterFunction;
}) => {
  const { status } = apiState || {};

  const chainDisruptionMessages = {
    title: stringGetter({ key: STRING_KEYS.CHAIN_DISRUPTION_DETECTED }),
    body: stringGetter({ key: STRING_KEYS.CHAIN_DISRUPTION_DETECTED_BODY }),
  };

  const indexerTrailingMessages = {
    title: stringGetter({ key: STRING_KEYS.ORDERBOOK_LAGGING }),
    body: stringGetter({ key: STRING_KEYS.ORDERBOOK_LAGGING_BODY }),
  };

  if (initializationError) {
    return chainDisruptionMessages;
  }

  switch (status) {
    case AbacusApiStatus.INDEXER_TRAILING: {
      return indexerTrailingMessages;
    }
    case AbacusApiStatus.INDEXER_DOWN:
    case AbacusApiStatus.INDEXER_HALTED:
    case AbacusApiStatus.VALIDATOR_DOWN:
    case AbacusApiStatus.VALIDATOR_HALTED:
    case AbacusApiStatus.UNKNOWN: {
      return chainDisruptionMessages;
    }
    case AbacusApiStatus.NORMAL:
    default: {
      return null;
    }
  }
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
  const statusErrorMessage = getStatusErrorMessage({ apiState, initializationError, stringGetter });
  const indexerHeight = getIndexerHeight(apiState);

  return {
    haltedBlock,
    height,
    indexerHeight,
    status,
    statusErrorMessage,
    trailingBlocks,
  };
};
