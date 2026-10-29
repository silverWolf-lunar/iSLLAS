'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CurrentUser } from './Header';
import { mapApiParcel, ParcelRecord, ProvinceStat } from '../lib/parcel-data';
import { ParcelStatus, UserProfile } from '@sllas/contracts';

interface AppContextType {
  currentUser: CurrentUser | null;
  profileLoading: boolean;
  profileError: string | null;
  retryProfile: () => void;
  parcels: ParcelRecord[];
  provinces: ProvinceStat[];
  addParcel: (p: Omit<ParcelRecord, 'id' | 'registeredAt' | 'registeredByUserId' | 'registeredByUserName'>) => ParcelRecord;
  updateParcelStatus: (id: string, status: ParcelStatus, notes?: string) => void;
  verifyParcel: (id: string, decision: 'VERIFY' | 'RETURN_FOR_CORRECTION', notes: string) => Promise<{ success: boolean; message: string }>;
  bulkImportParcels: (parcelsData: Array<Partial<ParcelRecord>>) => { imported: number; failed: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [parcels, setParcels] = useState<ParcelRecord[]>([]);
  const [provinces, setProvinces] = useState<ProvinceStat[]>([]);
  const [profileRetryKey, setProfileRetryKey] = useState(0);

  useEffect(() => {
    if (status !== 'authenticated') {
      setCurrentUser(null);
      setProfileError(null);
      setParcels([]);
      setProvinces([]);
      return;
    }

    if (session?.error) {
      setProfileError('Your sign-in session expired. Sign in again to continue.');
      return;
    }

    const controller = new AbortController();
    Promise.all([
      fetch('/api/backend/api/v1/auth/me', { signal: controller.signal, cache: 'no-store' }),
      fetch('/api/backend/api/v1/parcels?limit=100', { signal: controller.signal, cache: 'no-store' }),
      fetch('/api/backend/api/v1/provinces', { signal: controller.signal, cache: 'no-store' }),
    ])
      .then(async ([profileResponse, parcelsResponse, provincesResponse]) => {
        const responses = [
          ['account', profileResponse],
          ['parcels', parcelsResponse],
          ['provinces', provincesResponse],
        ] as const;
        const failed = responses.find(([, response]) => !response.ok);
        if (failed) {
          const [resource, response] = failed;
          const errorPayload = await response.clone().json().catch(() => undefined);
          if (response.status === 401) {
            if (typeof errorPayload?.error === 'string' && (
              errorPayload.error.toLowerCase().includes('session') ||
              errorPayload.error.toLowerCase().includes('authentication required')
            )) {
              throw new Error('Your sign-in session expired. Sign in again to continue.');
            }
            throw new Error(
              resource === 'account'
                ? 'Your identity is authenticated but has not been provisioned for SLLAS.'
                : 'Your sign-in session expired. Sign in again to continue.',
            );
          }
          if (resource === 'account' && (response.status === 403 || response.status === 404)) {
            throw new Error('The signed-in account is not provisioned for SLLAS');
          }
          const correlationId = response.headers.get('x-correlation-id');
          throw new Error(
            correlationId
              ? `Unable to load ${resource} data (reference ${correlationId})`
              : `Unable to load ${resource} data`,
          );
        }
        return [
          await profileResponse.json(),
          await parcelsResponse.json(),
          await provincesResponse.json(),
        ];
      })
      .then(([profilePayload, parcelPayload, provincePayload]) => {
        const profile = profilePayload.data as UserProfile | undefined;
        if (!profile?.id || !profile.role) {
          throw new Error('The signed-in account is not provisioned for SLLAS');
        }
        setCurrentUser({
          id: profile.id,
          name: `${profile.firstName} ${profile.lastName}`.trim(),
          role: profile.role,
          office: profile.officeId ?? 'Unassigned office',
        });

        const parcelRows = parcelPayload.data?.data ?? parcelPayload.data ?? [];
        setParcels(parcelRows.map((parcel: Record<string, any>) => mapApiParcel(parcel)));

        const provinceRows = provincePayload.data ?? provincePayload;
        setProvinces(provinceRows.map((province: Record<string, any>) => ({
          id: province.id,
          code: province.code,
          name: province.name,
          totalParcels: 0,
          idleHectares: 0,
          availableHectares: 0,
          pendingCount: 0,
        })));
        setProfileError(null);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setProfileError(error instanceof Error ? error.message : 'Unable to load registry data');
        }
      });

    return () => controller.abort();
  }, [status, session?.error, profileRetryKey]);

  const addParcel = (): ParcelRecord => {
    throw new Error('Parcel creation requires persisted province, district, ward, and category identifiers');
  };

  const updateParcelStatus = (id: string, nextStatus: ParcelStatus): void => {
    throw new Error(`Parcel status changes must be submitted through the API: ${id} -> ${nextStatus}`);
  };

  const verifyParcel = async (
    id: string,
    decision: 'VERIFY' | 'RETURN_FOR_CORRECTION',
    notes: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/backend/api/v1/parcels/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, notes }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => undefined);
      return { success: false, message: payload?.message ?? 'Verification request failed' };
    }
    const payload = await response.json();
    const updated = payload.data ?? payload;
    setParcels(current => current.map(parcel => parcel.id === id ? mapApiParcel(updated) : parcel));
    return {
      success: true,
      message: decision === 'VERIFY' ? 'Parcel verified and published.' : 'Parcel returned for correction.',
    };
  };

  const bulkImportParcels = (items: Array<Partial<ParcelRecord>>): { imported: number; failed: number } => ({
    imported: 0,
    failed: items.length,
  });

  return (
    <AppContext.Provider value={{
      currentUser,
      profileLoading: status === 'loading' || (status === 'authenticated' && !currentUser && !profileError),
      profileError,
      retryProfile: () => {
        setProfileError(null);
        setProfileRetryKey(value => value + 1);
      },
      parcels,
      provinces,
      addParcel,
      updateParcelStatus,
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
