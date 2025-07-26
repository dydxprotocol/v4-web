import { AnalyticsEvents } from '@/constants/analytics';
import { STRING_KEYS } from '@/constants/localization';
import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { store } from '@/state/_store';
import { getUserWalletAddress } from '@/state/accountInfoSelectors';
import { appQueryClient } from '@/state/appQueryClient';
import { getSelectedDydxChainId, getSelectedNetwork } from '@/state/appSelectors';

import { track } from './analytics/analytics';
import { signCompliancePayload } from './compliance';
import { mapIfPresent } from './do';
import { isSimpleFetchError, simpleFetch } from './simpleFetch';
import { removeTrailingSlash } from './stringifyHelpers';
import { log, logInfo } from './telemetry';

export enum ReferralAction {
  UPDATE_CODE = 'UPDATE_CODE',
}

export const sanitizeReferralCode = (code: string): string => {
  return code.replace(/[^a-zA-Z0-9]/g, '');
};

export const isValidReferralCodeFormat = (code: string): boolean => {
  return /^[a-zA-Z0-9]*$/.test(code);
};

export const updateReferralCode = async (newCode: string) => {
  try {
    const state = store.getState();
    const chainId = getSelectedDydxChainId(state);
    const address = getUserWalletAddress(state);
    const network = getSelectedNetwork(state);

    if (!address) {
      throw new Error('No account connected');
    }

    const networkConfig = ENVIRONMENT_CONFIG_MAP[network];
    const indexerUrl = mapIfPresent(networkConfig.endpoints.indexers[0]?.api, removeTrailingSlash);

    if (!indexerUrl) {
      throw new Error('No indexer URL available');
    }

    const signingResponse = await signCompliancePayload(address, {
      message: newCode,
      action: ReferralAction.UPDATE_CODE,
      status: '',
      chainId,
    });

    if (!signingResponse) {
      throw new Error('Failed to sign payload');
    }

    const parsedResponse = JSON.parse(signingResponse);
    if (parsedResponse.error) {
      throw new Error(parsedResponse.error);
    }

    const { signedMessage, publicKey, timestamp, isKeplr } = parsedResponse;

    const isKeplrOrHasTimestamp = isKeplr || timestamp;
    const hasMessageAndKey = signedMessage && publicKey;

    if (!hasMessageAndKey || !isKeplrOrHasTimestamp) {
      throw new Error('Invalid signature data');
    }

    const endpoint = isKeplr ? '/v4/affiliates/referralCode-keplr' : '/v4/affiliates/referralCode';

    const requestBody = isKeplr
      ? { address, newCode, signedMessage, pubKey: publicKey }
      : { address, newCode, signedMessage, pubKey: publicKey, timestamp };

    await simpleFetch(`${indexerUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    logInfo('updateReferralCode', {
      address,
      newCode,
      endpoint,
      isKeplr,
      chainId,
      network,
    });

    track(AnalyticsEvents.AffiliateReferralCodeUpdated({ newCode }));
  } catch (error) {
    log('updateReferralCode', error);
    throw error;
  } finally {
    await appQueryClient.invalidateQueries({ queryKey: ['affiliateMetadata'] });
  }
};

const extractApiErrorMessage = async (error: any): Promise<string | null> => {
  try {
    const errorData = await error.response.json();
    return errorData?.errors?.[0]?.msg || null;
  } catch {
    return null;
  }
};

const getStringKeyForReferralError = (message: string): string | null => {
  const errorMappings: Record<string, string> = {
    'Referral code already exists': STRING_KEYS.REFERRAL_CODE_TAKEN_ERROR,
  };

  return errorMappings[message] ?? null;
};

export const parseReferralCodeError = async (error: unknown): Promise<string> => {
  if (!isSimpleFetchError(error)) {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  const apiMessage = await extractApiErrorMessage(error);
  if (!apiMessage) {
    log('parseReferralCodeError', error);
    return STRING_KEYS.SOMETHING_WENT_WRONG;
  }

  const stringKey = getStringKeyForReferralError(apiMessage);
  if (!stringKey) {
    log('parseReferralCodeError', error);
    return STRING_KEYS.SOMETHING_WENT_WRONG;
  }

  return stringKey;
};
