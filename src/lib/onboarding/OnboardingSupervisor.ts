import { getLazyLocalWallet } from '@/bonsai/lib/lazyDynamicLibs';
import { logBonsaiError } from '@/bonsai/logs';
import { BECH32_PREFIX, type LocalWallet } from '@dydxprotocol/v4-client-js';

import { OnboardingState } from '@/constants/account';
import {
  ConnectorType,
  DydxAddress,
  PrivateInformation,
  WalletNetworkType,
  type WalletInfo,
} from '@/constants/wallets';

import { hdKeyManager } from '@/lib/hdKeyManager';
import { sleep } from '@/lib/timeUtils';

import { dydxWalletService } from '../wallet/dydxWalletService';

export interface SourceAccount {
  address?: string;
  chain?: WalletNetworkType;
  walletInfo?: WalletInfo;
}

export interface OnboardingContext {
  sourceAccount: SourceAccount;
  hasLocalDydxWallet: boolean;
  blockedGeo: boolean;
  isConnectedGraz?: boolean;
  authenticated?: boolean;
  ready?: boolean;
}

export interface WalletDerivationResult {
  wallet?: LocalWallet;
  hdKey?: PrivateInformation;
  onboardingState: OnboardingState;
  error?: string;
}

class OnboardingSupervisor {
  /**
   * Derive dYdX wallet from signature using DydxWalletService
   * Used for EVM, Solana, and Turnkey wallets
   */
  private async deriveWalletFromSignature(
    signature: string,
    getWalletFromSignature: (params: { signature: string }) => Promise<{
      wallet: LocalWallet;
      mnemonic: string;
      privateKey: Uint8Array | null;
      publicKey: Uint8Array | null;
    }>
  ): Promise<{ wallet: LocalWallet; hdKey: PrivateInformation }> {
    const { wallet, mnemonic, privateKey, publicKey } = await getWalletFromSignature({
      signature,
    });

    if (!privateKey || !publicKey) {
      throw new Error('Failed to derive wallet from signature');
    }

    const hdKey: PrivateInformation = {
      mnemonic,
      privateKey,
      publicKey,
    };

    hdKeyManager.setHdkey(wallet.address, hdKey);
    await dydxWalletService.deriveFromSignature(signature);

    return { wallet, hdKey };
  }

  /**
   * Derive keys with determinism check for first-time users
   * Ensures wallets support deterministic signing by requesting two signatures
   *
   * @param signMessageAsync - Function to sign a message
   * @param getWalletFromSignature - Function to derive wallet from signature
   * @param checkPreviousTransactions - Function to check if user has transaction history
   * @returns Wallet derivation result with determinism validation
   */
  async deriveKeysWithDeterminismCheck(params: {
    signMessageAsync: (requestNumber: number) => Promise<string>;
    getWalletFromSignature: (params: { signature: string }) => Promise<{
      wallet: LocalWallet;
      mnemonic: string;
      privateKey: Uint8Array | null;
      publicKey: Uint8Array | null;
    }>;
    checkPreviousTransactions: (dydxAddress: DydxAddress) => Promise<boolean>;
  }): Promise<
    | { success: true; wallet: LocalWallet; hdKey: PrivateInformation; isNewUser: boolean }
    | { success: false; error: string; isDeterminismError?: boolean }
  > {
    const { signMessageAsync, getWalletFromSignature, checkPreviousTransactions } = params;

    try {
      // Step 1: Get first signature and derive wallet
      const firstSignature = await signMessageAsync(1);
      const { wallet, mnemonic, privateKey, publicKey } = await getWalletFromSignature({
        signature: firstSignature,
      });

      if (!privateKey || !publicKey || !wallet.address) {
        return {
          success: false,
          error: 'Failed to derive wallet from signature',
        };
      }

      // Step 2: Check for previous transactions
      const hasPreviousTransactions = await checkPreviousTransactions(
        wallet.address as DydxAddress
      );

      // Step 3: For new users, ensure determinism with second signature
      if (!hasPreviousTransactions) {
        const secondSignature = await signMessageAsync(2);

        if (firstSignature !== secondSignature) {
          return {
            success: false,
            error:
              'Your wallet does not support deterministic signing. Please switch to a different wallet provider.',
            isDeterminismError: true,
          };
        }
      }

      // Step 4: Persist to SecureStorage (replaces old encrypted signature approach)
      await dydxWalletService.deriveFromSignature(firstSignature);

      // Step 5: Set up hdKey
      const hdKey: PrivateInformation = {
        mnemonic,
        privateKey,
        publicKey,
      };

      hdKeyManager.setHdkey(wallet.address, hdKey);

      return {
        success: true,
        wallet,
        hdKey,
        isNewUser: !hasPreviousTransactions,
      };
    } catch (error) {
      logBonsaiError('OnboardingSupervisor', 'deriveKeysWithDeterminismCheck failed', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Restore wallet from SecureStorage if available
   * Called at the start of handleWalletConnection to check for persisted session
   */
  private async restoreFromSecureStorage(): Promise<WalletDerivationResult | null> {
    try {
      const storedPrivateKey = await dydxWalletService.exportPrivateKey();
      if (!storedPrivateKey) {
        return null;
      }

      const LocalWallet = await getLazyLocalWallet();
      const wallet = await LocalWallet.fromPrivateKey(storedPrivateKey, BECH32_PREFIX);

      const hdKey: PrivateInformation = {
        mnemonic: '',
        privateKey: Buffer.from(storedPrivateKey, 'hex'),
        publicKey: null,
      };

      return {
        wallet,
        hdKey,
        onboardingState: OnboardingState.AccountConnected,
      };
    } catch (error) {
      logBonsaiError('OnboardingSupervisor', 'Failed to restore from SecureStorage', { error });
      return null;
    }
  }

  /**
   * Handles all wallet type flows and determines next onboarding state
   */
  async handleWalletConnection(params: {
    context: OnboardingContext;
    getWalletFromSignature: (params: { signature: string }) => Promise<{
      wallet: LocalWallet;
      mnemonic: string;
      privateKey: Uint8Array | null;
      publicKey: Uint8Array | null;
    }>;
    signMessageAsync?: () => Promise<string>;
    getCosmosOfflineSigner?: (chainId: string) => Promise<any>;
    selectedDydxChainId?: string;
  }): Promise<WalletDerivationResult> {
    const {
      context,
      getWalletFromSignature,
      signMessageAsync,
      getCosmosOfflineSigner,
      selectedDydxChainId,
    } = params;
    const { sourceAccount, hasLocalDydxWallet, blockedGeo, isConnectedGraz, authenticated, ready } =
      context;

    try {
      // ------ Restore from SecureStorage ------ //
      // Check for persisted session before processing wallet connections
      if (dydxWalletService.hasStoredWallet() && !blockedGeo) {
        const restored = await this.restoreFromSecureStorage();

        if (restored) {
          return restored;
        }
      }

      // ------ Turnkey Flow ------ //
      if (sourceAccount.walletInfo?.connectorType === ConnectorType.Turnkey) {
        return await this.handleTurnkeyFlow({
          sourceAccount,
          hasLocalDydxWallet,
          blockedGeo,
          getWalletFromSignature,
          signMessageAsync,
        });
      }

      // ------ Impersonate Wallet Flow ------ //
      if (sourceAccount.walletInfo?.connectorType === ConnectorType.Test) {
        return await this.handleTestWalletFlow(sourceAccount);
      }

      // ------ Cosmos Flow ------ //
      if (sourceAccount.chain === WalletNetworkType.Cosmos && isConnectedGraz) {
        return await this.handleCosmosFlow({
          getCosmosOfflineSigner,
          selectedDydxChainId,
        });
      }

      // ------ Evm Flow ------ //
      if (sourceAccount.chain === WalletNetworkType.Evm) {
        return await this.handleEvmFlow({
          sourceAccount,
          hasLocalDydxWallet,
          blockedGeo,
          authenticated,
          ready,
          signMessageAsync,
          getWalletFromSignature,
        });
      }

      // ------ Solana Flow ------ //
      if (sourceAccount.chain === WalletNetworkType.Solana) {
        return await this.handleSolanaFlow({
          sourceAccount,
          hasLocalDydxWallet,
          blockedGeo,
          getWalletFromSignature,
          signMessageAsync,
        });
      }

      return {
        onboardingState: OnboardingState.Disconnected,
      };
    } catch (error) {
      logBonsaiError('OnboardingSupervisor', 'handleWalletConnection failed', { error });
      return {
        onboardingState: OnboardingState.Disconnected,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle Turnkey wallet flow
   * Turnkey is an embedded wallet - no WalletConnected state, only AccountConnected or Disconnected
   */
  private async handleTurnkeyFlow(params: {
    sourceAccount: SourceAccount;
    hasLocalDydxWallet: boolean;
    blockedGeo: boolean;
    getWalletFromSignature: (params: { signature: string }) => Promise<{
      wallet: LocalWallet;
      mnemonic: string;
      privateKey: Uint8Array | null;
      publicKey: Uint8Array | null;
    }>;
    signMessageAsync?: () => Promise<string>;
  }): Promise<WalletDerivationResult> {
    const { hasLocalDydxWallet, blockedGeo, getWalletFromSignature, signMessageAsync } = params;

    // If wallet already exists (restored from SecureStorage), just set state
    if (hasLocalDydxWallet) {
      return {
        onboardingState: OnboardingState.AccountConnected,
      };
    }

    // If not geo-blocked, derive wallet from signature
    if (!blockedGeo && signMessageAsync) {
      try {
        const signature = await signMessageAsync();
        const { wallet, hdKey } = await this.deriveWalletFromSignature(
          signature,
          getWalletFromSignature
        );

        return {
          wallet,
          hdKey,
          onboardingState: OnboardingState.AccountConnected,
        };
      } catch (error) {
        logBonsaiError('OnboardingSupervisor', 'Turnkey signing failed', { error });
        return {
          onboardingState: OnboardingState.Disconnected,
          error: 'Failed to sign with Turnkey',
        };
      }
    }

    // No wallet and geo-blocked or can't sign - disconnected
    return {
      onboardingState: OnboardingState.Disconnected,
    };
  }

  /**
   * Handle test wallet flow
   */
  private async handleTestWalletFlow(
    sourceAccount: SourceAccount
  ): Promise<WalletDerivationResult> {
    const wallet = new (await getLazyLocalWallet())();
    wallet.address = sourceAccount.address!;

    return {
      wallet,
      // Test wallets don't have hdKey material
      onboardingState: OnboardingState.AccountConnected,
    };
  }

  /**
   * Handle Cosmos wallet flow
   */
  private async handleCosmosFlow(params: {
    getCosmosOfflineSigner?: (chainId: string) => Promise<any>;
    selectedDydxChainId?: string;
  }): Promise<WalletDerivationResult> {
    const { getCosmosOfflineSigner, selectedDydxChainId } = params;

    if (!getCosmosOfflineSigner || !selectedDydxChainId) {
      return {
        onboardingState: OnboardingState.Disconnected,
        error: 'Missing Cosmos dependencies',
      };
    }

    try {
      const dydxOfflineSigner = await getCosmosOfflineSigner(selectedDydxChainId);
      if (dydxOfflineSigner) {
        const wallet = await (await getLazyLocalWallet()).fromOfflineSigner(dydxOfflineSigner);

        return {
          wallet,
          // Cosmos wallets from offline signer don't expose hdKey material
          onboardingState: OnboardingState.AccountConnected,
        };
      }
    } catch (error) {
      logBonsaiError('OnboardingSupervisor', 'Cosmos wallet creation failed', { error });
    }

    return {
      onboardingState: OnboardingState.Disconnected,
      error: 'Failed to create Cosmos wallet',
    };
  }

  /**
   * Handle EVM wallet flow
   */
  private async handleEvmFlow(params: {
    sourceAccount: SourceAccount;
    hasLocalDydxWallet: boolean;
    blockedGeo: boolean;
    authenticated?: boolean;
    ready?: boolean;
    signMessageAsync?: () => Promise<string>;
    getWalletFromSignature: any;
  }): Promise<WalletDerivationResult> {
    const {
      sourceAccount,
      hasLocalDydxWallet,
      blockedGeo,
      authenticated,
      ready,
      signMessageAsync,
      getWalletFromSignature,
    } = params;

    // If wallet already exists (restored from SecureStorage), just set state
    if (hasLocalDydxWallet) {
      return {
        onboardingState: OnboardingState.AccountConnected,
      };
    }

    // If geo-blocked, stay in WalletConnected state
    if (blockedGeo) {
      return {
        onboardingState: OnboardingState.WalletConnected,
      };
    }

    // Privy flow - needs authentication
    if (sourceAccount.walletInfo?.connectorType === ConnectorType.Privy && authenticated && ready) {
      try {
        // Give Privy time to finish auth flow
        await sleep();
        const signature = await signMessageAsync!();
        const { wallet, hdKey } = await this.deriveWalletFromSignature(
          signature,
          getWalletFromSignature
        );

        return {
          wallet,
          hdKey,
          onboardingState: OnboardingState.AccountConnected,
        };
      } catch (error) {
        logBonsaiError('OnboardingSupervisor', 'Privy signing failed', { error });
        return {
          onboardingState: OnboardingState.WalletConnected,
          error: 'Failed to sign with Privy',
        };
      }
    }

    // Other EVM wallets - need to trigger signing flow in UI
    // Wallet connected but waiting for signature
    return {
      onboardingState: OnboardingState.WalletConnected,
    };
  }

  /**
   * Handle Solana wallet flow
   */
  private async handleSolanaFlow(params: {
    sourceAccount: SourceAccount;
    hasLocalDydxWallet: boolean;
    blockedGeo: boolean;
    getWalletFromSignature: any;
    signMessageAsync?: () => Promise<string>;
  }): Promise<WalletDerivationResult> {
    const { hasLocalDydxWallet, blockedGeo } = params;

    // If wallet already exists (restored from SecureStorage), just set state
    if (hasLocalDydxWallet) {
      return {
        onboardingState: OnboardingState.AccountConnected,
      };
    }

    // If geo-blocked, stay in WalletConnected state
    if (blockedGeo) {
      return {
        onboardingState: OnboardingState.WalletConnected,
      };
    }

    // Wallet connected but waiting for signature
    return {
      onboardingState: OnboardingState.WalletConnected,
    };
  }
}

// Export singleton instance
export const onboardingManager = new OnboardingSupervisor();
