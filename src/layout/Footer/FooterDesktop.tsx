import styled, { type AnyStyledComponent, css } from 'styled-components';

import { AbacusApiStatus } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useApiState, useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Details } from '@/components/Details';
import { Output, OutputType } from '@/components/Output';
import { WithTooltip } from '@/components/WithTooltip';

enum FooterItems {
  ChainHeight,
  IndexerHeight,
}

enum ExchangeStatus {
  Operational = 'Operational',
  Degraded = 'Degraded',
}

export const FooterDesktop = () => {
  const stringGetter = useStringGetter();
  const { height, indexerHeight, status, statusErrorMessage } = useApiState();

  const { exchangeStatus, label } =
    !status || status === AbacusApiStatus.NORMAL
      ? {
          exchangeStatus: ExchangeStatus.Operational,
          label: stringGetter({ key: STRING_KEYS.OPERATIONAL }),
        }
      : {
          exchangeStatus: ExchangeStatus.Degraded,
          label: stringGetter({ key: STRING_KEYS.DEGRADED }),
        };

  return (
    <Styled.Footer>
      <WithTooltip
        slotTooltip={
          statusErrorMessage && (
            <dl>
              <dd>{statusErrorMessage}</dd>
            </dl>
          )
        }
      >
        <Styled.Row>
          <Styled.StatusDot exchangeStatus={exchangeStatus} />
          <span>{label}</span>
        </Styled.Row>
      </WithTooltip>
      {import.meta.env.MODE !== 'production' && (
        <Styled.Details
          withSeparators
          items={[
            {
              key: FooterItems.ChainHeight,
              label: 'Block Height',
              value: <Output useGrouping type={OutputType.Number} value={height} />,
            },
            height !== indexerHeight && {
              key: FooterItems.IndexerHeight,
              label: 'Indexer Block Height',
              value: (
                <Styled.WarningOutput useGrouping type={OutputType.Number} value={indexerHeight} />
              ),
            },
          ].filter(Boolean)}
          layout="row"
        />
      )}
    </Styled.Footer>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Footer = styled.footer`
  ${layoutMixins.stickyFooter}
  ${layoutMixins.spacedRow}
  grid-area: Footer;

  font-size: 0.66em;
`;

Styled.Row = styled.div`
  ${layoutMixins.row}
  padding: 0 1rem;
  gap: 0.5rem;
`;

Styled.StatusDot = styled.div<{ exchangeStatus: ExchangeStatus }>`
  width: 1em;
  height: 1em;
  border-radius: 50%;

  background-color: ${({ exchangeStatus }) =>
    ({
      [ExchangeStatus.Degraded]: css`var(--color-warning)`,
      [ExchangeStatus.Operational]: css`var(--color-positive)`,
    }[exchangeStatus])};
`;

Styled.WarningOutput = styled(Output)`
  color: var(--color-warning);
`;

Styled.Details = styled(Details)`
  ${layoutMixins.scrollArea}

  padding: 0 0.5em;
`;
