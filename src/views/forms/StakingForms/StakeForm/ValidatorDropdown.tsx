import { Dispatch, Key, SetStateAction, memo, useCallback, useMemo, useState } from 'react';

import { Validator } from '@dydxprotocol/v4-proto/src/codegen/cosmos/staking/v1beta1/staking';
import styled from 'styled-components';
import { formatUnits } from 'viem';

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
import { ValidatorFaviconIcon } from '@/components/ValidatorFaviconIcon';

import { MustBigNumber } from '@/lib/numbers';

const ValidatorsDropdownContent = ({
  availableValidators,
  setSelectedValidator,
  setIsPopoverOpen,
}: {
  availableValidators: Validator[];
  setSelectedValidator: Dispatch<SetStateAction<Validator | undefined>>;
  setIsPopoverOpen: (isOpen: boolean) => void;
}) => {
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();

  const votingPowerDecimals = 36; // hardcoded solution; fix in OTE-390
  const commissionRateDecimals = 18; // hardcoded solution; fix in OTE-390

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
                      <Output type={OutputType.Percent} value={commissionRate} tw="inline" />
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
        votingPower: MustBigNumber(formatUnits(BigInt(val.delegatorShares), votingPowerDecimals)),
        commissionRate: MustBigNumber(
          formatUnits(BigInt(val.commission?.commissionRates?.rate ?? 0), commissionRateDecimals)
        ),
        website: val.description?.website,
      });
    }
    return validators;
  }, []);

  const onRowAction = useCallback(
    (key: Key) => {
      const newValidator = availableValidators.find((v) => v.operatorAddress === key);
      if (newValidator) {
        setSelectedValidator(newValidator);
      }
      setIsPopoverOpen(false);
    },
    [setSelectedValidator, setIsPopoverOpen, availableValidators]
  );

  return (
    <$ScrollArea>
      <$Table
        key="validators"
        label="Validators"
        data={filteredValidators}
        getRowKey={(row: ValidatorData) => row.operatorAddress}
        onRowAction={onRowAction}
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

type ElementProps = {
  selectedValidator: Validator | undefined;
  setSelectedValidator: Dispatch<SetStateAction<Validator | undefined>>;
};

export const ValidatorDropdown = memo(
  ({ selectedValidator, setSelectedValidator }: ElementProps) => {
    const { availableValidators } = useStakingValidator() ?? {};

    const [isOpen, setIsOpen] = useState(false);

    const output = (
      <Output
        type={OutputType.Text}
        value={selectedValidator?.description?.moniker}
        slotLeft={
          <ValidatorFaviconIcon
            url={selectedValidator?.description?.website}
            fallbackText={selectedValidator?.description?.moniker}
          />
        }
        tw="text-color-text-1"
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
        slotTrigger={
          <span tw="flex items-center">
            {slotTrigger}
            <DropdownIcon iconName={IconName.Caret} isOpen={isOpen} tw="ml-0.5" />
          </span>
        }
        triggerType={TriggerType.MarketDropdown}
        align="end"
        sideOffset={8}
        withPortal
      >
        <ValidatorsDropdownContent
          availableValidators={availableValidators ?? []}
          setSelectedValidator={setSelectedValidator}
          setIsPopoverOpen={setIsOpen}
        />
      </$Popover>
    );
  }
);

const $ScrollArea = styled.div`
  ${layoutMixins.scrollArea}

  max-height: 20rem;
`;
const $Popover = styled(Popover)`
  ${popoverMixins.popover}
`;

const $Table = styled(Table)`
  --tableRow-backgroundColor: var(--color-layer-4);
  --tableCell-padding: 0.5rem 1rem;
` as typeof Table;
