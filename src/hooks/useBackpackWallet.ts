import { useCallback, useRef, useState } from 'react';

import { PublicKey, VersionedTransaction } from '@solana/web3.js';

export function useBackpackWallet() {
  const [solAddress, setSolAddress] = useState('');
  const hasListenersBeenRegistered = useRef(false);

  const connect = useCallback(async (): Promise<string> => {
    if (!window.backpack?.solana) {
      throw new Error('Backpack Solana not detected');
    }

    try {
      const resp = await (window as any).backpack.solana.connect();
      const pubkey = resp.publicKey.toBase58();
      setSolAddress(pubkey);

      if (!hasListenersBeenRegistered.current) {
        hasListenersBeenRegistered.current = true;

        (window as any).backpack?.solana?.on('accountChanged', (publicKey: PublicKey) => {
          if (publicKey && publicKey.toBase58() !== solAddress) {
            setSolAddress(publicKey.toBase58());
          } else {
            setSolAddress('');
            // connect().then((address) => setSolAddress(address));
          }
        });
      }
      return pubkey;
    } catch (error) {
      throw new Error('Failed to connect Backpack Solana');
    }
  }, []);

  const disconnect = useCallback(() => {
    setSolAddress('');
  }, []);

  const signMessage = useCallback(async (message: string): Promise<Uint8Array> => {
    const resp: {
      signature: Uint8Array;
    } = await (window as any).backpack.solana.signMessage(new TextEncoder().encode(message));
    return resp.signature;
  }, []);

  const signTransaction = useCallback(async (txBytes: Uint8Array): Promise<string> => {
    const resp: { signature: string } = await (
      window as any
    ).backpack.solana.signAndSendTransaction(VersionedTransaction.deserialize(txBytes));
    return resp.signature;
  }, []);

  return {
    connect,
    disconnect,
    signMessage,
    signTransaction,
    solAddress,
  };
}
