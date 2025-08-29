import styled, { css } from 'styled-components';

import { Icon, IconName } from '@/components/Icon';

export type SecondaryIconPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export type StackedIconProps = {
  primaryIcon: IconName;
  secondaryIcon: IconName;
  primarySize?: string;
  secondarySize?: string;
  secondaryPosition?: SecondaryIconPosition;
  secondaryOffset?: number;
};

export const StackedIcon = ({
  primaryIcon,
  secondaryIcon,
  primarySize = '1.25rem',
  secondarySize = '0.625rem',
  secondaryPosition = 'bottom-right',
  secondaryOffset = 15,
}: StackedIconProps) => {
  return (
    <div tw="relative flex">
      <Icon iconName={primaryIcon} size={primarySize} />
      <$SecondaryIcon
        iconName={secondaryIcon}
        size={secondarySize}
        $offset={secondaryOffset}
        $position={secondaryPosition}
      />
    </div>
  );
};

const $SecondaryIcon = styled(Icon)<{
  $offset: number;
  $position: SecondaryIconPosition;
}>`
  --offset: ${({ $offset }) => $offset}%;

  position: absolute;
  outline: 1.5px solid var(--color-layer-4);
  border-radius: 9999px;
  overflow: hidden;

  ${({ $position }) =>
    ({
      'bottom-right': css`
        bottom: 0;
        right: 0;
        transform: translate(var(--offset), var(--offset));
      `,
      'top-right': css`
        top: 0;
        right: 0;
        transform: translate(var(--offset), calc(-1 * var(--offset)));
      `,
      'top-left': css`
        top: 0;
        left: 0;
        transform: translate(calc(-1 * var(--offset)), calc(-1 * var(--offset)));
      `,
      'bottom-left': css`
        bottom: 0;
        left: 0;
        transform: translate(calc(-1 * var(--offset)), var(--offset));
      `,
    })[$position]}
`;
