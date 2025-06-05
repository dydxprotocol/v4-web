export const UnseenIndicator = ({ className }: { className?: string }) => {
  return (
    <div
      className={className}
      tw="size-[0.4375rem] min-h-[0.4375rem] min-w-[0.4375rem] rounded-[50%] bg-color-accent"
    />
  );
};
