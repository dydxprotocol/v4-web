import { Dispatch, SetStateAction, useMemo } from 'react';

import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { AlertMessage } from '@/components/AlertMessage';
import { Checkbox } from '@/components/Checkbox';

import { log } from '@/lib/telemetry';

type RouteWarningMessageProps = {
  hasAcknowledged: boolean;
  setHasAcknowledged: Dispatch<SetStateAction<boolean>>;
  routeWarningJSON: string | undefined | null;
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
  routeWarningJSON,
}: RouteWarningMessageProps) => {
  const stringGetter = useStringGetter();
  const { warningMessage, acknowledgementMessageStringKey } = useMemo(() => {
    if (!routeWarningJSON) return {};
    try {
      const warningObject = JSON.parse(routeWarningJSON);
      return {
        warningMessage: warningObject.message,
        acknowledgementMessageStringKey: getStringKeyFromWarningType(warningObject.type),
      };
    } catch (err) {
      log('RouteWarningMessage/warningObject', err);
      return {};
    }
  }, [routeWarningJSON]);
  if (!warningMessage || !acknowledgementMessageStringKey) {
    setHasAcknowledged(false);
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
