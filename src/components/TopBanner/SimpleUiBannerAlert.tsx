import { useRef } from 'react';

import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';

import { useResizeObserver } from '@/hooks/useResizeObserver';

import { AlertMessage } from '../AlertMessage';

export const SimpleUiBannerAlert = ({
  className,
  type,
  children,
}: {
  className?: string;
  type: AlertType;
  children: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useResizeObserver({
    box: 'border-box',
    ref,
    onResize: (size) => {
      if (size.height) {
        document.documentElement.style.setProperty(
          '--simpleUi-topBanner-height',
          `${size.height}px`
        );
      }
    },
  });

  return (
    <$AlertMessage className={className} ref={ref} withAccentText type={type}>
      {children}
    </$AlertMessage>
  );
};

const $AlertMessage = styled(AlertMessage)`
  border-radius: 0.5rem;
  max-width: 100%;
  margin: 0.75rem 0.75rem 0 0.75rem;
  font: var(--font-base-book);
  grid-auto-flow: column;
`;
