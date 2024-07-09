import { ButtonSize } from '@/constants/buttons';

import { ToggleGroup } from '@/components/ToggleGroup';

type VaultPnlChartProps = { className?: string };

export const VaultPnlChart = ({ className }: VaultPnlChartProps) => {
  return (
    <div className={className}>
      <div>
        <div>
          {' '}
          <ToggleGroup
            size={ButtonSize.Small}
            items={[
              { value: 'pnl', label: 'Vault P&L' },
              { value: 'equity', label: 'Vault Equity' },
            ]}
            value="pnl"
            onValueChange={() => null}
          />
        </div>
        <div>
          <ToggleGroup
            size={ButtonSize.Small}
            items={[
              { value: '1d', label: '1d' },
              { value: '7d', label: '7d' },
              { value: '30d', label: '30d' },
            ]}
            value="7d"
            onValueChange={() => null}
          />
        </div>
      </div>
    </div>
  );
};
