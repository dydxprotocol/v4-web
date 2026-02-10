import { getLazyLocalWallet } from '@/bonsai/lib/lazyDynamicLibs';
import { logBonsaiError } from '@/bonsai/logs';
import {
  BECH32_PREFIX,
  NOBLE_BECH32_PREFIX,
  onboarding as OnboardingHelper,
  type LocalWallet,
} from '@dydxprotocol/v4-client-js';
import { OfflineAminoSigner, OfflineDirectSigner } from '@keplr-wallet/types';
import { Keypair } from '@solana/web3.js';

import { OnboardingState } from '@/constants/account';
import { getNobleChainId } from '@/constants/graz';
import {
  ConnectorType,
  DydxAddress,
  PrivateInformation,
  WalletNetworkType,
  type WalletInfo,
} from '@/constants/wallets';

import { convertBech32Address } from '@/lib/addressUtils';
import { hdKeyManager } from '@/lib/hdKeyManager';
import { sleep } from '@/lib/timeUtils';

import { deriveSolanaKeypairFromMnemonic } from '../solanaWallet';
import { dydxPersistedWalletService } from '../wallet/dydxPersistedWalletService';

export interface SourceAccount {
  address?: string;
  chain?: WalletNetworkType;
  walletInfo?: WalletInfo;
}

export interface OnboardingContext {
  sourceAccount: SourceAccount;
  hasLocalDydxWallet: boolean;
  isConnectedGraz?: boolean;
  authenticated?: boolean;
  ready?: boolean;
}

export type WalletDerivationResult =
  | {
      wallet?: undefined;
      nobleWallet?: undefined;
      solanaKeypair?: undefined;
      hdKey?: PrivateInformation;
      onboardingState: OnboardingState;
      error?: string;
    }
  | {
      wallet: LocalWallet;
      nobleWallet: LocalWallet;
      solanaKeypair: Keypair | undefined;
      hdKey?: PrivateInformation;
      onboardingState: OnboardingState;
      error?: string;
    };

class OnboardingSupervisor {
  /**
   * Import wallet from private key
   * Called directly from ImportPrivateKey component
   */
  async handleWalletImport({
    mnemonic,
    handleWalletConnectionResult,
  }: {
    mnemonic: string;
    handleWalletConnectionResult: (result: WalletDerivationResult) => void;
  }): Promise<{ success: true } | { success: false; error: string }> {
    try {
      const LocalWallet = await getLazyLocalWallet();

      // Create wallets from private key
      const wallet = await LocalWallet.fromMnemonic(mnemonic, BECH32_PREFIX);
      const nobleWallet = await LocalWallet.fromMnemonic(mnemonic, NOBLE_BECH32_PREFIX);
      const solanaKeypair = deriveSolanaKeypairFromMnemonic(mnemonic);

      if (!wallet.address || !nobleWallet.address) {
        logBonsaiError('OnboardingSupervisor', 'local wallet is missing address', {
          error: new Error('Could not derive a local wallet from imported recovery phrase'),
        });
        return {
          success: false,
          error: 'Could not derive a local wallet from imported recovery phrase',
        };
      }

      const walletConnectionResult: WalletDerivationResult = {
        wallet,
        nobleWallet,
        solanaKeypair,
        onboardingState: OnboardingState.AccountConnected,
      };

      handleWalletConnectionResult(walletConnectionResult);

      // Store the recovery phrase in SecureStorage
      await dydxPersistedWalletService.secureStorePhrase(mnemonic);

      return {
        success: true,
      };
    } catch (error) {
      logBonsaiError('OnboardingSupervisor', 'handleWalletImport failed', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import private key',
      };
    }
  }

  /**
   * Derive dYdX wallet from signature using DydxWalletService
   * Used for EVM, Solana, and Turnkey wallets
   */
  private async deriveWalletFromSignature(
    signature: string,
    getWalletFromSignature: (params: { signature: string }) => Promise<{
      wallet: LocalWallet;
      nobleWallet: LocalWallet;
      mnemonic: string;
      privateKey: Uint8Array | null;
      publicKey: Uint8Array | null;
    }>
  ): Promise<{
    wallet: LocalWallet;
    nobleWallet: LocalWallet;
    solanaKeypair: Keypair;
    hdKey: PrivateInformation;
  }> {
    const { wallet, nobleWallet, mnemonic, privateKey, publicKey } = await getWalletFromSignature({
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

    const solanaKeypair = deriveSolanaKeypairFromMnemonic(mnemonic);
    hdKeyManager.setHdkey(wallet.address, hdKey);
    await dydxPersistedWalletService.secureStorePhrase(mnemonic);

    return { wallet, nobleWallet, solanaKeypair, hdKey };
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
    signMessageAsync: (requestNumber: 1 | 2) => Promise<string>;
    getWalletFromSignature: (params: { signature: string }) => Promise<{
      wallet: LocalWallet;
      mnemonic: string;
      nobleWallet: LocalWallet;
      privateKey: Uint8Array | null;
      publicKey: Uint8Array | null;
    }>;
    checkPreviousTransactions: (dydxAddress: DydxAddress) => Promise<boolean>;
    handleWalletConnectionResult: (result: WalletDerivationResult) => void;
  }): Promise<
    | {
        success: true;
      }
    | { success: false; error: string; isDeterminismError?: boolean }
  > {
    const {
      signMessageAsync,
      getWalletFromSignature,
      checkPreviousTransactions,
      handleWalletConnectionResult,
    } = params;

    try {
      // Step 1: Get first signature and derive wallet
      const firstSignature = await signMessageAsync(1);
      const { wallet, nobleWallet, mnemonic, privateKey, publicKey } = await getWalletFromSignature(
        {
          signature: firstSignature,
        }
      );

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

      // Step 4: Persist to SecureStorage
      await dydxPersistedWalletService.secureStorePhrase(mnemonic);

      // Step 5: Set up hdKey
      const hdKey: PrivateInformation = {
        mnemonic,
        privateKey,
        publicKey,
      };

      hdKeyManager.setHdkey(wallet.address, hdKey);

      // Step 6: Derive Solana keypair
      const solanaKeypair = deriveSolanaKeypairFromMnemonic(mnemonic);

      const walletDerivationResult: WalletDerivationResult = {
        wallet,
        nobleWallet,
        solanaKeypair,
        hdKey,
        onboardingState: OnboardingState.AccountConnected,
      };

      handleWalletConnectionResult(walletDerivationResult);

      return {
        success: true,
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
      const storedPhrase = await dydxPersistedWalletService.exportPhrase();
      if (!storedPhrase) {
        return null;
      }

      const LocalWallet = await getLazyLocalWallet();
      const wallet = await LocalWallet.fromMnemonic(storedPhrase, BECH32_PREFIX);
      const nobleWallet = await LocalWallet.fromMnemonic(storedPhrase, NOBLE_BECH32_PREFIX);
      const solanaKeypair = deriveSolanaKeypairFromMnemonic(storedPhrase);

      const { privateKey, publicKey } = OnboardingHelper.deriveHDKeyFromMnemonic(storedPhrase);

      const hdKey: PrivateInformation = {
        mnemonic: storedPhrase,
        privateKey,
        publicKey,
      };

      return {
        wallet,
        nobleWallet,
        solanaKeypair,
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
      nobleWallet: LocalWallet;
      mnemonic: string;
      privateKey: Uint8Array | null;
      publicKey: Uint8Array | null;
    }>;
    signMessageAsync: () => Promise<string>;
    getCosmosOfflineSigner?: (
      chainId: string
    ) => Promise<(OfflineAminoSigner & OfflineDirectSigner) | undefined>;
    selectedDydxChainId?: string;
  }): Promise<WalletDerivationResult> {
    const {
      context,
      getWalletFromSignature,
      signMessageAsync,
      getCosmosOfflineSigner,
      selectedDydxChainId,
    } = params;
    const { sourceAccount, hasLocalDydxWallet, isConnectedGraz, authenticated, ready } = context;

    try {
      // ------ Restore from SecureStorage ------ //
      // Check for persisted session before processing wallet connections
      if (dydxPersistedWalletService.hasStoredWallet()) {
        const restored = await this.restoreFromSecureStorage();

        if (restored) {
          return restored;
        }
      }

      // ------ Import Flow ------ //
      // Import is handled directly via handleWalletImport(), not through this flow
      if (sourceAccount.walletInfo?.connectorType === ConnectorType.Import) {
        throw new Error('Import flow is handled in useAccounts.tsx');
      }

      // ------ Turnkey Flow ------ //
      if (sourceAccount.walletInfo?.connectorType === ConnectorType.Turnkey) {
        return await this.handleTurnkeyFlow({
          hasLocalDydxWallet,
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
          signMessageAsync,
        });
      }

      // ------ Evm Flow ------ //
      if (sourceAccount.chain === WalletNetworkType.Evm) {
        return await this.handleEvmFlow({
          sourceAccount,
          hasLocalDydxWallet,
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
   * Turnkey is an embedded wallet managed entirely by TurnkeyAuthProvider
   * Signing is done via Turnkey SDK, persistence via setWalletFromTurnkeySignature()
   * OnboardingSupervisor only validates state
   */
  private async handleTurnkeyFlow(params: {
    hasLocalDydxWallet: boolean;
  }): Promise<WalletDerivationResult> {
    const { hasLocalDydxWallet } = params;

    // If wallet already exists (restored from SecureStorage or set by TurnkeyAuthProvider)
    if (hasLocalDydxWallet) {
      return {
        onboardingState: OnboardingState.AccountConnected,
      };
    }

    // Wallet is being set up by TurnkeyAuthProvider
    // Return Disconnected until TurnkeyAuthProvider completes the flow
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
    const LocalWallet = await getLazyLocalWallet();

    // Create dYdX test wallet
    const wallet = new LocalWallet();
    wallet.address = sourceAccount.address!;

    // Create Noble test wallet with bech32 conversion
    const nobleWallet = new LocalWallet();
    nobleWallet.address = convertBech32Address({
      address: sourceAccount.address!,
      bech32Prefix: NOBLE_BECH32_PREFIX,
    });

    return {
      wallet,
      nobleWallet,
      solanaKeypair: undefined,
      // Test wallets don't have hdKey material
      onboardingState: OnboardingState.AccountConnected,
    };
  }

  /**
   * Handle Cosmos wallet flow
   */
  private async handleCosmosFlow(params: {
    getCosmosOfflineSigner?: (
      chainId: string
    ) => Promise<(OfflineAminoSigner & OfflineDirectSigner) | undefined>;
    selectedDydxChainId?: string;
    signMessageAsync: () => Promise<string>;
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
      const nobleOfflineSigner = await getCosmosOfflineSigner(getNobleChainId());

      if (dydxOfflineSigner && nobleOfflineSigner) {
        const wallet = await (await getLazyLocalWallet()).fromOfflineSigner(dydxOfflineSigner);
        const nobleWallet = await (
          await getLazyLocalWallet()
        ).fromOfflineSigner(nobleOfflineSigner);

        return {
          wallet,
          nobleWallet,
          solanaKeypair: undefined,
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
    authenticated?: boolean;
    ready?: boolean;
    signMessageAsync: () => Promise<string>;
    getWalletFromSignature: (params: { signature: string }) => Promise<{
      wallet: LocalWallet;
      nobleWallet: LocalWallet;
      mnemonic: string;
      privateKey: Uint8Array | null;
      publicKey: Uint8Array | null;
    }>;
  }): Promise<WalletDerivationResult> {
    const {
      sourceAccount,
      hasLocalDydxWallet,
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

    // Privy flow - needs authentication
    if (sourceAccount.walletInfo?.connectorType === ConnectorType.Privy && authenticated && ready) {
      try {
        // Give Privy time to finish auth flow
        await sleep();
        const signature = await signMessageAsync();
        const { wallet, nobleWallet, solanaKeypair, hdKey } = await this.deriveWalletFromSignature(
          signature,
          getWalletFromSignature
        );

        return {
          wallet,
          nobleWallet,
          solanaKeypair,
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
    getWalletFromSignature: any;
    signMessageAsync?: () => Promise<string>;
  }): Promise<WalletDerivationResult> {
    const { hasLocalDydxWallet } = params;

    // If wallet already exists (restored from SecureStorage), just set state
    if (hasLocalDydxWallet) {
      return {
        onboardingState: OnboardingState.AccountConnected,
      };
    }

    // Wallet connected but waiting for signature
    return {
      onboardingState: OnboardingState.WalletConnected,
    };
  }
}

export const onboardingManager = new OnboardingSupervisor();
