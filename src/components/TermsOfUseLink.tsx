import styled from 'styled-components';

import { Link } from '@/components/Link';

type StyleProps = {
  isInline?: boolean;
};

export const TermsOfUseLink = ({ isInline }: StyleProps) => {
  return <$Link isInline={isInline} />;
};

const $Link = styled(Link)<{ isInline: boolean }>``;
