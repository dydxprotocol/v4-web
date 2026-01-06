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

    expect(screen.getByText('BUY')).toBeInTheDocument();
    expect(screen.getByText('SELL')).toBeInTheDocument();
  });

  it('buy is selected by default', () => {
    render(
      <OrderEntryFormTestWrapper>
        <OrderSideSwitch />
      </OrderEntryFormTestWrapper>
    );

    const buyButton = screen.getByText('BUY');
    expect(buyButton).toHaveAttribute('data-state', 'active');
  });

  it('switches to sell when clicked', async () => {
    const user = userEvent.setup();
    render(
      <OrderEntryFormTestWrapper>
        <OrderSideSwitch />
      </OrderEntryFormTestWrapper>
    );

    const sellButton = screen.getByText('SELL');
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

    const sellButton = screen.getByText('SELL');
    await user.click(sellButton);

    const buyButton = screen.getByText('BUY');
    await user.click(buyButton);

    expect(buyButton).toHaveAttribute('data-state', 'active');
  });
});
