import { memo } from 'react';

import { Cuer } from 'cuer';

import { useAppSelector } from '@/state/appTypes';
import { AppTheme } from '@/state/appUiConfigs';
import { getAppTheme } from '@/state/appUiConfigsSelectors';

type ElementProps = {
  value: string;
};

type StyleProps = {
  className?: string;
  hasLogo?: boolean;
  size?: number;
};

const DARK_LOGO_MARK_URL = '/logos/logo-mark-dark.svg';
const LIGHT_LOGO_MARK_URL = '/logos/logo-mark-light.svg';

export const QrCode = memo(
  ({ className, value, hasLogo, size = 300 }: ElementProps & StyleProps) => {
    const appTheme: AppTheme = useAppSelector(getAppTheme);

    return (
      <Cuer.Root className={className} size={size} value={value}>
        <Cuer.Cells />
        <Cuer.Finder radius={0.25} />
        {hasLogo && (
          <Cuer.Arena>
            <img
              alt="logo"
              src={appTheme === AppTheme.Light ? DARK_LOGO_MARK_URL : LIGHT_LOGO_MARK_URL}
              style={{
                height: '100%',
                objectFit: 'cover',
                aspectRatio: '1/1',
                width: '100%',
              }}
            />
          </Cuer.Arena>
        )}
      </Cuer.Root>
    );
  }
);
