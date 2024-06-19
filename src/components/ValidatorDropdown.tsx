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

import { DropdownIcon } from '@/components/DropdownIcon';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { Popover, TriggerType } from '@/components/Popover';
import { ColumnDef, Table } from '@/components/Table';
import { TableCell } from '@/components/Table/TableCell';
import { Tag } from '@/components/Tag';
import { ValidatorFaviconIcon } from '@/components/ValidatorName';

import { MustBigNumber } from '@/lib/numbers';

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
