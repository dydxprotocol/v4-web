import { ElementType } from 'react';

import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { WalletType, wallets } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useDisplayedWallets } from '@/hooks/useDisplayedWallets';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Link } from '@/components/Link';

export const ChooseWallet = ({
  onChooseWallet,
}: {
  onChooseWallet: (walletType: WalletType) => void;
}) => {
  const stringGetter = useStringGetter();
  const { walletLearnMore } = useURLConfigs();

  const displayedWallets = useDisplayedWallets();

  const { selectedWalletType, selectedWalletError } = useAccounts();

  return (
    <>
      {selectedWalletType && selectedWalletError && (
        <$AlertMessage type={AlertType.Error}>
          <h4>
            {stringGetter({
              key: STRING_KEYS.COULD_NOT_CONNECT,
              params: {
                WALLET: stringGetter({
                  key: wallets[selectedWalletType].stringKey,
                }),
              },
            })}
          </h4>
          {selectedWalletError}
        </$AlertMessage>
      )}

      <$Wallets>
        {displayedWallets.map((walletType) => (
          <$WalletButton
            action={ButtonAction.Base}
            key={walletType}
            onClick={() => onChooseWallet(walletType)}
            slotLeft={<$Icon iconComponent={wallets[walletType].icon as ElementType} />}
            size={ButtonSize.Small}
          >
            {stringGetter({ key: wallets[walletType].stringKey })}
          </$WalletButton>
        ))}
      </$Wallets>

      <$Footer>
        <Link href={walletLearnMore} withIcon>
          {stringGetter({ key: STRING_KEYS.ABOUT_WALLETS })}
        </Link>
      </$Footer>
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

  :after {
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

const $Icon = styled(Icon)`
  width: 1.5em;
  height: 1.5em;
`;

const $Footer = styled.footer`
  ${layoutMixins.spacedRow}
  justify-content: center;
  margin-top: auto;

  a {
    color: var(--color-text-0);
    font: var(--font-base-book);

    &:hover {
      color: var(--color-text-1);
    }
  }
`;
