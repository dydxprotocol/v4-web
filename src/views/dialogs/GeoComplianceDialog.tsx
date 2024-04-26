import { useState } from 'react';

import styled, { AnyStyledComponent } from 'styled-components';

import { ComplianceAction, ComplianceStatus } from '@/constants/abacus';
import { ButtonAction } from '@/constants/buttons';
import { COUNTRIES_MAP } from '@/constants/geo';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts, useBreakpoints, useDydxClient, useStringGetter } from '@/hooks';
import { useComplianceState } from '@/hooks/useComplianceState';

import { formMixins } from '@/styles/formMixins';

import { Button } from '@/components/Button';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { FormInput } from '@/components/FormInput';
import { SearchSelectMenu } from '@/components/SearchSelectMenu';

import { isBlockedGeo, signCompliancePayload } from '@/lib/compliance';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

const CountrySelector = ({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: string;
  onSelect: (country: string) => void;
}) => {
  const stringGetter = useStringGetter();

  const countriesList = Object.keys(COUNTRIES_MAP).map((country) => ({
    value: country,
    label: country,
    onSelect: () => onSelect(country),
  }));

  return (
    <SearchSelectMenu
      items={[
        {
          group: 'countries',
          groupLabel: stringGetter({ key: STRING_KEYS.COUNTRY }),
          items: countriesList,
        },
      ]}
      label={label}
      withSearch
    >
      <Styled.SelectedCountry>
        {selected || stringGetter({ key: STRING_KEYS.SELECT_A_COUNTRY })}
      </Styled.SelectedCountry>
    </SearchSelectMenu>
  );
};

export const GeoComplianceDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { compositeClient } = useDydxClient();
  const { complianceStatus } = useComplianceState();
  const { dydxAddress, hdKey } = useAccounts();

  const [residence, setResidence] = useState('');
  const [tradingLoaction, settradingLoaction] = useState('');

  const [showForm, setShowForm] = useState(false);
  const { isMobile } = useBreakpoints();

  const submit = async () => {
    const endpoint = `${compositeClient?.indexerClient.config.restEndpoint}/v4/compliance/geoblock`;
    if (
      dydxAddress &&
      complianceStatus &&
      complianceStatus !== ComplianceStatus.UNKNOWN &&
      hdKey?.publicKey
    ) {
      const message = 'Compliance verification message';
      const action =
        residence && isBlockedGeo(COUNTRIES_MAP[residence])
          ? ComplianceAction.INVALID_SURVEY.name
          : ComplianceAction.VALID_SURVEY.name;
      const { signedMessage, timestamp } = await signCompliancePayload(
        message,
        action,
        complianceStatus.name,
        hdKey
      );
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: dydxAddress,
          message: message,
          currentStatus: complianceStatus?.name,
          action,
          signedMessage,
          pubkey: Buffer.from(hdKey.publicKey).toString('base64'),
          timestamp,
        }),
      });
      setIsOpen?.(false);
    }
  };

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.COMPLIANCE_REQUEST })}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      {showForm ? (
        <Styled.Form>
          <CountrySelector
            label={stringGetter({ key: STRING_KEYS.COUNTRY_OF_RESIDENCE })}
            selected={residence}
            onSelect={setResidence}
          />
          <CountrySelector
            label={stringGetter({ key: STRING_KEYS.TRADING_LOCATION })}
            selected={tradingLoaction}
            onSelect={settradingLoaction}
          />
          <Button action={ButtonAction.Primary} onClick={() => submit()}>
            {stringGetter({ key: STRING_KEYS.SUBMIT })}
          </Button>
        </Styled.Form>
      ) : (
        <Styled.Form>
          <p>{stringGetter({ key: STRING_KEYS.COMPLIANCE_BODY_FIRST_OFFENSE_1 })}</p>
          <p>{stringGetter({ key: STRING_KEYS.COMPLIANCE_BODY_FIRST_OFFENSE_2 })}</p>
          <Button action={ButtonAction.Primary} onClick={() => setShowForm(true)}>
            {stringGetter({ key: STRING_KEYS.CONTINUE })}
          </Button>
        </Styled.Form>
      )}
    </Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Form = styled.form`
  ${formMixins.transfersForm}
`;

Styled.SelectedCountry = styled.div`
  text-align: start;
`;
