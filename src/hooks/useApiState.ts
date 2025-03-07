import { BonsaiCore } from '@/bonsai/ontology';
import { ApiState, ApiStatus } from '@/bonsai/types/summaryTypes';

import type { Nullable } from '@/constants/abacus';
import { STRING_KEYS, type StringGetterFunction } from '@/constants/localization';

import { getInitializationError } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { useStringGetter } from './useStringGetter';

export enum ConnectionErrorType {
  CHAIN_DISRUPTION = 'CHAIN_DISRUPTION',
  INDEXER_TRAILING = 'INDEXER_TRAILING',
}

const ErrorMessageMap = {
  [ConnectionErrorType.CHAIN_DISRUPTION]: {
    title: STRING_KEYS.CONNECTION_ISSUE_DETECTED,
    body: STRING_KEYS.CONNECTION_ISSUE_DETECTED_BODY,
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
  apiState: Nullable<ApiState>;
  initializationError?: string;
}) => {
  const { status } = apiState ?? {};

  if (initializationError) {
    return ConnectionErrorType.CHAIN_DISRUPTION;
  }

  switch (status) {
    case ApiStatus.INDEXER_TRAILING: {
      return ConnectionErrorType.INDEXER_TRAILING;
    }
    case ApiStatus.INDEXER_DOWN:
    case ApiStatus.INDEXER_HALTED:
    case ApiStatus.VALIDATOR_DOWN:
    case ApiStatus.VALIDATOR_HALTED:
    case ApiStatus.UNKNOWN: {
      return ConnectionErrorType.CHAIN_DISRUPTION;
    }
    case ApiStatus.NORMAL:
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

export const useApiState = () => {
  const stringGetter = useStringGetter();
  const apiState = useAppSelector(BonsaiCore.network.apiState);
  const initializationError = useAppSelector(getInitializationError);
  const validatorHeight = useAppSelector(BonsaiCore.network.validatorHeight.data);
  const indexerHeight = useAppSelector(BonsaiCore.network.validatorHeight.data);

  const { haltedBlock, status, trailingBlocks } = apiState ?? {};
  const connectionError = getConnectionError({
    apiState,
    initializationError,
  });
  const statusErrorMessage = getStatusErrorMessage({ connectionError, stringGetter });

  return {
    haltedBlock,
    height: validatorHeight?.height,
    indexerHeight: indexerHeight?.height,
    status,
    connectionError,
    statusErrorMessage,
    trailingBlocks,
  };
};
