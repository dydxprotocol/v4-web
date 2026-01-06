import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { OrderExecutionSwitch } from '../../src/components/order-execution-switch.component';
import { OrderEntryFormTestWrapper } from '../test-utils';

describe('OrderExecutionSwitch', () => {
  it('renders market and limit options', () => {
    render(
      <OrderEntryFormTestWrapper>
        <OrderExecutionSwitch />
      </OrderEntryFormTestWrapper>
    );

    expect(screen.getByText('MARKET')).toBeInTheDocument();
    expect(screen.getByText('LIMIT')).toBeInTheDocument();
  });

  it('market is selected by default', () => {
    render(
      <OrderEntryFormTestWrapper>
        <OrderExecutionSwitch />
      </OrderEntryFormTestWrapper>
    );

    const marketButton = screen.getByText('MARKET');
    expect(marketButton).toHaveAttribute('data-state', 'active');
  });

  it('switches to limit when clicked', async () => {
    const user = userEvent.setup();
    render(
      <OrderEntryFormTestWrapper>
        <OrderExecutionSwitch />
      </OrderEntryFormTestWrapper>
    );

    const limitButton = screen.getByText('LIMIT');
    await user.click(limitButton);

    expect(limitButton).toHaveAttribute('data-state', 'active');
  });

  it('switches back to market when clicked', async () => {
    const user = userEvent.setup();
    render(
      <OrderEntryFormTestWrapper>
        <OrderExecutionSwitch />
      </OrderEntryFormTestWrapper>
    );

    const limitButton = screen.getByText('LIMIT');
    await user.click(limitButton);

    const marketButton = screen.getByText('MARKET');
    await user.click(marketButton);

    expect(marketButton).toHaveAttribute('data-state', 'active');
  });
});
