import { Dispatch, SetStateAction, useMemo } from 'react';

import { RouteWarning } from '@skip-go/client';
import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { AlertMessage } from '@/components/AlertMessage';
import { Checkbox } from '@/components/Checkbox';

type RouteWarningMessageProps = {
  hasAcknowledged: boolean;
  setHasAcknowledged: Dispatch<SetStateAction<boolean>>;
  routeWarning?: RouteWarning;
};
/*
Warning message example:
{
  "type": "BAD_PRICE_WARNING",
  "message": "Difference in USD value of route input and output is large. Input USD value: 52.98 Output USD value: 28.05"
}
*/

const getStringKeyFromWarningType = (warningType: string) => {
  if (warningType === 'BAD_PRICE_WARNING') return STRING_KEYS.ACKNOWLEDGE_WARNING_MESSAGE_HIGH_FEES;
  return STRING_KEYS.ACKNOWLEDGE_WARNING_MESSAGE_FALLBACK;
};

export const RouteWarningMessage = ({
  hasAcknowledged,
  setHasAcknowledged,
  routeWarning,
}: RouteWarningMessageProps) => {
  const stringGetter = useStringGetter();
  const { warningMessage, acknowledgementMessageStringKey } = useMemo(() => {
    if (!routeWarning) return {};
    return {
      warningMessage: routeWarning.message,
      acknowledgementMessageStringKey: getStringKeyFromWarningType(routeWarning.type),
    };
    // Do not use an obj in dependency array. Use primitives instead so shallow equals works
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeWarning?.message, routeWarning?.type]);
  if (!warningMessage || !acknowledgementMessageStringKey) {
    return null;
  }

  return (
    <$AlertMessage type={AlertType.Warning}>
      <Checkbox
        checked={hasAcknowledged}
        onCheckedChange={setHasAcknowledged}
        id="acknowledge-route-warning"
        label={stringGetter({
          key: acknowledgementMessageStringKey,
          params: {
            WARNING_MESSAGE: warningMessage,
          },
        })}
      />
    </$AlertMessage>
  );
};

const $AlertMessage = styled(AlertMessage)`
  margin: var(--form-input-paddingY) var(--form-input-paddingX);
`;
