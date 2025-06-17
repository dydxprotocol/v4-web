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
  options?: {
    cells?: Parameters<typeof Cuer.Cells>[0];
    finder?: Parameters<typeof Cuer.Finder>[0];
  };
  imgOverride?: {
    src: string;
    alt: string;
  };
};

const DARK_LOGO_MARK_URL = '/logos/logo-mark-dark.svg';
const LIGHT_LOGO_MARK_URL = '/logos/logo-mark-light.svg';

export const QrCode = memo(
  ({ className, value, hasLogo, imgOverride, size = 300, options }: ElementProps & StyleProps) => {
    const appTheme: AppTheme = useAppSelector(getAppTheme);

    const alt = imgOverride?.alt ?? 'logo';
    const src =
      imgOverride?.src ?? (appTheme === AppTheme.Light ? DARK_LOGO_MARK_URL : LIGHT_LOGO_MARK_URL);

    return (
      <Cuer.Root className={className} size={size} value={value}>
        <Cuer.Cells {...options?.cells} />
        <Cuer.Finder radius={0.25} {...options?.finder} />
        {hasLogo && (
          <Cuer.Arena>
            <img
              alt={alt}
              src={src}
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
