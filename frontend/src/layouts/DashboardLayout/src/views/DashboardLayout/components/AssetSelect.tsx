import type { FC } from 'react';
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import type { AssetId } from 'fuel-ts-sdk';
import { Select } from 'radix-ui';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import * as styles from './AssetSelect.css';

export const AssetSelect: FC = () => {
  const tradingSdk = useTradingSdk();

  const assets = useSdkQuery(tradingSdk.getAllAssets).filter((a) => !a.isBaseAsset);
  const watchedAsset = useSdkQuery(tradingSdk.getWatchedAsset);

  const watchAsset = (assetId: AssetId) => {
    tradingSdk.watchAsset(assetId);
  };

  return (
    <div>
      <Select.Root value={watchedAsset?.assetId ?? ''} onValueChange={watchAsset}>
        <Select.Trigger className={styles.selectTrigger()}>
          <Select.Value>{watchedAsset?.name}</Select.Value>
          <Select.Icon>
            <ChevronDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className={styles.selectContent} position="popper">
            <Select.Viewport>
              {assets.map((asset) => (
                <Select.Item
                  key={asset.assetId}
                  value={asset.assetId}
                  className={styles.selectItem()}
                >
                  <Select.ItemText>{asset.name}</Select.ItemText>
                  <Select.ItemIndicator className={styles.selectItemIndicator}>
                    <CheckIcon />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
};
