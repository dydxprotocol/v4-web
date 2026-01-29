import type { FC } from 'react';
import { MinusIcon } from '@radix-ui/react-icons';
import { Tooltip } from '@radix-ui/themes';
import { PositionSide } from 'fuel-ts-sdk/trading';
import { useBoolean } from 'usehooks-ts';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { useRequiredContext } from '@/lib/useRequiredContext';
import { PositionCardContext } from '../lib/PositionCardContext';
import * as $ from './CardHeader.css';
import { DecreasePositionDialog } from './DecreasePositionDialog';

export const CardHeader: FC = () => {
  const modalOpenBoolean = useBoolean();
  const position = useRequiredContext(PositionCardContext);
  const tradingSdk = useTradingSdk();
  const asset = useSdkQuery(() => tradingSdk.getAssetById(position.assetId));

  const isLong = position.side === PositionSide.LONG;

  return (
    <div css={$.positionHeader}>
      <div css={$.assetId}>
        <span css={[$.side, isLong ? $.sideLong : $.sideShort]}>{isLong ? 'LONG' : 'SHORT'}</span>
        <div css={$.assetInfo}>
          <span css={$.assetSymbol}>{asset?.name}</span>
        </div>
      </div>
      <div css={$.headerActions}>
        <Tooltip content="Decrease or close position">
          <button className={$.iconButton} onClick={modalOpenBoolean.setTrue}>
            <MinusIcon />
          </button>
        </Tooltip>
      </div>

      {modalOpenBoolean && (
        <DecreasePositionDialog
          positionId={position.stableId}
          open={modalOpenBoolean.value}
          onOpenChange={modalOpenBoolean.setValue}
        />
      )}
    </div>
  );
};
