import type {
  ButtonHTMLAttributes,
  FC,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
} from 'react';
import { forwardRef } from 'react';
import * as css from './form.css';

type FormGroupProps = HTMLAttributes<HTMLDivElement>;

export const FormGroup: FC<FormGroupProps> = ({ children, ...props }) => {
  return (
    <div css={css.formGroup} {...props}>
      {children}
    </div>
  );
};

type FormLabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const FormLabel: FC<FormLabelProps> = ({ children, ...props }) => {
  return (
    <label css={css.label} {...props}>
      {children}
    </label>
  );
};

type FormInputProps = InputHTMLAttributes<HTMLInputElement>;

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(({ ...props }, ref) => {
  return <input ref={ref} css={css.input} {...props} />;
});

FormInput.displayName = 'FormInput';

type FormButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const FormButton: FC<FormButtonProps> = ({ children, ...props }) => {
  return (
    <button css={css.button} {...props}>
      {children}
    </button>
  );
};
