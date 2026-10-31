import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { MyServicesQueryDto } from './my-services-query.dto';

/**
 * The controller runs a ValidationPipe with forbidNonWhitelisted, so any query param the DTO
 * does not declare is a 400 — which is how minPrice/maxPrice failed before they were added.
 * These assert the validation contract itself; the service tests cover what the filters then do.
 *
 * Params arrive from Express as strings, so every case here passes strings.
 */
const validate = (raw: Record<string, unknown>) => {
  const dto = plainToInstance(MyServicesQueryDto, raw);
  return { dto, errors: validateSync(dto as object, { whitelist: true, forbidNonWhitelisted: true }) };
};

const base = { page: '1', limit: '10', sortBy: 'createdAt', order: 'DESC', status: 'to_do' };

describe('MyServicesQueryDto', () => {
  it('should accept the query string that previously returned 400', () => {
    const { errors } = validate({ ...base, minPrice: '0', maxPrice: '533' });
    expect(errors).toHaveLength(0);
  });

  it('should coerce price strings to numbers', () => {
    // Without @Type(() => Number) these stay strings and the SQL comparison silently misbehaves.
    const { dto } = validate({ ...base, minPrice: '0', maxPrice: '533' });
    expect(dto.minPrice).toBe(0);
    expect(dto.maxPrice).toBe(533);
    expect(typeof dto.minPrice).toBe('number');
  });

  it('should accept a decimal price bound', () => {
    // total_budget is numeric(10,2), so 533.50 is a legitimate bound.
    const { dto, errors } = validate({ ...base, maxPrice: '533.50' });
    expect(errors).toHaveLength(0);
    expect(dto.maxPrice).toBe(533.5);
  });

  it('should accept categoryId and locationText', () => {
    const { dto, errors } = validate({
      ...base,
      categoryId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      locationText: 'Bondi',
    });
    expect(errors).toHaveLength(0);
    expect(dto.categoryId).toBe('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    expect(dto.locationText).toBe('Bondi');
  });

  it('should accept the request with no filters at all', () => {
    expect(validate(base).errors).toHaveLength(0);
  });

  it.each([
    ['negative minPrice', { minPrice: '-5' }],
    ['non-numeric maxPrice', { maxPrice: 'abc' }],
    ['more than 2 decimal places', { maxPrice: '10.005' }],
    ['malformed categoryId', { categoryId: 'not-a-uuid' }],
    ['unknown property', { bogus: 'x' }],
    ['invalid status', { status: 'nonsense' }],
  ])('should reject %s', (_label, override) => {
    expect(validate({ ...base, ...override }).errors.length).toBeGreaterThan(0);
  });

  it('should still require status', () => {
    const { status, ...withoutStatus } = base;
    expect(validate(withoutStatus).errors.length).toBeGreaterThan(0);
  });
});
