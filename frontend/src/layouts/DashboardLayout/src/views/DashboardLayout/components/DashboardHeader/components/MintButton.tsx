import { type FC, useState } from 'react';
import { useSdk } from '@/lib/fuel-ts-sdk';
import * as styles from './MintButton.css';

export const MintButton: FC = () => {
  const sdk = useSdk();
  const [isMinting, setIsMinting] = useState(false);

  const mint = async () => {
    setIsMinting(true);
    try {
      await sdk.__extra.faucet();
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <button
      onClick={mint}
      disabled={isMinting}
      css={[styles.mintButton, isMinting && styles.minting]}
    >
      {isMinting ? 'Minting...' : 'Mint USDC'}
    </button>
  );
};
