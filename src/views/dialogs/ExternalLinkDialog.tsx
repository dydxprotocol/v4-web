import type { ReactNode } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { useStringGetter } from '@/hooks';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';

import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps = {
  buttonText?: ReactNode;
  link: string;
  linkDescription?: string;
  title?: ReactNode;
  slotContent?: ReactNode;
  setIsOpen: (open: boolean) => void;
};

export const ExternalLinkDialog = ({
  setIsOpen,
  buttonText,
  link,
  linkDescription,
  title,
  slotContent,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={title ?? stringGetter({ key: STRING_KEYS.LEAVING_WEBSITE })}
      description={
        linkDescription ?? stringGetter({ key: STRING_KEYS.LEAVING_WEBSITE_DESCRIPTION })
      }
    >
      <Styled.Content>
        {slotContent}
        <p>{stringGetter({ key: STRING_KEYS.LEAVING_WEBSITE_DISCLAIMER })}.</p>
        <Button type={ButtonType.Link} action={ButtonAction.Primary} href={link}>
          {buttonText ?? stringGetter({ key: STRING_KEYS.CONTINUE })}
        </Button>
      </Styled.Content>
    </Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Content = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1rem;

  font: var(--font-base-book);
`;
