import { FormEvent, useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';

import { MOCK_DATA } from '@/constants/potentialMarkets';
import { useDydxClient } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';
import { SearchSelectMenu } from '@/components/SearchSelectMenu';

type InputProps = {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const Input = ({ label, ...props }: InputProps) => (
  <Styled.Label>
    <span>{label}</span>
    <input type="text" {...props} />
  </Styled.Label>
);

export const NewMarketForm = () => {
  const { compositeClient } = useDydxClient();
  const [assetToAdd, setAssetToAdd] = useState<(typeof MOCK_DATA)[number]>();

  return (
    <Styled.Form
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // compositeClient?.validatorClient.post.send()
      }}
    >
      <SearchSelectMenu
        items={[
          {
            group: 'chains',
            groupLabel: 'Chains',
            items: MOCK_DATA.map((potentialMarket: (typeof MOCK_DATA)[number]) => ({
              value: potentialMarket.symbol,
              label: `${potentialMarket.symbol}-USD`,
              onSelect: () => {
                setAssetToAdd(potentialMarket);
              },
            })),
          },
        ]}
        label="Chain"
      >
        Eth
      </SearchSelectMenu>
      <Input label="Market Name" />
      <Input label="Market Description" />
      <Input label="Ticker" />
    </Styled.Form>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Form = styled.form`
  ${layoutMixins.flexColumn}
  gap: 1rem;
`;

Styled.Label = styled.label`
  background-color: var(--color-layer-5);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
`;
