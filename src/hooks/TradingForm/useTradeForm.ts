import { accountTransactionManager } from '@/bonsai/AccountTransactionSupervisor';
import { TradeFormType } from '@/bonsai/forms/trade/types';
import { PlaceOrderPayload } from '@/bonsai/forms/triggers/types';
import { isOperationSuccess } from '@/bonsai/lib/operationResult';
import { ErrorType } from '@/bonsai/lib/validationErrors';
import { logBonsaiInfo } from '@/bonsai/logs';

import { AnalyticsEvents } from '@/constants/analytics';
import { ComplianceStates } from '@/constants/compliance';

import { useTradeTypeOptions } from '@/views/forms/TradeForm/useTradeTypeOptions';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { getSubaccountId } from '@/state/accountInfoSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getCurrentMarketIdIfTradeable } from '@/state/currentMarketSelectors';
import { getCurrentMarketOraclePrice } from '@/state/perpetualsSelectors';
import { tradeFormActions } from '@/state/tradeForm';
import { getCurrentTradePageForm, getTradeFormSummary } from '@/state/tradeFormSelectors';

import { track } from '@/lib/analytics/analytics';
import { useDisappearingValue } from '@/lib/disappearingValue';
import { operationFailureToErrorParams } from '@/lib/errorHelpers';
import { isTruthy } from '@/lib/isTruthy';
import { purgeBigNumbers } from '@/lib/purgeBigNumber';

import { ConnectionErrorType, useApiState } from '../useApiState';
import { useComplianceState } from '../useComplianceState';
import { useOnOrderIndexed } from '../useOnOrderIndexed';
import { useStringGetter } from '../useStringGetter';

export enum TradeFormSource {
  TradeForm = 'TradeForm',
  SimpleTradeForm = 'SimpleTradeForm',
}

export const useTradeForm = ({
  source,
  onLastOrderIndexed,
}: {
  source: string;
  onLastOrderIndexed: () => void;
}) => {
  const [placeOrderError, setPlaceOrderError] = useDisappearingValue<string>();

  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const { connectionError } = useApiState();
  const { complianceState } = useComplianceState();

  const { setUnIndexedClientId, clientId: unIndexedClientId } =
    useOnOrderIndexed(onLastOrderIndexed);

  const { selectedTradeType } = useTradeTypeOptions({
    showAll: true,
    showAssetIcon: true,
  });

  const fullTradeFormState = useAppSelector(getTradeFormSummary);
  const currentInput = useAppSelector(getCurrentTradePageForm);
  const oraclePrice = useAppSelector(getCurrentMarketOraclePrice);
  const currentMarketId = useAppSelector(getCurrentMarketIdIfTradeable);
  const subaccountNumber = useAppSelector(getSubaccountId);
  const canAccountTrade = useAppSelector(calculateCanAccountTrade);

  const { errors: tradeErrors, summary } = fullTradeFormState;
  const tradeFormInputValues = summary.effectiveTrade;
  const { marketId } = tradeFormInputValues;
  const hasValidationErrors =
    !!tradeErrors.some((error) => error.type === ErrorType.error) || currentInput !== 'TRADE';

  const hasMissingData = subaccountNumber === undefined;

  const closeOnlyTradingUnavailable =
    complianceState === ComplianceStates.CLOSE_ONLY &&
    selectedTradeType !== TradeFormType.MARKET &&
    currentInput !== 'CLOSE_POSITION';

  const tradingUnavailable =
    closeOnlyTradingUnavailable ||
    complianceState === ComplianceStates.READ_ONLY ||
    connectionError === ConnectionErrorType.CHAIN_DISRUPTION;

  const shouldEnableTrade =
    canAccountTrade && !hasMissingData && !hasValidationErrors && !tradingUnavailable;
  const placeOrder = async ({
    onPlaceOrder,
    onSuccess,
    onFailure,
  }: {
    onPlaceOrder?: (payload: PlaceOrderPayload) => void;
    onSuccess?: () => void;
    onFailure?: () => void;
  } = {}) => {
    setPlaceOrderError(undefined);
    const payload = summary.tradePayload;
    if (payload == null || hasValidationErrors) {
      return;
    }
    onPlaceOrder?.(payload);
    dispatch(tradeFormActions.reset());
    logBonsaiInfo(source, 'attempting place order', {
      fullTradeFormState: purgeBigNumbers(fullTradeFormState),
    });
    track(
      AnalyticsEvents.TradePlaceOrderClick({
        ...payload,
        isClosePosition: false,
        isSimpleUi: source === 'SimpleTradeForm',
      })
    );
    const result = await accountTransactionManager.placeOrder(payload);
    if (isOperationSuccess(result)) {
      setUnIndexedClientId(payload.clientId.toString());
      onSuccess?.();
    } else {
      const errorParams = operationFailureToErrorParams(result);
      setPlaceOrderError(
        stringGetter({
          key: errorParams.errorStringKey,
          fallback: errorParams.errorMessage ?? '',
        })
      );
      onFailure?.();
    }
  };

  return {
    placeOrder,
    unIndexedClientId,
    placeOrderError,
    shouldEnableTrade,
    tradingUnavailable,
    hasValidationErrors,
    hasMarketData: isTruthy(oraclePrice) && currentMarketId === marketId,
  };
};
