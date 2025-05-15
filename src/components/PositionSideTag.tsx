import { POSITION_SIDE_STRINGS, PositionSide } from '@/constants/trade';
import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Tag, TagSign, TagSize, TagType } from '@/components/Tag';

type ElementProps = {
  positionSide: PositionSide | null;
};

type StyleProps = {
  size?: TagSize;
};

const positionSideTagSign: Record<PositionSide, TagSign> = {
  [PositionSide.Long]: TagSign.Positive,
  [PositionSide.Short]: TagSign.Negative,
  [PositionSide.None]: TagSign.Neutral,
};

export const getPositionSideFromIndexerPositionSide = (
  positionSide: IndexerPositionSide | null
) => {
  if (positionSide == null) {
    return PositionSide.None;
  }

  return positionSide === IndexerPositionSide.LONG ? PositionSide.Long : PositionSide.Short;
};

export const PositionSideTag = ({ positionSide, size }: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();

  return (
    <Tag
      size={size}
      type={TagType.Side}
      sign={positionSideTagSign[positionSide ?? PositionSide.None]}
    >
      {stringGetter({ key: POSITION_SIDE_STRINGS[positionSide ?? PositionSide.None] })}
    </Tag>
  );
};
