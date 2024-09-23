import { Validator } from '@dydxprotocol/v4-proto/src/codegen/cosmos/staking/v1beta1/staking';
import styled from 'styled-components';

import { ValidatorFaviconIcon } from './ValidatorFaviconIcon';
import { WithTooltip } from './WithTooltip';

type ElementProps = {
  numToShow?: number;
  validators: Validator[];
};

type StyleProps = {
  className?: string;
};

export const ValidatorIcons = ({
  numToShow = 3,
  validators,
  className,
}: ElementProps & StyleProps) => {
  const validatorNames = validators.map((validator) => validator.description?.moniker).join(', ');
  return (
    <$ValidatorIcons className={className}>
      {validators?.length <= numToShow
        ? validators.map((validator) => (
            <$ValidatorIcon
              key={validator.description?.moniker}
              url={validator.description?.website}
              fallbackText={validator.description?.moniker}
            />
          ))
        : validators
            .slice(0, numToShow - 1)
            .map((validator) => (
              <$ValidatorIcon
                key={validator.description?.moniker}
                url={validator.description?.website}
                fallbackText={validator.description?.moniker}
              />
            ))
            .concat(
              <WithTooltip tooltipString={validatorNames}>
                <$OverflowIcon key="overflow">
                  {`+${validators.length - (numToShow - 1)}`}
                </$OverflowIcon>
              </WithTooltip>
            )}
    </$ValidatorIcons>
  );
};

const $ValidatorIcons = styled.div`
  --border-color: var(--color-border);
  --icon-size: 2.25rem;

  display: flex;

  > * {
    &:nth-child(1) {
      z-index: 2;
    }

    &:nth-child(2) {
      z-index: 1;
    }

    &:not(:first-child) {
      margin-left: -0.66em;
    }
  }
`;

const $ValidatorIcon = styled(ValidatorFaviconIcon)`
  height: var(--icon-size);
  width: var(--icon-size);

  margin: 0;
  border: 2px solid var(--border-color);
`;

const $OverflowIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin: 0;
  border: 2px solid var(--border-color);

  height: var(--icon-size);
  width: var(--icon-size);

  background-color: var(--color-layer-6);
  color: var(--color-text-1);
`;
