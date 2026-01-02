import type { ComponentRef, FC } from 'react';
import { useRef, useState } from 'react';
import { type Address, safeAddress } from 'fuel-ts-sdk';
import { FormButton, FormGroup, FormInput, FormLabel } from '@/layouts/dashboard-layout';

type WalletAddressFormProps = {
  onSubmit: (address: Address) => Promise<void>;
};

export const WalletAddressForm: FC<WalletAddressFormProps> = ({ onSubmit }) => {
  const inputRef = useRef<ComponentRef<'input'>>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    const validatedAddress = safeAddress(inputRef.current?.value);
    if (!validatedAddress) return;

    setIsLoading(true);
    onSubmit(validatedAddress).finally(() => setIsLoading(false));
  }

  return (
    <FormGroup>
      <FormLabel>Wallet Address</FormLabel>
      <FormInput
        ref={inputRef}
        placeholder="0x..."
        defaultValue="0xc2833c4eae8a3b056a6f21a04d1a176780d5dc9df621270c41bec86a90c3d770"
      />
      <FormButton onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Get Positions'}
      </FormButton>
    </FormGroup>
  );
};
