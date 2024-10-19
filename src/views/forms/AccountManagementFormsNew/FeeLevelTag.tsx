import { Tag, TagSign } from '@/components/Tag';

export enum FeeLevel {
  High = 'High',
  Low = 'Low',
}

type FeeLevelTagProps = {
  feeLevel: FeeLevel;
};

const feeLevelToSign = {
  [FeeLevel.High]: TagSign.Negative,
  [FeeLevel.Low]: TagSign.Positive,
};
// TODO [onboarding-rewrite]: add localization
export const FeeLevelTag = ({ feeLevel }: FeeLevelTagProps) => {
  return <Tag sign={feeLevelToSign[feeLevel]}>{feeLevel} Fees</Tag>;
};
