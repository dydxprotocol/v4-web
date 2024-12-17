export const TokenSelect = ({ onBack }: { onBack: () => void }) => {
  return (
    <div tw="flex flex-col items-start gap-0.375 p-1">
      <div>Token selector goes here!</div>
      <button type="button" onClick={onBack}>
        Go back
      </button>
    </div>
  );
};
