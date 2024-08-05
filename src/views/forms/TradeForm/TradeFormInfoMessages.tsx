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

  if (marketId === 'TRUMPWIN-USD' && !hasSeenTradeFormMessageTrumpWin) {
    // TODO: (TRA-528): Localize string when finallized and add LEARN_MORE link
    return (
      <AlertMessage type={AlertType.Notice}>
        <$Text>
          This is a Prediction Market and will settle at $1 if Donald J. Trump wins the 2024 US
          Presidential Election. Otherwise, it will settle at $0.00001.{' '}
          <Link isInline onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            {stringGetter({ key: STRING_KEYS.LEARN_MORE })}
          </Link>{' '}
          or{' '}
          <Link
            isInline
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setHasSeenTradeFormMessageTrumpWin(true);
            }}
          >
            {stringGetter({ key: STRING_KEYS.DISMISS })}
          </Link>
          .
        </$Text>
      </AlertMessage>
    );
  }

  return null;
};

const $Text = styled.div`
  color: var(--color-text-1);
`;
