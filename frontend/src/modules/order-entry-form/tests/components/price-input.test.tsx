import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PriceInput } from '../../src/components/price-input.component';
import { OrderEntryFormTestWrapper } from '../test-utils';

describe('PriceInput', () => {
  it('renders with label and placeholder', () => {
    render(
      <OrderEntryFormTestWrapper>
        <PriceInput />
      </OrderEntryFormTestWrapper>
    );

    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0')).toBeInTheDocument();
  });

  it('displays quote asset name as suffix', () => {
    render(
      <OrderEntryFormTestWrapper>
        <PriceInput />
      </OrderEntryFormTestWrapper>
    );

    expect(screen.getByText('USD')).toBeInTheDocument();
  });

  it('accepts numeric input', async () => {
    const user = userEvent.setup();
    render(
      <OrderEntryFormTestWrapper>
        <PriceInput />
      </OrderEntryFormTestWrapper>
    );

    const input = screen.getByPlaceholderText('0');
    await user.type(input, '1234.56');

    expect((input as HTMLInputElement).value).toBe('1234.56');
  });

  it('can clear input', async () => {
    const user = userEvent.setup();
    render(
      <OrderEntryFormTestWrapper>
        <PriceInput />
      </OrderEntryFormTestWrapper>
    );

    const input = screen.getByPlaceholderText('0');
    await user.type(input, '500');
    await user.clear(input);

    expect((input as HTMLInputElement).value).toBe('');
  });
});
