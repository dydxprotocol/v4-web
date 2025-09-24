import { useState } from 'react';

import { logBonsaiError } from '@/bonsai/logs';
// eslint-disable-next-line no-restricted-imports
import { ComplianceAction, triggerCompliance } from '@/bonsai/rest/compliance';
import styled from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { DialogProps, GeoComplianceDialogProps } from '@/constants/dialogs';
import { COUNTRIES_MAP, CountryCodes } from '@/constants/geo';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useEndpointsConfig } from '@/hooks/useEndpointsConfig';
import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';

import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { SearchSelectMenu } from '@/components/SearchSelectMenu';
import { WithReceipt } from '@/components/WithReceipt';

import { useAppDispatch } from '@/state/appTypes';

import { runFn } from '@/lib/do';
import { removeTrailingSlash } from '@/lib/stringifyHelpers';

const isBlockedGeo = (geo: string, restrictedGeos: string[]): boolean => {
  return isMainnet ? restrictedGeos.includes(geo as CountryCodes) : false;
};

const CountrySelector = ({
  label,
  selectedCountry,
  onSelect,
}: {
  label: string;
  selectedCountry: string;
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
      <div tw="text-start">
        {selectedCountry || stringGetter({ key: STRING_KEYS.SELECT_A_COUNTRY })}
      </div>
    </SearchSelectMenu>
  );
};

export const GeoComplianceDialog = ({ setIsOpen }: DialogProps<GeoComplianceDialogProps>) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const [residence, setResidence] = useState('');
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const { isMobile } = useBreakpoints();
  const { geoV2 } = useEndpointsConfig();

  const submit = async () => {
    const restrictedGeos = await runFn(async (): Promise<string[]> => {
      try {
        const result = (await (await fetch(`${removeTrailingSlash(geoV2)}/restricted`)).json())
          .restricted.countryCodes;

        if (!Array.isArray(result)) {
          throw new Error('Expected array of country codes');
        }

        return result;
      } catch (error) {
        logBonsaiError('fetchRestrictedGeos', 'Failed to fetch restricted geos', { error });
        throw error;
      }
    });

    const action =
      residence && isBlockedGeo(COUNTRIES_MAP[residence]!, restrictedGeos)
        ? ComplianceAction.INVALID_SURVEY
        : ComplianceAction.VALID_SURVEY;

    const success = await dispatch(triggerCompliance(action));
    if (success) {
      setIsOpen(false);
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
        <$Form>
          <CountrySelector
            label={stringGetter({ key: STRING_KEYS.COUNTRY_OF_RESIDENCE })}
            selectedCountry={residence}
            onSelect={setResidence}
          />
          <WithReceipt
            slotReceipt={
              <div tw="p-1 text-color-text-0">
                <Checkbox
                  checked={hasAcknowledged}
                  onCheckedChange={setHasAcknowledged}
                  id="acknowledge-secret-phase-risk"
                  label={stringGetter({
                    key: STRING_KEYS.COMPLIANCE_ACKNOWLEDGEMENT,
                  })}
                />
              </div>
            }
            tw="[--withReceipt-backgroundColor:--color-layer-2]"
          >
            <Button
              action={ButtonAction.Primary}
              onClick={() => submit()}
              state={{ isDisabled: !hasAcknowledged }}
            >
              {stringGetter({ key: STRING_KEYS.SUBMIT })}
            </Button>
          </WithReceipt>
        </$Form>
      ) : (
        <$Form>
          <p>{stringGetter({ key: STRING_KEYS.COMPLIANCE_BODY_FIRST_OFFENSE_1 })}</p>
          <p>{stringGetter({ key: STRING_KEYS.COMPLIANCE_BODY_FIRST_OFFENSE_2 })}</p>
          <p>
            <strong>{stringGetter({ key: STRING_KEYS.COMPLIANCE_BODY_FIRST_OFFENSE_3 })}</strong>
          </p>
          <Button action={ButtonAction.Primary} onClick={() => setShowForm(true)}>
            {stringGetter({ key: STRING_KEYS.CONTINUE })}
          </Button>
        </$Form>
      )}
    </Dialog>
  );
};
const $Form = styled.form`
  ${formMixins.transfersForm}
`;
