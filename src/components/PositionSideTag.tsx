import { POSITION_SIDE_STRINGS, PositionSide } from '@/constants/trade';
import { useStringGetter } from '@/hooks';

import { Tag, TagSign, TagSize, TagType } from '@/components/Tag';

type ElementProps = {
  positionSide: PositionSide | null;
};

type StyleProps = {
  size?: TagSize;
};

export const positionSideTagSign: Record<PositionSide, TagSign> = {
  [PositionSide.Long]: TagSign.Positive,
  [PositionSide.Short]: TagSign.Negative,
  [PositionSide.None]: TagSign.Neutral,
};

export const PositionSideTag = ({ positionSide, size }: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();

  return (
    <Tag size={size} type={TagType.Side} sign={positionSideTagSign[positionSide || PositionSide.None]}>
      {stringGetter({ key: POSITION_SIDE_STRINGS[positionSide || PositionSide.None] })}
    </Tag>
  );
};
