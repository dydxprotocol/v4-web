import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { OrderModeSelect } from '../../src/components/order-mode-select.component';
import { OrderEntryFormTestWrapper } from '../test-utils';

describe('OrderModeSelect', () => {
  it('renders with default value', () => {
    render(
      <OrderEntryFormTestWrapper>
        <OrderModeSelect />
      </OrderEntryFormTestWrapper>
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays regular as default selected value', () => {
    render(
      <OrderEntryFormTestWrapper>
        <OrderModeSelect />
      </OrderEntryFormTestWrapper>
    );

    expect(screen.getByText('Regular')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', async () => {
    const user = userEvent.setup();
    render(
      <OrderEntryFormTestWrapper>
        <OrderModeSelect />
      </OrderEntryFormTestWrapper>
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    expect(screen.getByRole('option', { name: /Regular/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Stops/i })).toBeInTheDocument();
  });

  it('changes value when selecting a different option', async () => {
    const user = userEvent.setup();
    render(
      <OrderEntryFormTestWrapper>
        <OrderModeSelect />
      </OrderEntryFormTestWrapper>
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    const stopsOption = screen.getByRole('option', { name: /Stops/i });
    await user.click(stopsOption);

    expect(screen.getByText('Stops')).toBeInTheDocument();
  });
});
