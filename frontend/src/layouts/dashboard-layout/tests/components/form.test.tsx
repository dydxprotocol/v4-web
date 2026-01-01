import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { FormButton, FormGroup, FormInput, FormLabel } from '../../src/components/form.component';

describe('Form Components', () => {
  describe('FormGroup', () => {
    it('renders children correctly', () => {
      render(
        <FormGroup>
          <div>Test content</div>
        </FormGroup>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  describe('FormLabel', () => {
    it('renders label text correctly', () => {
      render(<FormLabel htmlFor="test-input">Test Label</FormLabel>);

      const label = screen.getByText('Test Label');
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe('LABEL');
    });

    it('associates with input via htmlFor', () => {
      render(<FormLabel htmlFor="test-input">Test Label</FormLabel>);

      const label = screen.getByText('Test Label');
      expect(label).toHaveAttribute('for', 'test-input');
    });
  });

  describe('FormInput', () => {
    it('renders input with placeholder', () => {
      render(<FormInput placeholder="Enter text" />);

      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
    });

    it('accepts user input', async () => {
      const user = userEvent.setup();
      render(<FormInput placeholder="Enter text" />);

      const input = screen.getByPlaceholderText('Enter text') as HTMLInputElement;
      await user.type(input, 'test value');

      expect(input.value).toBe('test value');
    });

    it('calls onChange handler when value changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<FormInput placeholder="Enter text" onChange={handleChange} />);

      const input = screen.getByPlaceholderText('Enter text');
      await user.type(input, 'a');

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('FormButton', () => {
    it('renders button with text', () => {
      render(<FormButton>Click me</FormButton>);

      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('calls onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<FormButton onClick={handleClick}>Click me</FormButton>);

      const button = screen.getByText('Click me');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be disabled', () => {
      render(<FormButton disabled>Click me</FormButton>);

      const button = screen.getByText('Click me');
      expect(button).toBeDisabled();
    });

    it('supports different button types', () => {
      render(<FormButton type="submit">Submit</FormButton>);

      const button = screen.getByText('Submit');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });
});
