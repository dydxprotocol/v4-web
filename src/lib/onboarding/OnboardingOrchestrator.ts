/**
 * OnboardingOrchestrator
 *
 * Vanilla JS class that handles all onboarding business logic.
 * Replaces the complex useEffect logic in useAccounts.
 *
 * Design principles:
 * - No React hooks or dependencies
 * - Pure business logic, fully testable
 * - Returns wallet data rather than managing state directly
 * - Explicit inputs and outputs for each method
 *
 * Wallet storage strategy:
 * - All mnemonics stored in SecureStorage (Web Crypto API)
 * - No more encrypted signatures with static keys
 * - STORED: localDydxWallet mnemonic
 * - ON-DEMAND: Noble, Osmosis, Neutron wallets derived from mnemonic when needed
 */
import { getLazyLocalWallet } from '@/bonsai/lib/lazyDynamicLibs';
import { logBonsaiError } from '@/bonsai/logs';
import { NOBLE_BECH32_PREFIX, type LocalWallet } from '@dydxprotocol/v4-client-js';

import { OnboardingState } from '@/constants/account';
import { NEUTRON_BECH32_PREFIX, OSMO_BECH32_PREFIX } from '@/constants/graz';
import {
  ConnectorType,
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

export type SupportedCosmosChain = 'noble' | 'osmosis' | 'neutron';

export class OnboardingOrchestrator {
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
      logBonsaiError('OnboardingOrchestrator', 'handleWalletConnection failed', { error });
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
        logBonsaiError('OnboardingOrchestrator', 'Turnkey signing failed', { error });
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
      logBonsaiError('OnboardingOrchestrator', 'Cosmos wallet creation failed', { error });
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
        logBonsaiError('OnboardingOrchestrator', 'Privy signing failed', { error });
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
    const { hasLocalDydxWallet, blockedGeo, getWalletFromSignature, signMessageAsync } = params;

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

    // Derive from signature if available
    if (signMessageAsync) {
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
        logBonsaiError('OnboardingOrchestrator', 'Solana signing failed', { error });
        return {
          onboardingState: OnboardingState.WalletConnected,
          error: 'Failed to sign with Solana wallet',
        };
      }
    }

    // Wallet connected but waiting for signature
    return {
      onboardingState: OnboardingState.WalletConnected,
    };
  }

  /**
   * Derive a Cosmos wallet on-demand from mnemonic
   * Used for Noble, Osmosis, Neutron wallets when needed
   *
   * @param mnemonic - The mnemonic to derive from
   * @param chain - Which Cosmos chain wallet to derive
   * @returns LocalWallet for the specified chain
   */
  async deriveCosmosWallet(
    mnemonic: string,
    chain: SupportedCosmosChain
  ): Promise<LocalWallet | null> {
    try {
      const prefix = this.getCosmosPrefix(chain);
      const LazyLocalWallet = await getLazyLocalWallet();
      return await LazyLocalWallet.fromMnemonic(mnemonic, prefix);
    } catch (error) {
      logBonsaiError('OnboardingOrchestrator', `Failed to derive ${chain} wallet`, { error });
      return null;
    }
  }

  /**
   * Derive a Cosmos wallet from offline signer
   * Used when user has a native Cosmos wallet connected
   */
  async deriveCosmosWalletFromSigner(
    offlineSigner: any,
    chain: string
  ): Promise<LocalWallet | null> {
    try {
      const LazyLocalWallet = await getLazyLocalWallet();
      return await LazyLocalWallet.fromOfflineSigner(offlineSigner);
    } catch (error) {
      logBonsaiError('OnboardingOrchestrator', `Failed to derive ${chain} wallet from signer`, {
        error,
      });
      return null;
    }
  }

  /**
   * Get the Bech32 prefix for a Cosmos chain
   */
  private getCosmosPrefix(chain: SupportedCosmosChain): string {
    switch (chain) {
      case 'noble':
        return NOBLE_BECH32_PREFIX;
      case 'osmosis':
        return OSMO_BECH32_PREFIX;
      case 'neutron':
        return NEUTRON_BECH32_PREFIX;
      default:
        throw new Error(`Unknown Cosmos chain: ${chain}`);
    }
  }
}

// Export singleton instance
export const onboardingOrchestrator = new OnboardingOrchestrator();
