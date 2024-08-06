import styled from 'styled-components';

import { type Nullable } from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { LocalStorageKey } from '@/constants/localStorage';
import { STRING_KEYS } from '@/constants/localization';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AlertMessage } from '@/components/AlertMessage';
import { Link } from '@/components/Link';

export const TradeFormInfoMessages = ({ marketId }: { marketId: Nullable<string> }) => {
  const stringGetter = useStringGetter();

  const [hasSeenTradeFormMessageTrumpWin, setHasSeenTradeFormMessageTrumpWin] = useLocalStorage({
    key: LocalStorageKey.HasSeenTradeFormMessageTRUMPWIN,
    defaultValue: false,
  });

  if (marketId === 'TRUMP-USD' && !hasSeenTradeFormMessageTrumpWin) {
    return (
      <AlertMessage type={AlertType.Notice}>
        <$Text>
          {stringGetter({
            key: STRING_KEYS.TRUMPWIN_DESC,
            params: {
              LEARN_MORE: (
                <Link isInline onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  {stringGetter({ key: STRING_KEYS.LEARN_MORE })}
                </Link>
              ),
              DISMISS: (
                <Link
                  isInline
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setHasSeenTradeFormMessageTrumpWin(true);
                  }}
                >
                  {stringGetter({ key: STRING_KEYS.DISMISS })}
                </Link>
              ),
            },
          })}
        </$Text>
      </AlertMessage>
    );
  }

  return null;
};

const $Text = styled.div`
  color: var(--color-text-1);

  a {
    text-decoration: underline;
  }
`;
