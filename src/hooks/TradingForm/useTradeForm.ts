import { useMemo } from 'react';

import { accountTransactionManager } from '@/bonsai/AccountTransactionSupervisor';
import { TradeFormInputData, TradeFormSummary, TradeFormType } from '@/bonsai/forms/trade/types';
import { PlaceOrderPayload } from '@/bonsai/forms/triggers/types';
import { isOperationSuccess } from '@/bonsai/lib/operationResult';
import { ErrorType, ValidationError } from '@/bonsai/lib/validationErrors';
import { logBonsaiInfo } from '@/bonsai/logs';
import { BonsaiCore } from '@/bonsai/ontology';

import { AnalyticsEvents } from '@/constants/analytics';
import { ComplianceStates } from '@/constants/compliance';

import { useTradeTypeOptions } from '@/views/forms/TradeForm/useTradeTypeOptions';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { getSubaccountId } from '@/state/accountInfoSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getCurrentMarketIdIfTradeable } from '@/state/currentMarketSelectors';
import { getCurrentMarketOraclePrice } from '@/state/perpetualsSelectors';
import { tradeFormActions } from '@/state/tradeForm';
import { getCurrentTradePageForm } from '@/state/tradeFormSelectors';

import { track } from '@/lib/analytics/analytics';
import { useDisappearingValue } from '@/lib/disappearingValue';
import { runFn } from '@/lib/do';
import { operationFailureToErrorParams } from '@/lib/errorHelpers';
import { isTruthy } from '@/lib/isTruthy';
import { purgeBigNumbers } from '@/lib/purgeBigNumber';

import { useAccounts } from '../useAccounts';
import { ConnectionErrorType, useApiState } from '../useApiState';
import { useComplianceState } from '../useComplianceState';
import { useOnOrderIndexed } from '../useOnOrderIndexed';
import { useStringGetter } from '../useStringGetter';
import { useSubaccount } from '../useSubaccount';

export enum TradeFormSource {
  ClosePositionForm = 'ClosePositionForm',
  SimpleCloseForm = 'SimpleCloseForm',
  SimpleTradeForm = 'SimpleTradeForm',
  TradeForm = 'TradeForm',
}

export const useTradeForm = ({
  source,
  fullFormSummary,
  onLastOrderIndexed,
}: {
  source: TradeFormSource;
  fullFormSummary:
    | {
        errors: ValidationError[];
        summary: TradeFormSummary;
        inputData?: undefined;
      }
    | {
        inputData: TradeFormInputData;
        summary: TradeFormSummary;
        errors: ValidationError[];
      };
  onLastOrderIndexed: () => void;
}) => {
  const [placeOrderError, setPlaceOrderError] = useDisappearingValue<string>();

  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const { connectionError } = useApiState();
  const { complianceState } = useComplianceState();
  const { updateLeverage } = useSubaccount();
  const { dydxAddress } = useAccounts();

  const { setUnIndexedClientId, clientId: unIndexedClientId } =
    useOnOrderIndexed(onLastOrderIndexed);

  const { selectedTradeType } = useTradeTypeOptions({
    showAll: true,
    showAssetIcon: true,
  });

  const currentInput = useAppSelector(getCurrentTradePageForm);
  const oraclePrice = useAppSelector(getCurrentMarketOraclePrice);
  const currentMarketId = useAppSelector(getCurrentMarketIdIfTradeable);
  const subaccountNumber = useAppSelector(getSubaccountId);
  const canAccountTrade = useAppSelector(calculateCanAccountTrade);
  const positions = useAppSelector(BonsaiCore.account.parentSubaccountPositions.data);

  const { errors: tradeErrors, summary, inputData } = fullFormSummary;
  const tradeFormInputValues = summary.effectiveTrade;
  const { marketId } = tradeFormInputValues;
  const isClosePosition = source === TradeFormSource.ClosePositionForm;
  const hasValidationErrors =
    !!tradeErrors.some((error) => error.type === ErrorType.error) ||
    (!isClosePosition && currentInput !== 'TRADE');

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

  const currentPosition = useMemo(() => {
    return positions?.find((p) => p.market === marketId);
  }, [positions, marketId]);

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
    const tradePayload = payload?.orderPayload;
    if (payload == null || tradePayload == null || hasValidationErrors) {
      return;
    }

    // We defer saving selected leverage when opening a new position here since the
    // subaccount being used for new isolated positions isn't known until the user presses
    // placeOrder. For existing positions, updating leverage is done through the dialog.
    runFn(() => {
      const impliedMarket = summary.accountDetailsAfter?.position?.market;
      if (impliedMarket === undefined) return;

      const positionSubaccountNumber = summary.accountDetailsAfter?.position?.subaccountNumber;
      const clobPairId = summary.tradePayload?.orderPayload?.clobPairId;
      const rawSelectedLeverage = inputData?.rawSelectedMarketLeverages[impliedMarket];
      const hasExistingPosition = currentPosition !== undefined;
      if (
        !hasExistingPosition &&
        positionSubaccountNumber !== undefined &&
        clobPairId !== undefined &&
        dydxAddress !== undefined &&
        rawSelectedLeverage !== undefined
      ) {
        // Fire and forget - don't await to keep order placement fast
        updateLeverage({
          senderAddress: dydxAddress,
          subaccountNumber: positionSubaccountNumber,
          clobPairId,
          leverage: rawSelectedLeverage,
        });
      }
    });

    onPlaceOrder?.(tradePayload);
    track(
      AnalyticsEvents.TradePlaceOrderClick({
        ...tradePayload,
        isClosePosition: source === TradeFormSource.ClosePositionForm,
        isSimpleUi: source === TradeFormSource.SimpleTradeForm,
        source,
        volume: tradePayload.size * tradePayload.price,
      })
    );
    dispatch(tradeFormActions.resetPrimaryInputs());
    logBonsaiInfo(
      source,
      source === TradeFormSource.ClosePositionForm
        ? 'attempting close position'
        : 'attempting place order',
      {
        fullTradeFormState: purgeBigNumbers(fullFormSummary),
      }
    );

    const result = await accountTransactionManager.placeCompoundOrder(payload, source);
    if (isOperationSuccess(result)) {
      setUnIndexedClientId(tradePayload.clientId.toString());
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
