import { useCallback, useState } from 'react';

import { logBonsaiError } from '@/bonsai/logs';
import { useTurnkey } from '@turnkey/sdk-react';
import styled, { css } from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { ConnectorType, WalletInfo, wallets, WalletType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useDisplayedWallets } from '@/hooks/useDisplayedWallets';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';
import { useTurnkeyAuth } from '@/providers/TurnkeyAuthProvider';

import breakpoints from '@/styles/breakpoints';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { FormInput } from '@/components/FormInput';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { Link } from '@/components/Link';
import { HorizontalSeparatorFiller } from '@/components/Separator';
import { WalletIcon } from '@/components/WalletIcon';

import { useAppSelector } from '@/state/appTypes';
import { AppTheme } from '@/state/appUiConfigs';
import { getAppTheme } from '@/state/appUiConfigsSelectors';

import { isValidEmail } from '@/lib/emailUtils';

import { AppleAuth } from './AuthButtons/AppleAuth';
import { GoogleAuth } from './AuthButtons/GoogleAuth';

export const SignIn = ({
  onDisplayChooseWallet,
  onChooseWallet,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSignInWithPasskey,
  onSubmitEmail,
}: {
  onChooseWallet: (wallet: WalletInfo) => void;
  onDisplayChooseWallet: () => void;
  onSignInWithPasskey: () => void;
  onSubmitEmail: ({ userEmail }: { userEmail: string }) => void;
}) => {
  const stringGetter = useStringGetter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { authIframeClient } = useTurnkey();
  const { signInWithOtp } = useTurnkeyAuth();
  const appTheme = useAppSelector(getAppTheme);
  const { tos, privacy } = useURLConfigs();
  const displayedWallets = useDisplayedWallets();
  const { selectedWallet, selectedWalletError } = useAccounts();

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);
      try {
        await signInWithOtp({ userEmail: email });
        onSubmitEmail({ userEmail: email });
      } catch (error) {
        logBonsaiError('SignIn', 'onSubmit error', error);
      } finally {
        setIsLoading(false);
      }
    },
    [email, onSubmitEmail, signInWithOtp]
  );

  const hasValidEmail = isValidEmail(email);

  const walletError = selectedWallet && selectedWalletError && (
    <$AlertMessage type={AlertType.Error}>
      <h4>
        {stringGetter({
          key: STRING_KEYS.COULD_NOT_CONNECT,
          params: {
            WALLET:
              selectedWallet.connectorType === ConnectorType.Injected
                ? selectedWallet.name
                : stringGetter({
                    key: wallets[selectedWallet.name as keyof typeof wallets].stringKey,
                  }),
          },
        })}
      </h4>
      {selectedWalletError}
    </$AlertMessage>
  );

  return (
    <form onSubmit={onSubmit} tw="flexColumn gap-1.25">
      <div tw="row gap-1">
        <GoogleAuth />
        <AppleAuth />
      </div>

      <div tw="flexColumn gap-0.75">
        <$EmailInput
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          placeholder={stringGetter({ key: STRING_KEYS.EMAIL_PLACEHOLDER })}
          type={InputType.Text}
          $hasValidEmail={hasValidEmail}
          $isLightMode={appTheme === AppTheme.Light}
          slotLeft={<$EmailIcon iconName={IconName.Email} />}
          slotRight={
            <Button
              tw="size-2 rounded-0.5"
              type={ButtonType.Submit}
              action={ButtonAction.Primary}
              size={ButtonSize.Small}
              state={{
                isDisabled: !hasValidEmail || authIframeClient == null,
                isLoading,
              }}
              css={{
                '--button-textColor': 'var(--color-layer-2)',
                '--button-disabled-backgroundColor': 'var(--color-layer-4)',
                '--button-border': 'none',
              }}
            >
              <Icon iconName={IconName.Arrow} />
            </Button>
          }
        />

        <div tw="row gap-0.5">
          <$HorizontalSeparatorFiller $isLightMode={appTheme === AppTheme.Light} />
          <span>{stringGetter({ key: STRING_KEYS.OR })}</span>
          <$HorizontalSeparatorFiller $isLightMode={appTheme === AppTheme.Light} />
        </div>

        {/* <$OtherOptionButton
          type={ButtonType.Button}
          action={ButtonAction.Base}
          size={ButtonSize.BasePlus}
          onClick={onSignInWithPasskey}
        >
          <div tw="row gap-0.5">
            <Icon iconName={IconName.Passkey} />
            {stringGetter({ key: STRING_KEYS.SIGN_IN_PASSKEY })}
          </div>

          <Icon tw="text-color-layer-7" iconName={IconName.ChevronRight} />
        </$OtherOptionButton> */}

        {displayedWallets
          .filter(
            (wallet) =>
              wallet.connectorType === ConnectorType.Injected ||
              wallet.name === WalletType.WalletConnect2 ||
              wallet.name === WalletType.Phantom
          )
          .map((wallet) => (
            <$OtherOptionButton
              key={wallet.name}
              type={ButtonType.Button}
              action={ButtonAction.Base}
              size={ButtonSize.BasePlus}
              onClick={() => onChooseWallet(wallet)}
            >
              <div tw="row gap-0.5">
                <WalletIcon wallet={wallet} />
                {wallet.connectorType === ConnectorType.Injected
                  ? wallet.name
                  : stringGetter({ key: wallets[wallet.name as keyof typeof wallets].stringKey })}
              </div>
            </$OtherOptionButton>
          ))}

        <$OtherOptionButton
          type={ButtonType.Button}
          action={ButtonAction.Base}
          size={ButtonSize.BasePlus}
          onClick={onDisplayChooseWallet}
        >
          <div tw="row gap-0.5">
            <Icon iconName={IconName.Wallet2} />
            {stringGetter({ key: STRING_KEYS.VIEW_MORE_WALLETS })}
          </div>

          <Icon tw="text-color-layer-7" iconName={IconName.ChevronRight} />
        </$OtherOptionButton>
      </div>

      {walletError}

      <span tw="text-center font-mini-book">
        {stringGetter({
          key: STRING_KEYS.TOS_SHORT,
          params: {
            TERMS_LINK: (
              <Link isAccent isInline href={tos}>
                {stringGetter({ key: STRING_KEYS.TERMS_OF_USE })}
              </Link>
            ),
            PRIVACY_POLICY_LINK: (
              <Link isAccent isInline href={privacy}>
                {stringGetter({ key: STRING_KEYS.PRIVACY_POLICY })}
              </Link>
            ),
          },
        })}
      </span>
    </form>
  );
};

const $EmailInput = styled(FormInput)<{ $hasValidEmail: boolean; $isLightMode: boolean }>`
  font-size: 1rem;
  --input-radius: 0.75rem;
  --border-width: 1px;
  --form-input-paddingY: 0.5rem;
  --form-input-paddingLeft: 0.75rem;
  --form-input-paddingRight: 0.5rem;
  --input-borderColor: ${({ $isLightMode }) =>
    $isLightMode ? 'var(--color-layer-6)' : 'var(--color-layer-4)'};
  --input-backgroundColor: transparent;

  &:focus-within {
    --input-borderColor: var(--color-accent);
  }

  ${({ $hasValidEmail }) =>
    $hasValidEmail &&
    css`
      --input-borderColor: var(--color-accent);
    `}
`;

const $EmailIcon = styled(Icon)`
  margin-right: 0.5rem;
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-text-0);
`;

const $HorizontalSeparatorFiller = styled(HorizontalSeparatorFiller)<{ $isLightMode: boolean }>`
  background-color: ${({ $isLightMode }) =>
    $isLightMode ? 'var(--color-layer-6)' : 'var(--color-layer-4)'};
`;

const $OtherOptionButton = styled(Button)`
  width: 100%;
  border-radius: 0.75rem;
  justify-content: space-between;
  --icon-size: 1rem;

  @media ${breakpoints.tablet} {
    border-radius: 1rem;
  }
`;

const $AlertMessage = styled(AlertMessage)`
  h4 {
    font: var(--font-small-medium);
  }
`;
