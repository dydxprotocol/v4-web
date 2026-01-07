import { useCallback, useRef, useState } from 'react';

import { PublicKey, VersionedTransaction } from '@solana/web3.js';

export function useBackpackWallet() {
  const [solAddress, setSolAddress] = useState('');
  const hasListenersBeenRegistered = useRef(false);

  const connect = useCallback(async (): Promise<string> => {
    const resp = await (window as any).backpack.connect();
    const pubkey = resp.publicKey.toBase58();
    setSolAddress(pubkey);

    if (!hasListenersBeenRegistered.current) {
      hasListenersBeenRegistered.current = true;

      (window as any).backpack?.on('accountChanged', (publicKey: PublicKey) => {
        if (publicKey) {
          setSolAddress(publicKey.toBase58());
        } else {
          connect().then((address) => setSolAddress(address));
        }
      });
    }

    return pubkey;
  }, []);

  const disconnect = useCallback(() => {
    setSolAddress('');
  }, []);

  const signMessage = useCallback(async (message: string): Promise<Uint8Array> => {
    const resp: {
      signature: Uint8Array;
    } = await (window as any).backpack.signMessage(new TextEncoder().encode(message));
    return resp.signature;
  }, []);

  const signTransaction = useCallback(async (txBytes: Uint8Array): Promise<string> => {
    const resp: { signature: string } = await (window as any).backpack.signAndSendTransaction(
      VersionedTransaction.deserialize(txBytes)
    );
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
