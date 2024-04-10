import { useState } from 'react';

import styled, { AnyStyledComponent } from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { COUNTRIES_MAP } from '@/constants/geo';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints, useStringGetter } from '@/hooks';

import { formMixins } from '@/styles/formMixins';

import { Button } from '@/components/Button';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { FormInput } from '@/components/FormInput';
import { SearchSelectMenu } from '@/components/SearchSelectMenu';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

const CountrySelector = ({ label }: { label: string }) => {
  const stringGetter = useStringGetter();
  const [selectedCountry, setSelectedCountry] = useState('');

  const countriesList = Object.keys(COUNTRIES_MAP).map((country) => ({
    value: COUNTRIES_MAP[country],
    label: country,
    onSelect: () => setSelectedCountry(country),
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
        {selectedCountry || stringGetter({ key: STRING_KEYS.SELECT_A_COUNTRY })}
      </Styled.SelectedCountry>
    </SearchSelectMenu>
  );
};

export const GeoComplianceDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const [showForm, setShowForm] = useState(false);
  const { isMobile } = useBreakpoints();

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.COMPLIANCE_REQUEST })}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      {showForm ? (
        <Styled.Form>
          <CountrySelector label={stringGetter({ key: STRING_KEYS.COUNTRY_OF_RESIDENCE })} />
          <CountrySelector label={stringGetter({ key: STRING_KEYS.TRADING_LOCATION })} />
          <Button action={ButtonAction.Primary}>{stringGetter({ key: STRING_KEYS.SUBMIT })}</Button>
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
