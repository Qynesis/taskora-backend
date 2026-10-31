import { ValueTransformer } from 'typeorm';

/**
 * TypeORM column transformer for numeric/decimal columns.
 * The pg driver returns NUMERIC/DECIMAL values as strings to preserve precision.
 * This transformer converts them back to JavaScript numbers on read.
 */
export const numericTransformer: ValueTransformer = {
  to: (value: number | null | undefined) => value,
  from: (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    const n = typeof value === 'number' ? value : parseFloat(value);
    return isNaN(n) ? null : n;
  },
};
