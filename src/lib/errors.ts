import { Nullable, ParsingError } from '@/constants/abacus';
import { DEFAULT_SOMETHING_WENT_WRONG_ERROR_PARAMS, ErrorParams } from '@/constants/errors';
import { STRING_KEY_VALUES } from '@/constants/localization';

import { log } from './telemetry';

/**
 * Error thrown if StatefulOrder includes an error code in it's response.
 */
export class StatefulOrderError extends Error {
  response: any;

  code: number;

  constructor(message: any, response: any) {
    super(message);
    this.name = 'StatefulOrderError';
    this.response = response;
    this.code = response.code;
  }
}

type RouteErrorCodes = 5;

const routeErrorCodesToMessageOverride = {
  5: 'This route is not yet supported, please check back soon as we are adding new routes.',
};

export const getRouteErrorMessageOverride = (
  routeErrors: string,
  routeErrorMessage: string | null | undefined
) => {
  try {
    const routeErrorsObj = JSON.parse(routeErrors);
    const routeErrorCode = routeErrorsObj?.[0]?.code as RouteErrorCodes;
    return routeErrorCodesToMessageOverride[routeErrorCode] ?? routeErrorMessage;
  } catch (err) {
    log('getRouteErrorMessageOverride', err);
    return routeErrorMessage;
  }
};

const getUntranslatedErrorMessageOrDefaultErrorParams = (errorMessage?: string): ErrorParams => {
  if (errorMessage && errorMessage !== '') return { errorMessage };
  return DEFAULT_SOMETHING_WENT_WRONG_ERROR_PARAMS;
};

export const getValidParsingErrorParams = (error?: Nullable<ParsingError>): ErrorParams => {
  const { stringKey: errorStringKey, message: errorMessage } = error ?? {};
  const defaultErrorParams = getUntranslatedErrorMessageOrDefaultErrorParams(errorMessage);
  if (!errorStringKey) return defaultErrorParams;

  const validErrorStringKey = STRING_KEY_VALUES[errorStringKey];
  if (!validErrorStringKey) {
    const err = new Error(`Missing error translation for ${errorStringKey}`);
    log('errors/MissingParsingErrorTranslation', err, { parsingError: error });
    return defaultErrorParams;
  }

  return { errorStringKey: validErrorStringKey };
};
