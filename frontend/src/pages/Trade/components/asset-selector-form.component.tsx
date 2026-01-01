import type { ComponentRef, FC } from 'react';
import { useRef, useState } from 'react';
import { type AssetId, assetId, safeAddress } from 'fuel-ts-sdk';
import { FormButton, FormGroup, FormInput, FormLabel } from '@/layouts/dashboard-layout';
import type { Promiseable } from '@/types/Promiseable';

type AssetSelectorFormProps = {
  onSubmit: (asset: AssetId) => Promiseable<void>;
  defaultValue?: string;
};

export const AssetSelectorForm: FC<AssetSelectorFormProps> = ({ onSubmit, defaultValue }) => {
  const inputRef = useRef<ComponentRef<'input'>>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    const inputValue = inputRef.current?.value?.trim();
    if (!inputValue) return;

    const validatedAsset = safeAddress(inputValue);
    if (!validatedAsset) {
      alert('Invalid asset ID format');
      return;
    }

    setIsLoading(true);
    try {
      const asset = assetId(validatedAsset);
      await onSubmit(asset);
    } catch (error) {
      console.error('Failed to load asset:', error);
      alert('Failed to fetch candle data for this asset');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <FormGroup>
      <FormLabel>Asset ID</FormLabel>
      <FormInput ref={inputRef} placeholder="0x..." defaultValue={defaultValue} />
      <FormButton onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Load Asset'}
      </FormButton>
    </FormGroup>
  );
};
