import { useMemo } from 'react';

import { loadableLoaded } from '@/bonsai/lib/loadable';
import { ComplianceResponse, ComplianceStatus } from '@/bonsai/types/summaryTypes';
import styled from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { ComplianceConfigDialogProps, DialogProps } from '@/constants/dialogs';
import { MenuGroup } from '@/constants/menus';

import { useAccounts } from '@/hooks/useAccounts';
import { useDydxClient } from '@/hooks/useDydxClient';

import { Button } from '@/components/Button';
import { ComboboxDialogMenu } from '@/components/ComboboxDialogMenu';
import { Switch } from '@/components/Switch';

import { getComplianceStatus, getGeo } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setComplianceGeoHeadersRaw, setLocalAddressScreenV2Raw } from '@/state/raw';

const complianceStatusOptions = [
  { status: ComplianceStatus.COMPLIANT, label: 'Compliant' },
  { status: ComplianceStatus.BLOCKED, label: 'Blocked' },
  { status: ComplianceStatus.CLOSE_ONLY, label: 'Close Only' },
  { status: ComplianceStatus.FIRST_STRIKE, label: 'First Strike' },
  { status: ComplianceStatus.FIRST_STRIKE_CLOSE_ONLY, label: 'First Strike Close Only' },
];

const setCompliance = (payload: ComplianceResponse) =>
  setLocalAddressScreenV2Raw(loadableLoaded(payload));

const usePreferenceMenu = () => {
  const dispatch = useAppDispatch();
  const complianceStatus = useAppSelector(getComplianceStatus);
  const geo = useAppSelector(getGeo);
  const { isPerpetualsGeoBlocked } = geo;
  const notificationSection = useMemo(
    (): MenuGroup<string, string> => ({
      group: 'status',
      groupLabel: 'Simulate Compliance Status',
      items: complianceStatusOptions.map(({ status, label }) => ({
        value: status,
        label,
        onSelect: () => dispatch(setCompliance({ status, updatedAt: new Date().toString() })),
        slotAfter: (
          <Switch
            name="CompliaceStatus"
            checked={complianceStatus === status}
            onCheckedChange={() => null} // Assuming the onChange logic is to be defined or is unnecessary
          />
        ),
      })),
    }),
    [complianceStatus, dispatch]
  );

  const otherSection = useMemo(
    (): MenuGroup<string, string> => ({
      group: 'Geo',
      items: [
        {
          value: 'RestrictGeo',
          label: 'Simulate Restricted Perps Geo',
          slotAfter: (
            <Switch
              name="RestrictGeo"
              checked={isPerpetualsGeoBlocked}
              onCheckedChange={() => null}
            />
          ),
          onSelect: () => {
            dispatch(
              setComplianceGeoHeadersRaw({
                ...loadableLoaded(
                  isPerpetualsGeoBlocked
                    ? { status: undefined, country: 'JP', region: 'Tokyo' }
                    : { status: 'restricted', country: 'US', region: 'California' }
                ),
                force: true,
              })
            );
          },
        },
      ],
    }),
    [dispatch, isPerpetualsGeoBlocked]
  );

  return [otherSection, notificationSection];
};

export const ComplianceConfigDialog = ({ setIsOpen }: DialogProps<ComplianceConfigDialogProps>) => {
  const preferenceItems = usePreferenceMenu();
  const complianceStatus = useAppSelector(getComplianceStatus);

  const { dydxAddress } = useAccounts();
  const { compositeClient } = useDydxClient();

  const submit = () => {
    const endpoint = `${compositeClient?.indexerClient.config.restEndpoint}/v4/compliance/setStatus`;
    if (dydxAddress) {
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: dydxAddress, status: complianceStatus }),
      });
      setIsOpen(false);
    }
  };

  return (
    <$ComboboxDialogMenu
      isOpen
      title="Compliance Settings (Dev Only)"
      items={preferenceItems}
      setIsOpen={setIsOpen}
    >
      <Button action={ButtonAction.Primary} onClick={() => submit()}>
        Submit
      </Button>
    </$ComboboxDialogMenu>
  );
};
const $ComboboxDialogMenu = styled(ComboboxDialogMenu)`
  --dialog-content-paddingBottom: 0.5rem;
` as typeof ComboboxDialogMenu;
