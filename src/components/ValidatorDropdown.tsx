import { memo, useMemo, useState } from 'react';

import { Validator } from '@dydxprotocol/v4-client-js/build/node_modules/@dydxprotocol/v4-proto/src/codegen/cosmos/staking/v1beta1/staking';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { ValidatorData } from '@/constants/validators';

import { useStakingValidator } from '@/hooks/useStakingValidator';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { ColumnDef, Table } from '@/components/Table';

import { MustBigNumber } from '@/lib/numbers';

import { DropdownIcon } from './DropdownIcon';
import { Icon, IconName } from './Icon';
import { Link } from './Link';
import { Output, OutputType } from './Output';
import { Popover, TriggerType } from './Popover';
import { TableCell } from './Table/TableCell';
import { Tag } from './Tag';

export const ValidatorFaviconIcon = ({
  className,
  url,
  fallbackText,
}: {
  className?: string;
  url?: string;
  fallbackText?: string;
}) => {
  const [iconFail, setIconFail] = useState<boolean>(false);

  if (url && !iconFail) {
    const parsedUrl = new URL(url);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
    return (
      <$Img
        className={className}
        src={`${baseUrl}/favicon.ico`}
        alt="validator favicon"
        onError={() => setIconFail(true)}
      />
    );
  }
  if (fallbackText) {
    return <$IconContainer className={className}>{fallbackText.charAt(0)}</$IconContainer>;
  }

  return null;
};

export const ValidatorName = ({ validator }: { validator: Validator }) => {
  const output = (
    <$Output
      type={OutputType.Text}
      value={validator?.description?.moniker}
      slotLeft={
        <ValidatorFaviconIcon
          url={validator?.description?.website}
          fallbackText={validator?.description?.moniker}
        />
      }
    />
  );

  return validator?.description?.website ? (
    <Link href={validator?.description?.website} withIcon>
      {output}
    </Link>
  ) : (
    output
  );
};

const ValidatorsDropdownContent = ({
  availableValidators,
}: {
  availableValidators: Validator[];
}) => {
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();

  const columns = useMemo(
    () =>
      [
        {
          columnKey: 'commission',
          getCellValue: (row) => row.commissionRate.toNumber(),
          label: stringGetter({ key: STRING_KEYS.VALIDATOR }),
          allowsSorting: true,
          renderCell: ({ website, name, commissionRate }) => (
            <TableCell
              stacked
              stackedWithSecondaryStyling
              slotLeft={<ValidatorFaviconIcon url={website} fallbackText={name} />}
            >
              <span>{name}</span>
              <span>
                {stringGetter({
                  key: STRING_KEYS.COMMISSION_PERCENTAGE,
                  params: {
                    PERCENTAGE: (
                      <$CommissionOutput type={OutputType.Percent} value={commissionRate} />
                    ),
                  },
                })}
              </span>
            </TableCell>
          ),
        },
        {
          columnKey: 'votingPower',
          getCellValue: (row) => row.votingPower.toNumber(),
          allowsSorting: true,
          label: stringGetter({ key: STRING_KEYS.VOTING_POWER }),
          tag: <Tag> {chainTokenLabel} </Tag>,
          renderCell: ({ votingPower }) => <Output type={OutputType.Number} value={votingPower} />,
        },
      ] satisfies ColumnDef<ValidatorData>[],
    [stringGetter, chainTokenLabel]
  );

  const filteredValidators = availableValidators.reduce((validators: ValidatorData[], val) => {
    if (val.description) {
      validators.push({
        name: val.description.moniker,
        operatorAddress: val.operatorAddress,
        votingPower: MustBigNumber(val.delegatorShares).div(10 ** 36),
        commissionRate: MustBigNumber(val.commission?.commissionRates?.rate).div(10 ** 16),
        website: val.description?.website,
      });
    }
    return validators;
  }, []);

  return (
    <$ScrollArea>
      <$Table
        key="validators"
        label="Validators"
        data={filteredValidators}
        getRowKey={(row: ValidatorData) => row.operatorAddress}
        columns={columns}
        defaultSortDescriptor={{
          column: 'commission',
          direction: 'ascending',
        }}
        paginationBehavior="showAll"
        slotEmpty={
          <>
            <Icon iconName={IconName.OrderPending} />
            <h4>
              {
                'There are no validators currently available.' // TODO: localize
              }
            </h4>
          </>
        }
      />
    </$ScrollArea>
  );
};

export const ValidatorDropdown = memo(() => {
  const { selectedValidator, availableValidators } = useStakingValidator() ?? {};

  const [isOpen, setIsOpen] = useState(false);

  const output = (
    <$Output
      type={OutputType.Text}
      value={selectedValidator?.description?.moniker}
      slotLeft={
        <ValidatorFaviconIcon
          url={selectedValidator?.description?.website}
          fallbackText={selectedValidator?.description?.moniker}
        />
      }
      slotRight={<$DropdownIcon iconName={IconName.Caret} isOpen={isOpen} />}
    />
  );

  const slotTrigger = selectedValidator?.description?.website ? (
    <Link href={selectedValidator?.description?.website} withIcon>
      {output}
    </Link>
  ) : (
    output
  );

  return (
    <$Popover
      open={isOpen}
      onOpenChange={setIsOpen}
      slotTrigger={slotTrigger}
      triggerType={TriggerType.MarketDropdown}
      align="end"
      sideOffset={8}
      withPortal
    >
      <ValidatorsDropdownContent availableValidators={availableValidators ?? []} />
    </$Popover>
  );
});

const $IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5em;
  height: 1.5em;
  background-color: var(--color-layer-6);
  border-radius: 50%;
  font-weight: bold;
  color: var(--color-text-1);
  margin-right: 0.25em;
`;

const $Img = styled.img`
  width: 1.5em;
  height: 1.5em;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 0.25em;
`;

const $ScrollArea = styled.div`
  ${layoutMixins.scrollArea}

  max-height: 20rem;
`;

const $DropdownIcon = styled(DropdownIcon)`
  margin-left: 0.5rem;
`;

const $Popover = styled(Popover)`
  ${popoverMixins.popover}
`;

const $Table = styled(Table)`
  --tableRow-backgroundColor: var(--color-layer-4);
  --tableCell-padding: 0.5rem 1rem;
`;
const $Output = styled(Output)`
  color: var(--color-text-1);
`;

const $CommissionOutput = styled(Output)`
  display: inline;
`;
