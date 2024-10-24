import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { ConnectorType, WalletInfo, wallets } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useDisplayedWallets } from '@/hooks/useDisplayedWallets';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { Link } from '@/components/Link';
import { WalletIcon } from '@/components/WalletIcon';

export const ChooseWallet = ({
  onChooseWallet,
}: {
  onChooseWallet: (wallet: WalletInfo) => void;
}) => {
  const stringGetter = useStringGetter();
  const { walletLearnMore } = useURLConfigs();

  const displayedWallets = useDisplayedWallets();

  const { selectedWallet, selectedWalletError } = useAccounts();

  return (
    <>
      {selectedWallet && selectedWalletError && (
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
      )}

      <$Wallets>
        {displayedWallets.map((wallet) => (
          <$WalletButton
            action={ButtonAction.Base}
            key={wallet.name}
            onClick={() => onChooseWallet(wallet)}
            slotLeft={<WalletIcon wallet={wallet} size="1.5em" />}
            size={ButtonSize.Small}
          >
            <$WalletName>
              {wallet.connectorType === ConnectorType.Injected
                ? wallet.name
                : stringGetter({ key: wallets[wallet.name as keyof typeof wallets].stringKey })}
            </$WalletName>
          </$WalletButton>
        ))}
      </$Wallets>

      <$Link href={walletLearnMore} withIcon>
        {stringGetter({ key: STRING_KEYS.LEARN_ABOUT_WALLETS })}
      </$Link>
    </>
  );
};

const $AlertMessage = styled(AlertMessage)`
  h4 {
    font: var(--font-small-medium);
  }
`;

const $Wallets = styled.div`
  gap: 0.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));

  > :last-child:nth-child(odd) {
    grid-column: span 2;
  }

  // Flex layout
  /* display: flex;
  flex-wrap: wrap;

  &:after {
    content: '';
    flex: 2;
  } */
`;

const $WalletButton = styled(Button)`
  justify-content: start;
  gap: 0.5rem;

  @media ${breakpoints.mobile} {
    div {
      text-align: start;
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }
`;

const $WalletName = styled.div`
  ${layoutMixins.textTruncate}
`;

const $Link = styled(Link)`
  --link-color: var(--color-text-0);

  justify-content: center;
  font: var(--font-base-book);
  &:hover {
    color: var(--color-text-1);
  }
`;
