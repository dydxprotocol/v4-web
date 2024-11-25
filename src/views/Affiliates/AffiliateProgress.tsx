import { AffiliateProgressCard } from './cards/AffiliateProgressCard';

export const AffiliateProgress = ({ volume = 234.23 }: { volume?: number }) => {
  return (
    <div tw="flex flex-col gap-1">
      <AffiliateProgressCard tw="flex-1 bg-color-layer-5" volume={volume} />
      <div tw="flex flex-col gap-0.375">
        <div tw="text-color-text-0">Benefits</div>
        <ul tw="flex list-inside flex-col gap-0.375">
          <li>You can earn up to $3,000 per month for each trader.</li>
          <li>If you’re a VIP, you can earn up to $10,000 per month.</li>
          <li>The person you refer will save up to $550 in fees.</li>
        </ul>
      </div>
    </div>
  );
};
