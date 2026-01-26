import { type FC, useState } from 'react';
import { Contract, type JsonAbi } from 'fuels';
import { WalletContext } from '@/contexts/WalletContext';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { useRequiredContext } from '@/lib/useRequiredContext';
import * as styles from './MintButton.css';

export const MintButton: FC = () => {
  const trading = useTradingSdk();
  const wallet = useRequiredContext(WalletContext);
  const baseAsset = useSdkQuery(() => trading.getBaseAsset());
  const [isMinting, setIsMinting] = useState(false);

  const mint = async () => {
    if (!baseAsset?.contractId) throw new Error('No base asset contract loaded');

    const walletRef = await wallet.getCurrentAccount();
    if (!walletRef) throw new Error('Wallet not connected');

    setIsMinting(true);
    try {
      const token = new Contract(baseAsset.contractId, testnetTokenAbi, walletRef);

      const { gasUsed } = await token.functions.faucet().getTransactionCost();
      const gasLimit = gasUsed.mul('6').div('5').toString();

      const { waitForResult } = await token.functions.faucet().txParams({ gasLimit }).call();
      await waitForResult();
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <button
      onClick={mint}
      disabled={isMinting || !baseAsset?.contractId}
      css={[styles.mintButton, isMinting && styles.minting]}
    >
      {isMinting ? 'Minting...' : 'Mint USDC'}
    </button>
  );
};

const testnetTokenAbi: JsonAbi = {
  programType: 'contract',
  specVersion: '1.1',
  encodingVersion: '1',
  concreteTypes: [
    {
      type: '()',
      concreteTypeId: '2e38e77b22c314a449e91fafed92a43826ac6aa403ae6a8acb6cf58239fbaf5d',
    },
  ],
  metadataTypes: [],
  functions: [
    {
      name: 'faucet',
      inputs: [],
      output: '2e38e77b22c314a449e91fafed92a43826ac6aa403ae6a8acb6cf58239fbaf5d',
      attributes: [{ name: 'storage', arguments: ['read', 'write'] }],
    },
  ],
  loggedTypes: [],
  messagesTypes: [],
  configurables: [],
};
