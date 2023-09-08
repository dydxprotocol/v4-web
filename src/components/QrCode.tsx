import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';
import QRCodeStyling from 'qr-code-styling';

import { getAppTheme } from '@/state/configsSelectors';
import { AppTheme } from '@/state/configs';

type ElementProps = {
  value: string;
};

type StyleProps = {
  hasLogo?: boolean;
  size?: number;
};

const DARK_LOGO_MARK_URL = '/logos/logo-mark-dark.svg';
const LIGHT_LOGO_MARK_URL = '/logos/logo-mark-light.svg';

export const QrCode = ({ value, hasLogo, size = 300 }: ElementProps & StyleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const appTheme: AppTheme = useSelector(getAppTheme);

  const { current: qrCode } = useRef(
    new QRCodeStyling({
      type: 'svg',
      width: size,
      height: size,
      data: value,
      margin: 8,
      backgroundOptions: {
        color: 'var(--color-layer-4)',
      },
      imageOptions: {
        imageSize: 0.4,
        margin: 12,
      },
      dotsOptions: {
        type: 'dots',
        color: 'var(--color-text-2)',
      },
      cornersDotOptions: {
        type: 'square',
      },
      image: hasLogo
        ? appTheme === AppTheme.Light
          ? DARK_LOGO_MARK_URL
          : LIGHT_LOGO_MARK_URL
        : undefined,
      cornersSquareOptions: {
        type: 'extra-rounded',
        color: 'var(--color-text-2)',
      },
      qrOptions: {
        errorCorrectionLevel: 'M',
      },
    })
  );

  useEffect(() => {
    qrCode.append(ref.current || undefined);
  }, []);

  useEffect(() => {
    ref.current?.firstElementChild?.setAttribute('viewBox', `0 0 ${size} ${size}`);
  }, [ref.current]);

  useEffect(() => {
    if (hasLogo) {
      qrCode.update({
        image: appTheme === AppTheme.Light ? DARK_LOGO_MARK_URL : LIGHT_LOGO_MARK_URL,
      });
    }
  }, [appTheme, hasLogo]);

  return <Styled.QrCode ref={ref} />;
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.QrCode = styled.div`
  width: 100%;
  cursor: none;
  border-radius: 0.75em;

  svg {
    width: 100%;
    height: auto;
    border-radius: inherit;
    border: var(--border-width) solid var(--color-layer-6);
  }
`;
