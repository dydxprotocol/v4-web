import { useCallback, useRef, useState } from 'react';

import { PublicKey } from '@solana/web3.js';

export function usePhantomWallet() {
  const [solAddress, setSolAddress] = useState('');
  const hasListenersBeenRegistered = useRef(false);

  const connect = useCallback(async (): Promise<string> => {
    const resp = await (window as any).phantom.solana.connect();
    const pubkey = resp.publicKey.toBase58();
    setSolAddress(pubkey);
    // Register account change listeners on connect
    if (!hasListenersBeenRegistered.current) {
      hasListenersBeenRegistered.current = true;

      (window as any).phantom?.solana?.on('accountChanged', (publicKey: PublicKey) => {
        if (publicKey) {
          // Set new public key and continue as usual
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
    } = await (window as any).phantom.solana.signMessage(new TextEncoder().encode(message));
    return resp.signature;
  }, []);

  return {
    solAddress,
    connect,
    disconnect,
    signMessage,
  };
}
