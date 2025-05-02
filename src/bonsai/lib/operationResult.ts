import { ParsingError } from './extractErrors';

export type OperationSuccess<T> = {
  type: 'success';
  payload: T;
};

export type OperationFailure = {
  type: 'failure';
  errorString: string;
  displayInfo?: ParsingError;
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
  displayInfo?: ParsingError
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

export class WrappedOperationFailureError extends Error {
  public readonly failure: OperationFailure;

  constructor(failure: OperationFailure) {
    super(failure.errorString);
    this.name = 'WrappedOperationFailureError';
    this.failure = failure;
  }

  // Get the failure object directly
  public getFailure(): OperationFailure {
    return this.failure;
  }
}

export function isWrappedOperationFailureError(
  error: unknown
): error is WrappedOperationFailureError {
  return (
    error instanceof WrappedOperationFailureError ||
    (error != null &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'WrappedOperationFailureError' &&
      'failure' in error &&
      error.failure != null &&
      typeof error.failure === 'object' &&
      'type' in error.failure &&
      error.failure.type === 'failure')
  );
}
