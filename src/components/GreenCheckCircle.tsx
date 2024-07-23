import styled from 'styled-components';

import { Icon, IconName } from '@/components/Icon';

export const GreenCheckCircle = ({ className }: { className?: string }) => (
  <Icon
    className={className}
    iconName={IconName.CheckCircle}
    tw="h-[var(--icon-size)] w-[var(--icon-size)] [--icon-size:1.25rem]"
  />
);
