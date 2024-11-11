import styled from 'styled-components';

import { NewMarketForm } from './forms/NewMarketForm';

export const LaunchMarketSidePanel = ({
  className,
  launchableMarketId,
}: {
  className?: string;
  launchableMarketId?: string;
}) => {
  return (
    <$Container className={className}>
      <NewMarketForm defaultLaunchableMarketId={launchableMarketId} />
    </$Container>
  );
};

const $Container = styled.section`
  display: grid;
  gap: 1rem;
  padding: 1rem;
  flex: 1;

  --withReceipt-backgroundColor: var(--color-layer-1);
  --innerElement-backgroundColor: var(--color-layer-1);
  --launchMarketPreview-width: 8rem;
`;
