type ElementProps = {
  label?: React.ReactNode;
  children?: React.ReactNode;
  inputID?: string;
};

type StyleProps = {
  className?: string;
};

export const WithLabel = ({ label, inputID, children, className }: ElementProps & StyleProps) => (
  <div className={className} tw="grid gap-0.5 [--label-textColor:var(--color-text-1)]">
    <label htmlFor={inputID} tw="inlineRow text-[color:var(--label-textColor)] font-mini-book">
      {label}
    </label>
    {children}
  </div>
);
