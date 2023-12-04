import styled, { type AnyStyledComponent } from 'styled-components';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { useStringGetter } from '@/hooks';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';

import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps = {
  link: string;
  linkDescription?: string;
  setIsOpen: (open: boolean) => void;
};

export const ExternalLinkDialog = ({ setIsOpen, link, linkDescription }: ElementProps) => {
  const stringGetter = useStringGetter();
  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.LEAVING_WEBSITE })}
      description={
        linkDescription ?? stringGetter({ key: STRING_KEYS.LEAVING_WEBSITE_DESCRIPTION })
      }
    >
      <Styled.Content>
        <p>{stringGetter({ key: STRING_KEYS.LEAVING_WEBSITE_DISCLAIMER })}.</p>
        <Button type={ButtonType.Link} action={ButtonAction.Primary} href={link}>
          {stringGetter({ key: STRING_KEYS.CONTINUE })}
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
