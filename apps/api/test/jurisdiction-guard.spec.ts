import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JurisdictionGuard } from '../src/common/guards/jurisdiction.guard';
import { Role } from '@sllas/contracts';

describe('JurisdictionGuard (Regional Boundary Scoping & IDOR Prevention)', () => {
  let guard: JurisdictionGuard;
  let reflector: Reflector;

  const HARARE_PROVINCE_ID = 'e1a11111-1111-4111-a111-111111111111';
  const MIDLANDS_PROVINCE_ID = 'e2b22222-2222-4222-b222-222222222222';
  const HARARE_URBAN_DISTRICT_ID = 'd1a11111-1111-4111-a111-111111111111';
  const CHITUNGWIZA_DISTRICT_ID = 'd2b22222-2222-4222-b222-222222222222';

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JurisdictionGuard(reflector);
  });

  const createMockContext = (
    user: any,
    body: any = {},
    params: any = {},
    query: any = {},
  ): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          body,
          params,
          query,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if route has no jurisdiction constraint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const context = createMockContext({ role: Role.REGISTRY_OFFICER, provinceId: HARARE_PROVINCE_ID });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow System Admin to access any province (nationwide authority)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ source: 'body', provinceField: 'provinceId' });
    const context = createMockContext(
      { role: Role.SYSTEM_ADMIN, provinceId: null },
      { provinceId: MIDLANDS_PROVINCE_ID },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow Auditor to inspect records from any province', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ source: 'body', provinceField: 'provinceId' });
    const context = createMockContext(
      { role: Role.AUDITOR, provinceId: null },
      { provinceId: MIDLANDS_PROVINCE_ID },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow Harare Officer to modify parcels in Harare Province', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ source: 'body', provinceField: 'provinceId' });
    const context = createMockContext(
      { role: Role.REGISTRY_OFFICER, provinceId: HARARE_PROVINCE_ID },
      { provinceId: HARARE_PROVINCE_ID },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should BLOCK Harare Officer from modifying Midlands Province parcel (Cross-jurisdiction violation)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ source: 'body', provinceField: 'provinceId' });
    const context = createMockContext(
      { role: Role.REGISTRY_OFFICER, provinceId: HARARE_PROVINCE_ID },
      { provinceId: MIDLANDS_PROVINCE_ID },
    );
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should BLOCK District Officer from acting outside their assigned district', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
      source: 'body',
      provinceField: 'provinceId',
      districtField: 'districtId',
    });
    const context = createMockContext(
      {
        role: Role.REGISTRY_OFFICER,
        provinceId: HARARE_PROVINCE_ID,
        districtId: HARARE_URBAN_DISTRICT_ID,
      },
      {
        provinceId: HARARE_PROVINCE_ID,
        districtId: CHITUNGWIZA_DISTRICT_ID,
      },
    );
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
