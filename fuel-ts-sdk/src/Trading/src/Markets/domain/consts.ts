import { createDecimalValueSchema } from '@sdk/shared/models/DecimalValue';

export const ASSETS_MAX_LEVERAGE = createDecimalValueSchema(4).fromFloat(50);
