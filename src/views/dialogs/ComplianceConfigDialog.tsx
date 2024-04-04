import { useEffect, useMemo, useState } from 'react';

import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import { ComplianceStatus } from '@/constants/compliance';
import { STRING_KEYS } from '@/constants/localization';
import { NotificationType } from '@/constants/notifications';

import { useStringGetter } from '@/hooks';
import { useNotifications } from '@/hooks/useNotifications';

import { ComboboxDialogMenu } from '@/components/ComboboxDialogMenu';
import { Switch } from '@/components/Switch';

import { setCompliance } from '@/state/account';
import { getComplianceStatus } from '@/state/accountSelectors';
import { setGeo } from '@/state/app';
import { getGeo } from '@/state/appSelectors';
import { OtherPreference, setDefaultToAllMarketsInPositionsOrdersFills } from '@/state/configs';
import { getDefaultToAllMarketsInPositionsOrdersFills } from '@/state/configsSelectors';

const complianceStatusOptions = [
  { status: ComplianceStatus.COMPLIANT, label: 'Compliant' },
  { status: ComplianceStatus.BLOCKED, label: 'Blocked' },
  { status: ComplianceStatus.CLOSE_ONLY, label: 'Close Only' },
  { status: ComplianceStatus.FIRST_STRIKE, label: 'First Strike' },
];

export const usePreferenceMenu = () => {
  const dispatch = useDispatch();

  const complianceStatus = useSelector(getComplianceStatus, shallowEqual);
  const geo = useSelector(getGeo, shallowEqual);
  const restrictedGeo = geo === 'US' || geo === 'CA';

  const notificationSection = useMemo(
    () => ({
      group: 'status',
      groupLabel: 'Simulate Compliance Status',
      items: complianceStatusOptions.map(({ status, label }) => ({
        value: status,
        label: label,
        onSelect: () => dispatch(setCompliance({ status })),
        slotAfter: (
          <Switch
            name={NotificationType.AbacusGenerated}
            checked={complianceStatus === status}
            onCheckedChange={() => null} // Assuming the onChange logic is to be defined or is unnecessary
          />
        ),
      })),
    }),
    [complianceStatus, setCompliance]
  );

  const otherSection = useMemo(
    () => ({
      group: 'Geo',
      items: [
        {
          value: 'RestrictGeo',
          label: 'Simulate Restricted Geo',
          slotAfter: (
            <Switch
              name={OtherPreference.DisplayAllMarketsDefault}
              checked={restrictedGeo}
              onCheckedChange={() => null}
            />
          ),
          onSelect: () => {
            dispatch(restrictedGeo ? setGeo('') : setGeo('US'));
          },
        },
      ],
    }),
    [restrictedGeo]
  );

  return [otherSection, notificationSection];
};

type ElementProps = {
  setIsOpen: (open: boolean) => void;
};

export const ComplianceConfigDialog = ({ setIsOpen }: ElementProps) => {
  const preferenceItems = usePreferenceMenu();

  return (
    <Styled.ComboboxDialogMenu
      isOpen
      title="Compliance Settings (Dev Only)"
      items={preferenceItems}
      setIsOpen={setIsOpen}
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.ComboboxDialogMenu = styled(ComboboxDialogMenu)`
  --dialog-content-paddingBottom: 0.5rem;
`;
