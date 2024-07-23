import { Item, Root } from '@radix-ui/react-radio-group';
import styled from 'styled-components';

import { MenuItem } from '@/constants/menus';

import { Icon, IconName } from './Icon';

type RadioItem<MenuItemValue extends string> = Pick<
  MenuItem<MenuItemValue>,
  'value' | 'label' | 'disabled'
> & {
  body?: React.ReactNode;
};

type RadioButtonCardsProps<MenuItemValue extends string> = {
  className?: string;
  slotTop?: React.ReactNode;
  slotBottom?: React.ReactNode;
  radioItems: RadioItem<MenuItemValue>[];
} & Parameters<typeof Root>[0];

export const RadioButtonCards = <MenuItemValue extends string>({
  className,
  value,
  onValueChange,
  radioItems,
  slotTop,
  slotBottom,
}: RadioButtonCardsProps<MenuItemValue>) => {
  return (
    <$Root value={value} onValueChange={onValueChange} className={className}>
      {slotTop}
      {radioItems.map((item) => (
        <$RadioButtonCard key={item.value} value={item.value} disabled={item.disabled}>
          <$CardHeader>
            {item.label}
            {value === item.value ? (
              <Icon
                iconName={IconName.Check}
                tw="h-1 w-1 rounded-[50%] bg-accent p-0.25 text-text-1"
              />
            ) : (
              <$EmptyIcon />
            )}
          </$CardHeader>
          {item.body}
        </$RadioButtonCard>
      ))}
      {slotBottom}
    </$Root>
  );
};
const $Root = styled(Root)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;

  --radio-button-cards-item-padding: ;
  --radio-button-cards-item-gap: ;
  --radio-button-cards-item-checked-backgroundColor: ;
  --radio-button-cards-item-disabled-backgroundColor: ;
  --radio-button-cards-item-backgroundColor: ;
  --radio-button-cards-item-header-font: ;
  --radio-button-cards-item-body-font: ;
`;

const $RadioButtonCard = styled(Item)`
  display: flex;
  flex-direction: column;
  border-radius: 0.625rem;
  background-color: var(--radio-button-cards-item-backgroundColor, transparent);
  border: 1px solid var(--color-layer-6);
  padding: var(--radio-button-cards-item-padding, 1rem);
  font: var(--radio-buttons-cards-item-body-font, var(--font-mini-book));
  text-align: left;
  gap: var(--radio-button-cards-item-gap, 0.5rem);

  &:disabled {
    cursor: default;
    background-color: var(--radio-button-cards-item-disabled-backgroundColor, transparent);
  }

  &[data-state='checked'] {
    background-color: var(--radio-button-cards-item-checked-backgroundColor, var(--color-layer-2));
  }
`;

const $CardHeader = styled.div`
  display: flex;
  flex: 1;
  align-self: stretch;
  align-items: center;
  color: var(--color-text-2);
  font: var(--radio-button-cards-item-header-font, var(--font-base-medium));
  justify-content: space-between;
  gap: 1rem;
`;
const $EmptyIcon = styled.div`
  width: 1rem;
  height: 1rem;

  box-shadow: 0 0 0 0.1rem var(--color-layer-5);
  border-radius: 50%;

  background-color: var(--color-layer-0);
`;
