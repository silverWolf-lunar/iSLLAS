'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../components/AppContext';

interface WaitingApplication {
  id: string;
  applicationNumber: string;
  waitingListNumber?: string;
  applicantId: string;
  proposedLandUse: string;
  hectaresRequested?: number;
  capitalInvestmentUsd?: number;
  createdAt: string;
  clientProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    verificationStatus: string;
  };
}

interface AvailableParcel {
  id: string;
  referenceNumber: string;
  areaHectares: number;
  landUse: string;
  status: string;
  provinceId: string;
  districtId: string;
}

export default function OfficerAllocationWorkbenchPage() {
  const { provinces, currentUser } = useApp();
  const [applications, setApplications] = useState<WaitingApplication[]>([]);
  const [parcels, setParcels] = useState<AvailableParcel[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected for allocation
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [selectedParcelId, setSelectedParcelId] = useState<string>('');

  // Allocation Terms
  const [annualRentUsd, setAnnualRentUsd] = useState<number>(1500);
  const [termYears, setTermYears] = useState<number>(99);
  const [permittedUse, setPermittedUse] = useState<string>('COMMERCIAL_CROPPING');
  const [isSubdivision, setIsSubdivision] = useState<boolean>(false);
  const [subdividedHectares, setSubdividedHectares] = useState<number>(50);
  const [notes, setNotes] = useState<string>('');

  const [allocating, setAllocating] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkbenchData();
  }, []);

  async function fetchWorkbenchData() {
    try {
      setLoading(true);
      const [appsRes, parcelsRes] = await Promise.allSettled([
        fetch('/api/backend/api/v1/applications/waiting-list?status=SUBMITTED'),
        fetch('/api/backend/api/v1/parcels?status=AVAILABLE'),
      ]);

      if (appsRes.status === 'fulfilled' && appsRes.value.ok) {
        const a = await appsRes.value.json();
        const appList = Array.isArray(a) ? a : (a.data || []);
        setApplications(appList);
        if (appList.length > 0 && !selectedAppId) {
          setSelectedAppId(appList[0].id);
        }
      }

      if (parcelsRes.status === 'fulfilled' && parcelsRes.value.ok) {
        const p = await parcelsRes.value.json();
        const parcelList = Array.isArray(p) ? p : (p.data || []);
        setParcels(parcelList);
        if (parcelList.length > 0 && !selectedParcelId) {
          setSelectedParcelId(parcelList[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load workbench data', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExecuteAllocation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAppId || !selectedParcelId) {
      setErrorMsg('Please select both a waiting list applicant and an available parcel.');
      return;
    }

    try {
      setAllocating(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const payload = {
        applicationId: selectedAppId,
        parcelId: selectedParcelId,
        proposedAnnualRentUsd: Number(annualRentUsd),
        leaseDurationYears: Number(termYears),
        permittedLandUse: permittedUse,
        allocationNotes: notes || `Allocated by Registry Officer ${currentUser?.name || ''} under Section 14 statutory guidelines.`,
        subdivisionDetails: isSubdivision ? {
          originalParcelId: selectedParcelId,
          allocatedAreaHectares: Number(subdividedHectares),
          approvedBySurveyorGeneral: true,
        } : undefined,
      };

      const res = await fetch('/api/backend/api/v1/applications/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Allocation failed');
      }

      setSuccessMsg('Parcel successfully allocated to applicant! Application has been forwarded to the Provincial Land Approval Board.');
      await fetchWorkbenchData();
      setNotes('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing allocation');
    } finally {
      setAllocating(false);
    }
  }

  const selectedApp = applications.find(a => a.id === selectedAppId);
  const selectedParcel = parcels.find(p => p.id === selectedParcelId);

  return (
    <div className="page-stack">
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link href="/officer" style={{ color: 'var(--primary-400)', fontSize: '0.8125rem' }}>
              ← Registry Officer Portal
            </Link>
            <span style={{ color: 'var(--text-dim)' }}>/</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Allocation Workbench</span>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: '#ffffff' }}>
            Cadastre Parcel Allocation Workbench
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Pair ranked applicants from the statutory waiting list with demarcated state parcels and formulate lease terms.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="glass-panel" style={{ padding: '14px 20px', background: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.4)', color: 'var(--primary-400)' }}>
          ✓ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="glass-panel" style={{ padding: '14px 20px', background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {loading ? (
        <p style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading workbench candidates…</p>
      ) : (
        <form onSubmit={handleExecuteAllocation}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* Column 1: Select Waiting List Applicant */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-500)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem' }}>
                  1
                </span>
                <h3 style={{ fontSize: '1.125rem', color: '#ffffff' }}>Waiting List Applicant</h3>
              </div>

              {applications.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                  No pending waiting list applications awaiting allocation.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Select Queued Application *
                    </label>
                    <select
                      className="glass-input"
                      value={selectedAppId}
                      onChange={e => setSelectedAppId(e.target.value)}
                    >
                      {applications.map(app => (
                        <option key={app.id} value={app.id}>
                          {app.waitingListNumber || app.applicationNumber} — {(app.proposedLandUse || (app as any).intendedActivity || 'Commercial Agriculture')?.replace(/_/g, ' ')} ({app.hectaresRequested || 50} ha)
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedApp && (
                    <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Waiting List No:</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-400)' }}>
                          {selectedApp.waitingListNumber || 'Unassigned'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Proposed Land Use:</span>
                        <span style={{ fontWeight: 600 }}>{(selectedApp.proposedLandUse || (selectedApp as any).intendedActivity || 'Commercial Agriculture')?.replace(/_/g, ' ')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Requested Area:</span>
                        <span style={{ fontWeight: 600 }}>{selectedApp.hectaresRequested || 50} Hectares</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Declared Capital:</span>
                        <span style={{ fontWeight: 600, color: 'var(--primary-400)' }}>
                          ${selectedApp.capitalInvestmentUsd?.toLocaleString() || '10,000'} USD
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Queued Since:</span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {new Date(selectedApp.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Column 2: Select Available Cadastre Parcel */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-500)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem' }}>
                  2
                </span>
                <h3 style={{ fontSize: '1.125rem', color: '#ffffff' }}>Demarcated State Parcel</h3>
              </div>

              {parcels.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                  No available surveyed parcels currently registered in this cadastre jurisdiction.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Select Available Parcel *
                    </label>
                    <select
                      className="glass-input"
                      value={selectedParcelId}
                      onChange={e => setSelectedParcelId(e.target.value)}
                    >
                      {parcels.map(parcel => (
                        <option key={parcel.id} value={parcel.id}>
                          {parcel.referenceNumber} — {parcel.areaHectares} ha ({parcel.landUse})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedParcel && (
                    <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cadastre Ref:</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-400)' }}>
                          {selectedParcel.referenceNumber}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Survey Area:</span>
                        <span style={{ fontWeight: 600 }}>{selectedParcel.areaHectares} Hectares</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Zoning Classification:</span>
                        <span style={{ fontWeight: 600 }}>{selectedParcel.landUse}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cadastre Status:</span>
                        <span style={{ color: 'var(--primary-400)', fontWeight: 600, fontSize: '0.8125rem' }}>
                          VERIFIED AVAILABLE
                        </span>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isSubdivision}
                        onChange={e => setIsSubdivision(e.target.checked)}
                      />
                      <span>Subdivide this parcel (allocate portion of parent farm)</span>
                    </label>
                  </div>

                  {isSubdivision && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        Subdivided Allocation Area (Hectares)
                      </label>
                      <input
                        type="number"
                        className="glass-input"
                        min={1}
                        max={selectedParcel?.areaHectares || 1000}
                        value={subdividedHectares}
                        onChange={e => setSubdividedHectares(Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Column 3: Allocation Terms & Covenants */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#60a5fa', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem' }}>
                  3
                </span>
                <h3 style={{ fontSize: '1.125rem', color: '#ffffff' }}>Statutory Lease Terms</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Statutory Lease Duration (Years)
                  </label>
                  <select
                    className="glass-input"
                    value={termYears}
                    onChange={e => setTermYears(Number(e.target.value))}
                  >
                    <option value={99}>99-Year Agricultural Leasehold (Standard)</option>
                    <option value={25}>25-Year Commercial Agro-Industrial Lease</option>
                    <option value={10}>10-Year Experimental / Forest Estate Lease</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Annual Ground Rental Assessment ($USD)
                  </label>
                  <input
                    type="number"
                    className="glass-input"
                    min={100}
                    step={50}
                    value={annualRentUsd}
                    onChange={e => setAnnualRentUsd(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Permitted Agricultural Undertaking
                  </label>
                  <select
                    className="glass-input"
                    value={permittedUse}
                    onChange={e => setPermittedUse(e.target.value)}
                  >
                    <option value="COMMERCIAL_CROPPING">Commercial Cropping & Grain Production</option>
                    <option value="LIVESTOCK_RANCHING">Cattle & Livestock Ranching</option>
                    <option value="HORTICULTURE_EXPORT">Export Horticulture & Irrigation Scheme</option>
                    <option value="AGRO_FORESTRY">Agro-Forestry & Silviculture</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Registry Officer Endorsement Notes
                  </label>
                  <textarea
                    className="glass-input"
                    rows={2}
                    placeholder="Enter cadastre boundary alignment confirmation and notes for Approver Board..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9375rem' }}>
                Forward Parcel to Provincial Land Board for Approval
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                Segregation of Duties policy enforces that an appointed Approver must review and authorize this allocation before offer release.
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={allocating || applications.length === 0 || parcels.length === 0}
              style={{ padding: '12px 28px', fontSize: '0.9375rem' }}
            >
              {allocating ? 'Executing Allocation…' : '✓ Execute Allocation & Forward to Board'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
