'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CurrentUser, DEV_USERS } from './Header';
import { ParcelRecord, INITIAL_PARCELS } from '../lib/parcel-data';
import { ParcelStatus, NaturalRegion, SoilType, UserProfile } from '@sllas/contracts';

interface AppContextType {
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser) => void;
  profileLoading: boolean;
  profileError: string | null;
  parcels: ParcelRecord[];
  addParcel: (p: Omit<ParcelRecord, 'id' | 'registeredAt' | 'registeredByUserId' | 'registeredByUserName'>) => ParcelRecord;
  updateParcelStatus: (id: string, status: ParcelStatus, notes?: string) => void;
  verifyParcel: (id: string, decision: 'VERIFY' | 'RETURN_FOR_CORRECTION', notes: string) => { success: boolean; message: string };
  bulkImportParcels: (parcelsData: Array<Partial<ParcelRecord>>) => { imported: number; failed: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(
    () => process.env.NODE_ENV === 'production' ? null : DEV_USERS[0],
  );
  const [profileError, setProfileError] = useState<string | null>(null);
  const [parcels, setParcels] = useState<ParcelRecord[]>(
    () => process.env.NODE_ENV === 'production' ? [] : INITIAL_PARCELS,
  );
  const profileLoading = status === 'loading' ||
    (status === 'authenticated' && currentUser === null && profileError === null);

  useEffect(() => {
    if (status !== 'authenticated') {
      setCurrentUser(process.env.NODE_ENV === 'production' ? null : DEV_USERS[0]);
      setProfileError(null);
      return;
    }

    if (session?.error) {
      setProfileError('Your sign-in session expired. Sign in again to continue.');
      return;
    }

    const controller = new AbortController();
    fetch('/api/backend/api/v1/auth/me', { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Account profile request failed (${response.status})`);
        }
        return response.json();
      })
      .then((response) => {
        const profile = response.data as UserProfile | undefined;
        if (!profile?.id || !profile.role) {
          throw new Error('The signed-in account is not provisioned for SLLAS');
        }
        setCurrentUser({
          id: profile.id,
          name: `${profile.firstName} ${profile.lastName}`.trim(),
          role: profile.role,
          office: profile.officeId ?? 'Unassigned office',
        });
        setProfileError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setProfileError(error instanceof Error ? error.message : 'Unable to load account profile');
      });

    return () => controller.abort();
  }, [status, session?.error]);

  // Load / persist state locally if in browser
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const saved = localStorage.getItem('sllas_parcels');
    if (saved) {
      try {
        setParcels(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved parcels', e);
      }
    }
  }, []);

  const saveParcels = (newParcels: ParcelRecord[]) => {
    setParcels(newParcels);
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      localStorage.setItem('sllas_parcels', JSON.stringify(newParcels));
    }
  };

  const addParcel = (p: Omit<ParcelRecord, 'id' | 'registeredAt' | 'registeredByUserId' | 'registeredByUserName'>): ParcelRecord => {
    if (!currentUser) throw new Error('The signed-in account profile is not available');
    const newRecord: ParcelRecord = {
      ...p,
      id: `prc-${Date.now()}`,
      registeredAt: new Date().toISOString(),
      registeredByUserId: currentUser.id,
      registeredByUserName: currentUser.name,
    };
    const updated = [newRecord, ...parcels];
    saveParcels(updated);
    return newRecord;
  };

  const updateParcelStatus = (id: string, status: ParcelStatus) => {
    const updated = parcels.map(p => {
      if (p.id === id) {
        return { ...p, status };
      }
      return p;
    });
    saveParcels(updated);
  };

  const verifyParcel = (
    id: string,
    decision: 'VERIFY' | 'RETURN_FOR_CORRECTION',
    notes: string,
  ): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'The signed-in account profile is not available.' };
    const target = parcels.find(p => p.id === id);
    if (!target) return { success: false, message: 'Parcel not found' };

    // Segregation of Duties validation: Registrar cannot verify own parcel!
    if (target.registeredByUserId === currentUser.id && currentUser.role !== 'SYSTEM_ADMIN') {
      return {
        success: false,
        message: 'Segregation of duties violation: You cannot verify or approve a parcel that you registered.',
      };
    }

    const nextStatus = decision === 'VERIFY' ? ParcelStatus.AVAILABLE : ParcelStatus.DRAFT;
    const updated = parcels.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: nextStatus,
          verification: {
            verifiedByUserId: currentUser.id,
            verifiedByUserName: currentUser.name,
            verifiedAt: new Date().toISOString(),
            decision,
            notes,
          },
        };
      }
      return p;
    });

    saveParcels(updated);
    return {
      success: true,
      message: decision === 'VERIFY'
        ? `Parcel ${target.referenceNumber} successfully verified and published to AVAILABLE.`
        : `Parcel ${target.referenceNumber} returned to DRAFT for corrections.`,
    };
  };

  const bulkImportParcels = (items: Array<Partial<ParcelRecord>>): { imported: number; failed: number } => {
    if (!currentUser) return { imported: 0, failed: items.length };
    let imported = 0;
    let failed = 0;
    const toAdd: ParcelRecord[] = [];

    for (const item of items) {
      if (!item.referenceNumber || !item.province || !item.boundary) {
        failed++;
        continue;
      }
      const record: ParcelRecord = {
        id: `prc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        referenceNumber: item.referenceNumber,
        name: item.name || `Imported Parcel ${item.referenceNumber}`,
        province: item.province,
        district: item.district || 'District Centre',
        ward: item.ward || 'Ward 1',
        landCategory: item.landCategory || 'State Land',
        areaHectares: item.areaHectares || 50,
        status: ParcelStatus.PENDING_VERIFICATION,
        boundary: item.boundary as any,
        centroid: item.centroid || { lat: -17.82, lng: 31.03 },
        naturalRegion: item.naturalRegion || NaturalRegion.II,
        soilType: item.soilType || (SoilType.LOAM as any),
        waterSources: item.waterSources || ['Groundwater'],
        roadAccess: item.roadAccess ?? true,
        electricityAccess: item.electricityAccess ?? false,
        gridProximityKm: item.gridProximityKm ?? 2.0,
        terrain: item.terrain || 'Flat Arable',
        currentUse: item.currentUse || 'Idle',
        permittedUses: item.permittedUses || ['Agriculture'],
        registeredByUserId: currentUser.id,
        registeredByUserName: currentUser.name,
        registeredAt: new Date().toISOString(),
      };
      toAdd.push(record);
      imported++;
    }

    if (toAdd.length > 0) {
      saveParcels([...toAdd, ...parcels]);
    }

    return { imported, failed };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        profileLoading,
        profileError,
        parcels,
        addParcel,
        updateParcelStatus,
        verifyParcel,
        bulkImportParcels,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
