import { useCallback, useMemo } from 'react';

import { useFunkitCheckout } from '@funkit/connect';

import { AnalyticsEvents } from '@/constants/analytics';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { StatsigFlags } from '@/constants/statsig';
import { EvmAddress } from '@/constants/wallets';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';
import { updateFunkitDeposit } from '@/state/funkitDeposits';

import { track } from '@/lib/analytics/analytics';
import { testFlags } from '@/lib/testFlags';

import { useAccounts } from './useAccounts';
import { useFlushFunkitTheme } from './useFlushFunkitTheme';
import { useStatsigGateValue } from './useStatsig';
import { useStringGetter } from './useStringGetter';

const TOKEN_SYMBOL = 'USDC';
const TOKEN_ICON_SRC = '/currencies/usdc.png';
const TOKEN_CONTRACT_CHAIN_ID = '1511490300';
const TOKEN_CONTRACT_ADDRESS = '0x8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5';
const CHECKOUT_EXPIRATION_MS = 35 * 60 * 1000; // 35 minutes
const DEFAULT_USDC_AMT = 0;

export function useFunkitBuyNobleUsdc() {
  const stringGetter = useStringGetter();
  const flushTheme = useFlushFunkitTheme();
  const dispatch = useAppDispatch();
  const { dydxAddress } = useAccounts();

  const showNewDepositFlow =
    useStatsigGateValue(StatsigFlags.ffDepositRewrite) || testFlags.showNewDepositFlow;

  const enableFunWithNewDepositFlow =
    useStatsigGateValue(StatsigFlags.ffEnableFunkitNew) &&
    showNewDepositFlow &&
    testFlags.showInstantDepositToggle;

  const config = useMemo(() => {
    return enableFunWithNewDepositFlow
      ? {
          onConfirmation: (checkoutId: string) => {
            // TODO: Supply remaining transfer event data once Funkit provides it
            track(AnalyticsEvents.TransferDeposit({ isFunkit: true }));
            dispatch(updateFunkitDeposit({ checkoutId, timestamp: Date.now() }));
          },
        }
      : {
          onConfirmation: (checkoutId: string) => {
            // TODO: Supply remaining transfer event data once Funkit provides it
            track(AnalyticsEvents.TransferDeposit({ isFunkit: true }));
            dispatch(updateFunkitDeposit({ checkoutId, timestamp: Date.now() }));
          },
          onDydxSwitch: () => {
            dispatch(openDialog(DialogTypes.Deposit({ depositType: 'standard' })));
          },
        };
  }, [dispatch, enableFunWithNewDepositFlow]);

  const { beginCheckout } = useFunkitCheckout(config);
  const startCheckout = useCallback(async () => {
    flushTheme();
    await beginCheckout({
      modalTitle: stringGetter({ key: STRING_KEYS.DEPOSIT }),
      iconSrc: TOKEN_ICON_SRC,
      targetChain: TOKEN_CONTRACT_CHAIN_ID,
      targetAsset: TOKEN_CONTRACT_ADDRESS as EvmAddress,
      targetAssetAmount: DEFAULT_USDC_AMT,
      targetAssetTicker: TOKEN_SYMBOL,
      checkoutItemTitle: TOKEN_SYMBOL,
      customRecipient: dydxAddress,
      expirationTimestampMs: CHECKOUT_EXPIRATION_MS,
    });
  }, [beginCheckout, dydxAddress, flushTheme, stringGetter]);
  return startCheckout;
}
