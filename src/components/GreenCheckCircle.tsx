import { Icon, IconName } from '@/components/Icon';

export const GreenCheckCircle = ({ className }: { className?: string }) => (
  <Icon
    className={className}
    iconName={IconName.CheckCircle}
    tw="h-[--icon-size] w-[--icon-size] [--icon-size:1.25rem]"
  />
);
