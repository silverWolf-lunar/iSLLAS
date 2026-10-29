import { SetMetadata } from '@nestjs/common';

export const JURISDICTION_CHECK_KEY = 'jurisdictionCheck';

export interface JurisdictionCheckOptions {
  /**
   * Where to extract the provinceId / districtId from:
   * 'body' | 'params' | 'query' | 'entity'
   */
  source?: 'body' | 'params' | 'query' | 'entity';
  provinceField?: string;
  districtField?: string;
}

export const RequireJurisdiction = (options: JurisdictionCheckOptions = { source: 'params' }) =>
  SetMetadata(JURISDICTION_CHECK_KEY, options);
