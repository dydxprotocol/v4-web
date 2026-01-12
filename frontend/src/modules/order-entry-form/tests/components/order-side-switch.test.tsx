import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { OrderSideSwitch } from '../../src/components/order-side-switch.component';
import { OrderEntryFormTestWrapper } from '../test-utils';

describe('OrderSideSwitch', () => {
  it('renders long and short options', () => {
    render(
      <OrderEntryFormTestWrapper>
        <OrderSideSwitch />
      </OrderEntryFormTestWrapper>
    );

    expect(screen.getByText('Long')).toBeInTheDocument();
    expect(screen.getByText('Short')).toBeInTheDocument();
  });

  it('long is selected by default', () => {
    render(
      <OrderEntryFormTestWrapper>
        <OrderSideSwitch />
      </OrderEntryFormTestWrapper>
    );

    const longButton = screen.getByText('Long');
    expect(longButton).toHaveAttribute('data-state', 'active');
  });

  it('switches to short when clicked', async () => {
    const user = userEvent.setup();
    render(
      <OrderEntryFormTestWrapper>
        <OrderSideSwitch />
      </OrderEntryFormTestWrapper>
    );

    const shortButton = screen.getByText('Short');
    await user.click(shortButton);

    expect(shortButton).toHaveAttribute('data-state', 'active');
  });

  it('switches back to long when clicked', async () => {
    const user = userEvent.setup();
    render(
      <OrderEntryFormTestWrapper>
        <OrderSideSwitch />
      </OrderEntryFormTestWrapper>
    );

    const shortButton = screen.getByText('Short');
    await user.click(shortButton);

    const longButton = screen.getByText('Long');
    await user.click(longButton);

    expect(longButton).toHaveAttribute('data-state', 'active');
  });
});
