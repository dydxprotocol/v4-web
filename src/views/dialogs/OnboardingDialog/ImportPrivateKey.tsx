import { useState } from 'react';

import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';

// TODO: Localize
export const ImportPrivateKey = () => {
  const stringGetter = useStringGetter();
  const { importWallet } = useAccounts();
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [error, setError] = useState<string>();
  const [isImporting, setIsImporting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    if (!privateKey.trim()) return;

    setIsImporting(true);
    setError(undefined);

    const result = await importWallet(privateKey.trim());

    if (!result.success) {
      setError(result.error);
      setIsImporting(false);
    }
  };

  return (
    <$Container onSubmit={handleSubmit}>
      {error && (
        <AlertMessage type={AlertType.Error}>
          <h4>Error importing private key</h4>
          {error}
        </AlertMessage>
      )}

      <$InputContainer>
        <$Label>{stringGetter({ key: STRING_KEYS.PRIVATE_KEY })}</$Label>
        <$InputWrapper>
          <$Input
            type={showPrivateKey ? 'text' : 'password'}
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="Enter private key"
            autoFocus
            autoComplete="off"
          />
          <$ToggleButton
            type="button"
            onClick={() => setShowPrivateKey(!showPrivateKey)}
            aria-label={showPrivateKey ? 'Hide private key' : 'Show private key'}
          >
            <Icon iconName={showPrivateKey ? IconName.Hide : IconName.Show} />
          </$ToggleButton>
        </$InputWrapper>
        <$HelpText>Enter the private key of the Permissioned account to import it</$HelpText>
      </$InputContainer>

      <Button
        action={ButtonAction.Primary}
        size={ButtonSize.Base}
        type={ButtonType.Submit}
        state={{
          isDisabled: !privateKey.trim(),
          isLoading: isImporting,
        }}
      >
        Import Key
      </Button>
    </$Container>
  );
};

const $Container = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const $InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const $Label = styled.label`
  font: var(--font-base-medium);
  color: var(--color-text-2);
`;

const $InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const $Input = styled.input`
  width: 100%;
  padding: 0.75rem 3rem 0.75rem 1rem;
  font: var(--font-base-book);
  color: var(--color-text-2);
  background-color: var(--color-layer-5);
  border: 1px solid var(--color-layer-6);
  border-radius: 0.5rem;
  outline: none;
  transition: border-color 0.2s;

  &::placeholder {
    color: var(--color-text-0);
  }

  &:focus {
    border-color: var(--color-layer-7);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const $ToggleButton = styled.button`
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-0);
  transition: color 0.2s;

  &:hover {
    color: var(--color-text-1);
  }

  &:focus {
    outline: none;
  }

  --icon-size: 1rem;
`;

const $HelpText = styled.p`
  font: var(--font-small-book);
  color: var(--color-text-0);
  margin: 0;
`;
