import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { ButtonStyle } from '@/constants/buttons';

import { BackButton } from './BackButton';
import { IconName } from './Icon';

export const SimpleUiHeader = ({ pageTitle, to }: { pageTitle?: string; to?: string }) => {
  const navigate = useNavigate();
  const onClick = to ? () => navigate(to) : undefined;

  return (
    <div tw="row relative mb-[1rem] mt-[1.375rem] justify-center">
      <h1 tw="text-color-text-2 font-large-bold">{pageTitle}</h1>
      <$BackButton
        buttonStyle={ButtonStyle.WithoutBackground}
        iconName={IconName.Caret}
        onClick={onClick}
      />
    </div>
  );
};

const $BackButton = styled(BackButton)`
  position: absolute;
  left: 1.25rem;
  top: 0;
  bottom: 0;
  transform: rotate(0.25turn);

  svg {
    height: 1rem;
    width: 1rem;
  }
`;
