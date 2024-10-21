import { Tag, TagSign } from '@/components/Tag';

// TODO [onboarding-rewrite]: add localization
export const FeeLevelTag = ({ feeLevel }: { feeLevel: 'high' | 'low' }) => {
  if (feeLevel === 'high') {
    return <Tag sign={TagSign.Negative}>High fees</Tag>;
  }

  return <Tag sign={TagSign.Positive}>Low fees</Tag>;
};
