import type { ComponentRef } from 'react';
import { useRef, useState } from 'react';
import { type Address, safeAddress } from 'fuel-ts-sdk';
import { NetworkSwitchContext } from '@/contexts/network-switch/network-switch.context';
import { getEnv } from '@/lib/env';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import * as styles from './Home.css';

const testNetUrl = 'https://starboard.squids.live/starboard-testnet@test2/api/graphql';
const localNodeUrl = getEnv('VITE_INDEXER_URL');

export default function Home() {
  const inputRef = useRef<ComponentRef<'input'>>(null);
  const [queriedAddress, setQueriedAddress] = useState<Address>();
  const tradingSdk = useTradingSdk();
  const heldPositions = useSdkQuery(() => tradingSdk.getAccountPositions(queriedAddress));

  const networkSwitch = useRequiredContext(NetworkSwitchContext);
  const currentNetwork = networkSwitch.getNetworkUrl();

  function switchToTestNet() {
    networkSwitch.changeNetworkUrl(testNetUrl);
  }
  function switchToLocalNode() {
    networkSwitch.changeNetworkUrl(localNodeUrl);
  }

  function fetchPositionsByAddress() {
    const queriedAddress = safeAddress(inputRef.current?.value);
    if (!queriedAddress) return;

    tradingSdk
      .fetchPositionsByAccount(
        // '0xc2833c4eae8a3b056a6f21a04d1a176780d5dc9df621270c41bec86a90c3d770'
        queriedAddress
      )
      .then(() => setQueriedAddress(queriedAddress));
  }

  return (
    <div css={styles.page}>
      <div css={styles.container}>
        <div css={styles.header}>
          <h1 css={styles.title}>Starboard</h1>
          <p css={styles.subtitle}>Decentralized perpetuals trading on Fuel</p>
        </div>

        <div css={styles.buttonContainer}>
          <button
            css={currentNetwork === testNetUrl ? styles.button : styles.buttonSecondary}
            onClick={switchToTestNet}
          >
            Testnet
          </button>
          <button
            css={currentNetwork === localNodeUrl ? styles.button : styles.buttonSecondary}
            onClick={switchToLocalNode}
          >
            Local node
          </button>
        </div>

        <h4 css={styles.statusTitle}>Indexer URL: {networkSwitch.getNetworkUrl()}</h4>

        <div css={styles.statusCard}>
          <div css={styles.formGroup}>
            <label css={styles.label}>
              Wallet Address{' '}
              {queriedAddress &&
                `(Current: ${queriedAddress.slice(0, 10)}...${queriedAddress.slice(-8)})`}
            </label>
            <input ref={inputRef} css={styles.input} placeholder="0x..." />
            <button css={styles.fetchButton} onClick={fetchPositionsByAddress}>
              Get Positions
            </button>
          </div>

          {heldPositions.length > 0 && (
            <div css={styles.positionsContainer}>
              {heldPositions.map((position) => {
                const isProfitable = position.pnlDelta.value > 0n;

                return (
                  <div key={position.id} css={styles.positionCard}>
                    <div css={styles.positionHeader}>
                      <span
                        css={[
                          styles.positionSide,
                          position.positionKey.isLong ? styles.longPosition : styles.shortPosition,
                        ]}
                      >
                        {position.positionKey.isLong ? 'LONG' : 'SHORT'}
                      </span>
                      <span css={styles.fieldValue}>
                        Asset: {position.positionKey.indexAssetId.slice(0, 8)}...
                      </span>
                    </div>

                    <div css={styles.positionGrid}>
                      <div css={styles.positionField}>
                        <span css={styles.fieldLabel}>Size</span>
                        <span css={styles.fieldValue}>{position.size.toFloat().toFixed(4)}</span>
                      </div>

                      <div css={styles.positionField}>
                        <span css={styles.fieldLabel}>Collateral</span>
                        <span css={styles.fieldValue}>
                          {position.collateralAmount.toFloat().toFixed(2)}
                        </span>
                      </div>

                      <div css={styles.positionField}>
                        <span css={styles.fieldLabel}>PnL</span>
                        <span
                          css={[
                            styles.fieldValue,
                            isProfitable ? styles.profitPositive : styles.profitNegative,
                          ]}
                        >
                          {isProfitable ? '+' : ''}
                          {position.pnlDelta.toFloat().toFixed(2)}
                        </span>
                      </div>

                      <div css={styles.positionField}>
                        <span css={styles.fieldLabel}>Realized PnL</span>
                        <span css={styles.fieldValue}>
                          {position.realizedPnl.toFloat().toFixed(2)}
                        </span>
                      </div>

                      <div css={styles.positionField}>
                        <span css={styles.fieldLabel}>Position Fee</span>
                        <span css={styles.fieldValue}>
                          {position.positionFee.toFloat().toFixed(4)}
                        </span>
                      </div>

                      <div css={styles.positionField}>
                        <span css={styles.fieldLabel}>Funding Rate</span>
                        <span css={styles.fieldValue}>
                          {position.fundingRate.toFloat().toFixed(6)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
