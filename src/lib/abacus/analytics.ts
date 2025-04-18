import type { AbacusTrackingProtocol } from '@/constants/abacus';
import type { AnalyticsEvent } from '@/constants/analytics';

import { Nullable } from '@/lib/typeUtils';

import { track } from '../analytics/analytics';
import { log as telemetryLog } from '../telemetry';

class AbacusAnalytics implements AbacusTrackingProtocol {
  log(event: string, data: Nullable<string>) {
    try {
      const parsedData = data ? JSON.parse(data) : {};
      track({ type: event, payload: parsedData } as AnalyticsEvent);
    } catch (error) {
      telemetryLog('AbacusAnalytics/log', error);
    }
  }
}

export default AbacusAnalytics;
