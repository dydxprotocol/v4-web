import styled, { AnyStyledComponent } from 'styled-components';

import { Icon, IconName } from '@/components/Icon';

export const GreenCheckCircle = ({ className }: { className?: string }) => (
  <$Icon className={className} iconName={IconName.CheckCircle} />
);
const $Icon = styled(Icon)`
  --icon-size: 1.25rem;

  width: var(--icon-size);
  height: var(--icon-size);
`;
