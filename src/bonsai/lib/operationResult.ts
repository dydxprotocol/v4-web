export type OperationSuccess<T> = {
  type: 'success';
  payload: T;
};

export type OperationFailure = {
  type: 'failure';
  errorString: string;
  displayInfo?: { message: string; stringKey?: string | null };
};

export type OperationResult<T> = OperationSuccess<T> | OperationFailure;

export function wrapOperationSuccess<T>(payload: T): OperationSuccess<T> {
  return {
    type: 'success',
    payload,
  };
}

export function wrapOperationFailure(
  errorString: string,
  displayInfo?: { message: string; stringKey?: string | null }
): OperationFailure {
  return {
    type: 'failure',
    errorString,
    displayInfo,
  };
}

// Type guard functions for narrowing
export function isOperationSuccess<T>(result: OperationResult<T>): result is OperationSuccess<T> {
  return result.type === 'success';
}

export function isOperationFailure<T>(result: OperationResult<T>): result is OperationFailure {
  return result.type === 'failure';
}
