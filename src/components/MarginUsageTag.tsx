import { useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Output, OutputType } from './Output';
import { Tag, TagSign, TagType } from './Tag';
import { WithTooltip } from './WithTooltip';

export const MarginUsageTag = ({ marginUsage }: { marginUsage: BigNumber | null | undefined }) => {
  const stringGetter = useStringGetter();

  const marginUsageUiOptions = useMemo(() => {
    if (marginUsage?.lt(0.2)) {
      return {
        marginLabel: stringGetter({ key: STRING_KEYS.LOW_RISK }),
        tagSign: TagSign.Positive,
      };
    }

    if (marginUsage?.lt(0.4)) {
      return {
        marginLabel: stringGetter({ key: STRING_KEYS.MEDIUM_RISK }),
        tagSign: TagSign.Warning,
      };
    }

    if (marginUsage?.gt(0.4)) {
      return {
        marginLabel: stringGetter({ key: STRING_KEYS.HIGH_RISK }),
        tagSign: TagSign.Negative,
      };
    }

    return {
      marginLabel: stringGetter({ key: STRING_KEYS.LOW_RISK }),
      tagSign: TagSign.Neutral,
    };
  }, [marginUsage, stringGetter]);

  return (
    <div tw="row gap-0.25">
      <WithTooltip tooltip="risk">
        <span tw="text-color-text-0">{marginUsageUiOptions.marginLabel}:</span>
      </WithTooltip>

      <Tag type={TagType.Number} sign={marginUsageUiOptions.tagSign}>
        <Output
          tw="font-tiny-book"
          value={marginUsage}
          type={OutputType.Percent}
          fractionDigits={0}
        />
      </Tag>
    </div>
  );
};
