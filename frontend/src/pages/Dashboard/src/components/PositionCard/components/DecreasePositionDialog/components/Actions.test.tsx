import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog } from 'radix-ui';
import { describe, expect, it, vi } from 'vitest';
import { Actions } from './Actions';

const renderWithDialog = (ui: React.ReactElement) => {
  return render(
    <Dialog.Root open>
      <Dialog.Content>{ui}</Dialog.Content>
    </Dialog.Root>
  );
};

describe('Actions', () => {
  it('renders cancel and submit buttons', () => {
    renderWithDialog(
      <Actions submittable={true} onSubmit={vi.fn()} submitTitle="Decrease Position" />
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decrease Position' })).toBeInTheDocument();
  });

  it('displays custom submit title', () => {
    renderWithDialog(
      <Actions submittable={true} onSubmit={vi.fn()} submitTitle="Close Position" />
    );

    expect(screen.getByRole('button', { name: 'Close Position' })).toBeInTheDocument();
  });

  it('enables submit button when submittable is true', () => {
    renderWithDialog(
      <Actions submittable={true} onSubmit={vi.fn()} submitTitle="Decrease Position" />
    );

    expect(screen.getByRole('button', { name: 'Decrease Position' })).not.toBeDisabled();
  });

  it('disables submit button when submittable is false', () => {
    renderWithDialog(
      <Actions submittable={false} onSubmit={vi.fn()} submitTitle="Decrease Position" />
    );

    expect(screen.getByRole('button', { name: 'Decrease Position' })).toBeDisabled();
  });

  it('calls onSubmit when submit button is clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithDialog(<Actions submittable={true} onSubmit={onSubmit} submitTitle="Decrease" />);

    await user.click(screen.getByRole('button', { name: 'Decrease' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('disables submit button during async submission', async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        })
    );

    renderWithDialog(<Actions submittable={true} onSubmit={onSubmit} submitTitle="Decrease" />);

    const submitButton = screen.getByRole('button', { name: 'Decrease' });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();

    resolveSubmit!();
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('prevents multiple submissions while locked', async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        })
    );

    renderWithDialog(<Actions submittable={true} onSubmit={onSubmit} submitTitle="Decrease" />);

    const submitButton = screen.getByRole('button', { name: 'Decrease' });

    // First click
    await user.click(submitButton);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    // Second click while locked should not trigger
    await user.click(submitButton);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    resolveSubmit!();
  });
});
