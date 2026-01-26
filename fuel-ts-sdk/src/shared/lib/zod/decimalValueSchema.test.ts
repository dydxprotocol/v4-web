import {
  DecimalValue,
  createDecimalValueSchema,
  isDecimalValue,
} from '@sdk/shared/models/DecimalValue';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { zodDecimalValueSchema } from './decimalValueSchema';

describe('zodDecimalValueSchema', () => {
  describe('parsing string values', () => {
    it('should parse string values as bigint strings', () => {
      const schema = z.object({ value: zodDecimalValueSchema() });
      const result = schema.parse({ value: '1000000000' });

      expect(isDecimalValue(result.value)).toBe(true);
      expect(result.value.value).toBe('1000000000');
    });

    it('should parse negative string values', () => {
      const schema = z.object({ value: zodDecimalValueSchema() });
      const result = schema.parse({ value: '-500000000' });

      expect(result.value.value).toBe('-500000000');
    });

    it('should parse zero string', () => {
      const schema = z.object({ value: zodDecimalValueSchema() });
      const result = schema.parse({ value: '0' });

      expect(result.value.value).toBe('0');
    });
  });

  describe('parsing bigint values', () => {
    it('should parse bigint values', () => {
      const schema = z.object({ value: zodDecimalValueSchema() });
      const result = schema.parse({ value: 1000000000n });

      expect(isDecimalValue(result.value)).toBe(true);
      expect(result.value.value).toBe('1000000000');
    });

    it('should parse negative bigint values', () => {
      const schema = z.object({ value: zodDecimalValueSchema() });
      const result = schema.parse({ value: -500000000n });

      expect(result.value.value).toBe('-500000000');
    });
  });

  describe('parsing number values', () => {
    it('should parse float number values', () => {
      const schema = z.object({ value: zodDecimalValueSchema() });
      const result = schema.parse({ value: 1.5 });

      expect(isDecimalValue(result.value)).toBe(true);
      // 1.5 with 9 decimals = 1500000000
      expect(result.value.value).toBe('1500000000');
    });

    it('should parse integer number values', () => {
      const schema = z.object({ value: zodDecimalValueSchema() });
      const result = schema.parse({ value: 10 });

      // 10 with 9 decimals = 10000000000
      expect(result.value.value).toBe('10000000000');
    });

    it('should parse zero number', () => {
      const schema = z.object({ value: zodDecimalValueSchema() });
      const result = schema.parse({ value: 0 });

      expect(result.value.value).toBe('0');
    });
  });

  describe('parsing existing DecimalValue instances', () => {
    it('should pass through existing DecimalValue instances', () => {
      const schema = z.object({ value: zodDecimalValueSchema() });
      const existingValue = DecimalValue.fromFloat(100);
      const result = schema.parse({ value: existingValue });

      expect(result.value).toBe(existingValue);
    });
  });

  describe('with custom schema', () => {
    it('should use provided schema decimals', () => {
      const CustomDecimals = createDecimalValueSchema(6, 'CustomDecimals');
      const schema = z.object({ value: zodDecimalValueSchema(CustomDecimals) });

      const result = schema.parse({ value: '1000000' });

      expect(result.value.decimals).toBe(6);
      expect(result.value.value).toBe('1000000');
    });

    it('should parse floats with custom decimals', () => {
      const CustomDecimals = createDecimalValueSchema(6, 'CustomDecimals');
      const schema = z.object({ value: zodDecimalValueSchema(CustomDecimals) });

      const result = schema.parse({ value: 1.5 });

      // 1.5 with 6 decimals = 1500000
      expect(result.value.value).toBe('1500000');
      expect(result.value.decimals).toBe(6);
    });

    it('should validate decimal instance with matching precision', () => {
      const CustomDecimals = createDecimalValueSchema(6, 'CustomDecimals');
      const schema = z.object({ value: zodDecimalValueSchema(CustomDecimals) });

      const existingValue = CustomDecimals.fromFloat(100);
      const result = schema.parse({ value: existingValue });

      expect(result.value).toBe(existingValue);
      expect(result.value.decimals).toBe(6);
    });
  });

  describe('error handling', () => {
    it('should throw for invalid value types', () => {
      const schema = z.object({ value: zodDecimalValueSchema() });

      expect(() => schema.parse({ value: { invalid: 'object' } })).toThrow();
    });

    it('should throw for null values', () => {
      const schema = z.object({ value: zodDecimalValueSchema() });

      expect(() => schema.parse({ value: null })).toThrow();
    });

    it('should throw for undefined values', () => {
      const schema = z.object({ value: zodDecimalValueSchema() });

      expect(() => schema.parse({ value: undefined })).toThrow();
    });
  });

  describe('array parsing', () => {
    it('should parse arrays of decimal values', () => {
      const schema = z.array(zodDecimalValueSchema());
      const result = schema.parse(['1000', '2000', 3.5]);

      expect(result).toHaveLength(3);
      expect(result[0].value).toBe('1000');
      expect(result[1].value).toBe('2000');
      expect(result[2].value).toBe('3500000000');
    });
  });

  describe('optional and nullable', () => {
    it('should work with optional modifier', () => {
      const schema = z.object({ value: zodDecimalValueSchema().optional() });

      expect(schema.parse({}).value).toBeUndefined();
      expect(schema.parse({ value: '100' }).value?.value).toBe('100');
    });

    it('should work with nullable modifier', () => {
      const schema = z.object({ value: zodDecimalValueSchema().nullable() });

      expect(schema.parse({ value: null }).value).toBeNull();
      expect(schema.parse({ value: '100' }).value?.value).toBe('100');
    });
  });
});
