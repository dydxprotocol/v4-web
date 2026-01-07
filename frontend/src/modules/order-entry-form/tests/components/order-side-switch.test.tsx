import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { OrderSideSwitch } from '../../src/components/order-side-switch.component';
import { OrderEntryFormTestWrapper } from '../test-utils';

describe('OrderSideSwitch', () => {
  it('renders buy and sell options', () => {
    render(
      <OrderEntryFormTestWrapper>
        <OrderSideSwitch />
      </OrderEntryFormTestWrapper>
    );

    expect(screen.getByText('Buy')).toBeInTheDocument();
    expect(screen.getByText('Sell')).toBeInTheDocument();
  });

  it('buy is selected by default', () => {
    render(
      <OrderEntryFormTestWrapper>
        <OrderSideSwitch />
      </OrderEntryFormTestWrapper>
    );

    const buyButton = screen.getByText('Buy');
    expect(buyButton).toHaveAttribute('data-state', 'active');
  });

  it('switches to sell when clicked', async () => {
    const user = userEvent.setup();
    render(
      <OrderEntryFormTestWrapper>
        <OrderSideSwitch />
      </OrderEntryFormTestWrapper>
    );

    const sellButton = screen.getByText('Sell');
    await user.click(sellButton);

    expect(sellButton).toHaveAttribute('data-state', 'active');
  });

  it('switches back to buy when clicked', async () => {
    const user = userEvent.setup();
    render(
      <OrderEntryFormTestWrapper>
        <OrderSideSwitch />
      </OrderEntryFormTestWrapper>
    );

    const sellButton = screen.getByText('Sell');
    await user.click(sellButton);

    const buyButton = screen.getByText('Buy');
    await user.click(buyButton);

    expect(buyButton).toHaveAttribute('data-state', 'active');
  });
});
