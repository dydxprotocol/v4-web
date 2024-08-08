import { useCallback, useEffect, useState } from 'react';

import { PublicKey, VersionedTransaction } from '@solana/web3.js';

export function usePhantomWallet() {
  const [solAddress, setSolAddress] = useState('');

  const connect = useCallback(async (): Promise<string> => {
    const resp = await (window as any).phantom.solana.connect();
    const pubkey = resp.publicKey.toBase58();
    setSolAddress(pubkey);
    return pubkey;
  }, []);

  const disconnect = useCallback(() => {
    setSolAddress('');
  }, []);

  useEffect(() => {
    (window as any).phantom?.solana?.on('accountChanged', (publicKey: PublicKey) => {
      if (publicKey) {
        // Set new public key and continue as usual
        setSolAddress(publicKey.toBase58());
      } else {
        connect().then((address) => setSolAddress(address));
      }
    });
    return () => {
      (window as any).phantom?.solana?.off('accountChanged');
    };
  }, [connect]);

  const signMessage = useCallback(async (message: string): Promise<Uint8Array> => {
    const resp: {
      signature: Uint8Array;
    } = await (window as any).phantom.solana.signMessage(new TextEncoder().encode(message));
    return resp.signature;
  }, []);

  const signTransaction = useCallback(async (txBytes: Uint8Array): Promise<string> => {
    const resp: { signature: string } = await (window as any).phantom.solana.signAndSendTransaction(
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
