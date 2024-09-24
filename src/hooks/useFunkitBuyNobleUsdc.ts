import { useCallback, useMemo } from 'react';

import { useFunkitCheckout } from '@funkit/connect';

import { useAppDispatch } from '@/state/appTypes';

import { DialogTypes } from '@/constants/dialogs';
import { DepositType, resetDepositType, setDepositType } from '@/state/deposit';
import { closeDialog, openDialog } from '@/state/dialogs';
import { useAccounts } from './useAccounts';
import { useFunkitThemeListener } from './useFunkitThemeListener';

const TOKEN_SYMBOL = 'USDC';
const TOKEN_ICON_SRC = '/currencies/usdc.png';
const TOKEN_CONTRACT_CHAIN_ID = '1511490300';
const TOKEN_CONTRACT_ADDRESS = '0x8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5';
const CHECKOUT_EXPIRATION_MS = 3600000; // 1 hour (recommended)
const DEFAULT_USDC_AMT = 10;

export function useFunkitBuyNobleUsdc() {
  useFunkitThemeListener();
  const dispatch = useAppDispatch();
  const { dydxAddress } = useAccounts();
  const config = useMemo(
    () => ({
      onConfirmation: () => {
        // TODO: Handle the checkout confirmation (event listening / notification)
      },
      onDydxSwitch: () => {
        dispatch(setDepositType(DepositType.Standard));
        dispatch(openDialog(DialogTypes.Deposit()));
      },
    }),
    [dispatch]
  );
  const { beginCheckout } = useFunkitCheckout(config);
  const startCheckout = useCallback(async () => {
    await beginCheckout({
      modalTitle: 'Deposit',
      iconSrc: TOKEN_ICON_SRC,
      actionsParams: [],
      targetChain: TOKEN_CONTRACT_CHAIN_ID,
      targetAsset: TOKEN_CONTRACT_ADDRESS as `0x${string}`,
      targetAssetAmount: DEFAULT_USDC_AMT,
      targetAssetTicker: TOKEN_SYMBOL,
      checkoutItemTitle: TOKEN_SYMBOL,
      customRecipient: dydxAddress,
      expirationTimestampMs: CHECKOUT_EXPIRATION_MS,
    });
  }, [beginCheckout, dydxAddress]);
  return startCheckout;
}
