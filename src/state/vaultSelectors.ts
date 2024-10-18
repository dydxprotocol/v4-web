import { RootState } from './_store';
import { createAppSelector } from './appTypes';

export const getVaultForm = (s: RootState) => s.vaults.vaultForm;

export const selectVaultFormStateExceptAmount = createAppSelector(
  [
    (state) => state.vaults.vaultForm.operation,
    (state) => state.vaults.vaultForm.slippageAck,
    (state) => state.vaults.vaultForm.termsAck,
    (state) => state.vaults.vaultForm.confirmationStep,
  ],
  (operation, slippageAck, termsAck, confirmationStep) => ({
    operation,
    slippageAck,
    termsAck,
    confirmationStep,
  })
);
