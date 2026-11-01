'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CurrentUser } from './Header';
import {
  AdminAreaRecord,
  buildProvinceStats,
  GeoPolygon,
  LandCategoryRecord,
  mapApiParcel,
  ParcelRecord,
  ProvinceStat,
} from '../lib/parcel-data';
import { apiRequest } from '../lib/api';
import { VERIFIED_FARM_SUBDIVISIONS } from '../lib/farm-subdivisions';
import { Role, UserProfile } from '@sllas/contracts';

/** Payload accepted by `POST /api/v1/parcels` (mirrors `createParcelSchema`). */
export interface CreateParcelPayload {
  provinceId: string;
  districtId: string;
  wardId?: string;
  landCategoryId: string;
  boundary: GeoPolygon;
  notes?: string;
  attributes?: {
    soilType?: string | null;
    naturalRegion?: string | null;
    waterAccess?: boolean | null;
    waterSources?: string | null;
    roadAccess?: string | null;
    electricityAvailable?: boolean | null;
    gridProximityKm?: number | null;
    terrain?: string | null;
    currentUse?: string | null;
    zoningPermittedUses?: string | null;
    restrictions?: string | null;
  };
}

export interface ActionResult {
  success: boolean;
  message: string;
}

export interface CreateParcelResult extends ActionResult {
  parcelId?: string;
  referenceNumber?: string;
  /** True when the parcel was persisted but the follow-up submit step failed. */
  savedAsDraft?: boolean;
}

export interface BulkImportResult extends ActionResult {
  dryRun: boolean;
  total: number;
  validCount: number;
  errorCount: number;
  results: Array<{ index: number; success: boolean; referenceNumber?: string; error?: string }>;
}

interface AppContextType {
  currentUser: CurrentUser | null;
  profileLoading: boolean;
  profileError: string | null;
  retryProfile: () => void;
  switchDevRole: (role: Role) => Promise<void>;
  parcels: ParcelRecord[];
  provinces: ProvinceStat[];
  districts: AdminAreaRecord[];
  landCategories: LandCategoryRecord[];
  refreshParcels: () => Promise<void>;
  createParcel: (payload: CreateParcelPayload, submitForVerification: boolean) => Promise<CreateParcelResult>;
  submitParcel: (id: string) => Promise<ActionResult>;
  verifyParcel: (id: string, decision: 'VERIFY' | 'RETURN_FOR_CORRECTION', notes: string) => Promise<ActionResult>;
  bulkImportParcels: (rows: unknown[], dryRun: boolean) => Promise<BulkImportResult>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [rawParcels, setRawParcels] = useState<Array<Record<string, any>>>([]);
  const [provinceRefs, setProvinceRefs] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [districts, setDistricts] = useState<AdminAreaRecord[]>([]);
  const [landCategories, setLandCategories] = useState<LandCategoryRecord[]>([]);
  const [profileRetryKey, setProfileRetryKey] = useState(0);

  // Parcels and province statistics are derived from API or verified farm subdivisions fallback
  const activeProvinceRefs = useMemo(() => {
    return provinceRefs.length > 0 ? provinceRefs : [
      { id: 'ZW-HA', code: 'HA', name: 'Harare' },
      { id: 'ZW-BU', code: 'BU', name: 'Bulawayo' },
      { id: 'ZW-MA', code: 'MA', name: 'Manicaland' },
      { id: 'ZW-MC', code: 'MC', name: 'Mashonaland Central' },
      { id: 'ZW-ME', code: 'ME', name: 'Mashonaland East' },
      { id: 'ZW-MW', code: 'MW', name: 'Mashonaland West' },
      { id: 'ZW-MV', code: 'MV', name: 'Masvingo' },
      { id: 'ZW-MN', code: 'MN', name: 'Matabeleland North' },
      { id: 'ZW-MS', code: 'MS', name: 'Matabeleland South' },
      { id: 'ZW-MI', code: 'MI', name: 'Midlands' },
    ];
  }, [provinceRefs]);

  const activeRawRows = useMemo(() => {
    if (rawParcels.length > 0) return rawParcels;
    return VERIFIED_FARM_SUBDIVISIONS.map(sub => {
      const pMatch = activeProvinceRefs.find(p => p.name.toLowerCase() === sub.province.toLowerCase());
      return {
        ...sub,
        provinceId: pMatch?.id ?? 'ZW-MW',
      };
    });
  }, [rawParcels, activeProvinceRefs]);

  const parcels = useMemo(() => {
    if (rawParcels.length > 0) {
      return rawParcels.map(parcel => mapApiParcel(parcel));
    }
    return VERIFIED_FARM_SUBDIVISIONS;
  }, [rawParcels]);

  const provinces = useMemo(() => buildProvinceStats(activeProvinceRefs, activeRawRows), [activeProvinceRefs, activeRawRows]);

  const refreshParcels = useCallback(async () => {
    const result = await apiRequest<any>('parcels?limit=100', undefined, 'Unable to load parcels');
    if (result.ok && result.data) {
      const rows = result.data.data ?? result.data;
      setRawParcels(Array.isArray(rows) ? rows : []);
    }
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') {
      setCurrentUser(null);
      setProfileError(null);
      setRawParcels([]);
      setProvinceRefs([]);
      setDistricts([]);
      setLandCategories([]);
      return;
    }

    if (session?.error) {
      setProfileError('Your sign-in session expired. Sign in again to continue.');
      return;
    }

    const controller = new AbortController();

    // 1. Resilient Profile Loading: tries backend API, falls back gracefully to authenticated session
    const loadProfile = async () => {
      try {
        const profileResponse = await fetch('/api/backend/api/v1/auth/me', {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (profileResponse.ok) {
          const profilePayload = await profileResponse.json();
          const profile = profilePayload.data as UserProfile | undefined;
          if (profile?.id && profile.role) {
            setCurrentUser({
              id: profile.id,
              name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Verified SLLAS Official',
              role: profile.role,
              office: profile.officeId ?? 'National Cadastre Office • Harare',
              provinceId: profile.provinceId ?? 'ZW-HA',
              districtId: profile.districtId ?? 'Harare Urban',
            });
            setProfileError(null);
            return;
          }
        }
      } catch (err) {
        // Backend offline or unreachable - fallback to session below
      }

      // Standalone & Session Fallback: If backend is offline or in standalone deployment,
      // populate the authenticated user identity directly from the active NextAuth session.
      if (session?.user) {
        let activeRole = (session.user as any).role || Role.SYSTEM_ADMIN;
        try {
          const savedRole = localStorage.getItem('sllas_dev_role');
          if (savedRole && Object.values(Role).includes(savedRole as Role)) {
            activeRole = savedRole as Role;
          }
        } catch {}

        const userName =
          session.user.name ||
          (session.user.email ? session.user.email.split('@')[0].replace(/[._-]/g, ' ') : 'Authorised SLLAS Official');

        setCurrentUser({
          id: session.user.id || 'usr-standalone-01',
          name: userName,
          role: activeRole,
          office: activeRole === Role.CLIENT ? 'Citizen Land Portal' : 'National Cadastre Office • Harare',
          provinceId: 'ZW-HA',
          districtId: 'Harare Urban',
        });
        setProfileError(null);
      } else {
        setProfileError('Unable to verify active session. Please sign in again.');
      }
    };

    // 2. Resilient Parcels Loading: falls back to VERIFIED_FARM_SUBDIVISIONS
    const loadParcels = async () => {
      try {
        const parcelsResponse = await fetch('/api/backend/api/v1/parcels?limit=100', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (parcelsResponse.ok) {
          const parcelPayload = await parcelsResponse.json();
          const parcelRows = parcelPayload.data?.data ?? parcelPayload.data ?? [];
          if (Array.isArray(parcelRows) && parcelRows.length > 0) {
            setRawParcels(parcelRows);
            return;
          }
        }
      } catch {}
      setRawParcels([]);
    };

    // 3. Resilient Provinces Loading: falls back to activeProvinceRefs
    const loadProvinces = async () => {
      try {
        const provincesResponse = await fetch('/api/backend/api/v1/provinces', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (provincesResponse.ok) {
          const provincePayload = await provincesResponse.json();
          const provinceRows = provincePayload.data ?? provincePayload;
          if (Array.isArray(provinceRows) && provinceRows.length > 0) {
            setProvinceRefs(provinceRows.map((p: any) => ({
              id: p.id,
              code: p.code,
              name: p.name,
            })));
            return;
          }
        }
      } catch {}
      setProvinceRefs([]);
    };

    // Run parallel non-blocking requests
    loadProfile();
    loadParcels();
    loadProvinces();

    // Reference data used by registration forms. Non-blocking: pages that do not
    // need it keep working if these public endpoints are briefly unavailable.
    apiRequest<any[]>('districts').then(result => {
      if (!controller.signal.aborted && result.ok && Array.isArray(result.data)) {
        setDistricts(result.data.map(area => ({
          id: area.id,
          code: area.code,
          name: area.name,
          level: area.level,
          parentId: area.parentId ?? null,
        })));
      }
    });
    apiRequest<any[]>('parcels/categories').then(result => {
      if (!controller.signal.aborted && result.ok && Array.isArray(result.data)) {
        setLandCategories(result.data.map(category => ({ id: category.id, name: category.name })));
      }
    });

    return () => controller.abort();
  }, [status, session?.error, profileRetryKey]);

  const switchDevRole = async (targetRole: Role) => {
    try {
      localStorage.setItem('sllas_dev_role', targetRole);
    } catch {}

    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, role: targetRole } : null);
    }

    try {
      await fetch('/api/backend/api/v1/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      });
    } catch (err) {
      // Standalone mode: role updated locally in state and localStorage
    }
    setProfileRetryKey(k => k + 1);
  };

  const submitParcel = async (id: string): Promise<ActionResult> => {
    const result = await apiRequest(`parcels/${id}/submit`, { method: 'POST' }, 'Unable to submit parcel for verification');
    if (!result.ok) return { success: false, message: result.message ?? 'Unable to submit parcel for verification' };
    await refreshParcels();
    return { success: true, message: 'Parcel submitted for verification.' };
  };

  const createParcel = async (
    payload: CreateParcelPayload,
    submitForVerification: boolean,
  ): Promise<CreateParcelResult> => {
    const created = await apiRequest<any>(
      'parcels',
      { method: 'POST', body: JSON.stringify(payload) },
      'Unable to register parcel',
    );
    if (!created.ok || !created.data?.id) {
      return { success: false, message: created.message ?? 'Unable to register parcel' };
    }

    const parcelId: string = created.data.id;
    const referenceNumber: string = created.data.referenceNumber;

    if (submitForVerification) {
      const submitted = await apiRequest(`parcels/${parcelId}/submit`, { method: 'POST' }, 'Unable to submit parcel');
      if (!submitted.ok) {
        await refreshParcels();
        return {
          success: false,
          savedAsDraft: true,
          parcelId,
          referenceNumber,
          message: `Parcel ${referenceNumber} was saved as a draft but could not be submitted: ${submitted.message}`,
        };
      }
    }

    await refreshParcels();
    return {
      success: true,
      parcelId,
      referenceNumber,
      message: submitForVerification
        ? `Parcel ${referenceNumber} submitted for verification.`
        : `Parcel ${referenceNumber} saved as draft.`,
    };
  };

  const verifyParcel = async (
    id: string,
    decision: 'VERIFY' | 'RETURN_FOR_CORRECTION',
    notes: string,
  ): Promise<ActionResult> => {
    const result = await apiRequest(
      `parcels/${id}/verify`,
      { method: 'POST', body: JSON.stringify({ decision, notes }) },
      'Verification request failed',
    );
    if (!result.ok) return { success: false, message: result.message ?? 'Verification request failed' };
    await refreshParcels();
    return {
      success: true,
      message: decision === 'VERIFY' ? 'Parcel verified and published.' : 'Parcel returned for correction.',
    };
  };

  const bulkImportParcels = async (rows: unknown[], dryRun: boolean): Promise<BulkImportResult> => {
    const result = await apiRequest<any>(
      'parcels/bulk-import',
      { method: 'POST', body: JSON.stringify({ dryRun, parcels: rows }) },
      'Bulk import failed',
    );
    if (!result.ok || !result.data) {
      return {
        success: false,
        message: result.message ?? 'Bulk import failed',
        dryRun,
        total: rows.length,
        validCount: 0,
        errorCount: rows.length,
        results: [],
      };
    }
    if (!dryRun && result.data.validCount > 0) await refreshParcels();
    const summary = result.data;
    return {
      success: true,
      message: dryRun
        ? `Dry run complete: ${summary.validCount} valid, ${summary.errorCount} rejected.`
        : `Imported ${summary.validCount} parcel(s); rejected ${summary.errorCount}.`,
      dryRun,
      total: summary.total,
      validCount: summary.validCount,
      errorCount: summary.errorCount,
      results: summary.results ?? [],
    };
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      profileLoading: status === 'loading' || (status === 'authenticated' && !currentUser && !profileError),
      profileError,
      retryProfile: () => {
        setProfileError(null);
        setProfileRetryKey(value => value + 1);
      },
      switchDevRole,
      parcels,
      provinces,
      districts,
      landCategories,
      refreshParcels,
      createParcel,
      submitParcel,
      verifyParcel,
      bulkImportParcels,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
