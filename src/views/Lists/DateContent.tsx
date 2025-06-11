import { Output, OutputType } from '@/components/Output';

export const DateContent = ({
  className,
  time,
}: {
  className?: string;
  time: string | number | undefined;
}) => {
  return (
    <span className={className} tw="flex text-color-text-0 font-mini-book">
      <Output
        type={OutputType.Time}
        timeOptions={{ second: 'none' }}
        value={time}
        slotRight={<span tw="mx-0.25">•</span>}
      />
      <Output type={OutputType.Date} value={time} />
    </span>
  );
};
