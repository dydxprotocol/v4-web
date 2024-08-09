import styled, { css } from 'styled-components';

import { AlertType } from '@/constants/alerts';

import { layoutMixins } from '@/styles/layoutMixins';

type StyleProps = {
  className?: string;
  type: AlertType;
};

type ElementProps = {
  children: React.ReactNode;
};

export type AlertMessageProps = ElementProps & StyleProps;

export const AlertMessage: React.FC<AlertMessageProps> = ({
  className,
  children,
  type,
}: AlertMessageProps) => {
  return (
    <AlertContainer type={type} className={className}>
      {children}
    </AlertContainer>
  );
};

const AlertContainer = styled.div<StyleProps>`
  ${layoutMixins.column}

  --alert-accent-color: transparent;
  --alert-default-background-opacity: 0.1;
  --alert-background: linear-gradient(transparent, var(--alert-accent-color)) 0
    clamp(0%, var(--alert-default-background-opacity) * 100%, 100%) / auto 10000vmax;

  ${({ type }) => {
    switch (type) {
      case AlertType.Error: {
        return css`
          --alert-accent-color: var(--color-error);
          --alert-background: var(--color-gradient-error);
        `;
      }
      case AlertType.Info: {
        return css`
          --alert-accent-color: var(--color-text-1);
          --alert-background: var(--color-layer-7);
        `;
      }
      case AlertType.Notice: {
        return css`
          --alert-accent-color: var(--color-accent);
          --alert-background: var(--color-accent-faded);
        `;
      }
      case AlertType.Success: {
        return css`
          --alert-accent-color: var(--color-success);
          --alert-background: var(--color-gradient-success);
        `;
      }
      case AlertType.Warning: {
        return css`
          --alert-accent-color: var(--color-warning);
          --alert-background: var(--color-gradient-warning);
        `;
      }
      default:
        return '';
    }
  }}

  overflow: auto;
  position: relative;
  max-height: 12.5rem;
  gap: 0.25em;

  font-size: 0.8125em;

  padding: 0.625em 0.75em;

  color: var(--color-text-2);

  background: var(--alert-background);
  border-left: 0.25em solid var(--alert-accent-color);
  border-radius: 0.25em;

  white-space: pre-wrap;

  user-select: all;
`;
