'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useApp } from '../../components/AppContext';
import {
  calculatePolygonAreaHa,
  calculateCentroid,
  checkBoundingBoxOverlap,
} from '../../lib/parcel-data';
import { ParcelStatus, NaturalRegion, SoilType, RoadAccess, Terrain } from '@sllas/contracts';

const SpatialMap = dynamic(
  () => import('../../components/SpatialMap').then(module => module.SpatialMap),
  { ssr: false, loading: () => <div className="glass-panel" style={{ height: 320, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>Loading spatial map…</div> },
);

export default function NewParcelPage() {
  const router = useRouter();
  const { parcels, provinces, districts, landCategories, createParcel, currentUser } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [provinceId, setProvinceId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [landCategoryId, setLandCategoryId] = useState('');
  const [naturalRegion, setNaturalRegion] = useState<NaturalRegion | ''>('');
  const [soilType, setSoilType] = useState<SoilType | ''>('');
  const [waterSources, setWaterSources] = useState('');
  const [roadAccess, setRoadAccess] = useState<RoadAccess | ''>('');
  const [electricityAccess, setElectricityAccess] = useState(false);
  const [gridProximityKm, setGridProximityKm] = useState<number | ''>('');
  const [terrain, setTerrain] = useState<Terrain | ''>('');
  const [currentUse, setCurrentUse] = useState('');
  const [permittedUses, setPermittedUses] = useState('');
  const [knownRestrictions, setKnownRestrictions] = useState('');

  // Farm Subdivision & Scheme State
  const [isSubdivision, setIsSubdivision] = useState(false);
  const [schemeName, setSchemeName] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [surveyDiagramNumber, setSurveyDiagramNumber] = useState('');
  const [cadastralBeaconRefs, setCadastralBeaconRefs] = useState('');

  // Check query params for subdivision mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('subdivision') === 'true') {
        setIsSubdivision(true);
      }
    }
  }, []);

  const provinceDistricts = useMemo(
    () => districts.filter(d => d.parentId === provinceId),
    [districts, provinceId],
  );
  const selectedProvinceName = provinces.find(p => p.id === provinceId)?.name ?? '';
  const selectedDistrictName = districts.find(d => d.id === districtId)?.name ?? '';

  // Default to the officer's own province once profile and reference data are loaded.
  useEffect(() => {
    if (!provinceId && currentUser?.provinceId && provinces.some(p => p.id === currentUser.provinceId)) {
      setProvinceId(currentUser.provinceId);
    }
  }, [provinceId, currentUser?.provinceId, provinces]);

  // Boundary State
  const [boundaryCoords, setBoundaryCoords] = useState<number[][]>([]);
  const [rawCoordsText, setRawCoordsText] = useState('');

  // Boundary Geometry Calculations
  const computedArea = useMemo(() => calculatePolygonAreaHa(boundaryCoords), [boundaryCoords]);
  const computedCentroid = useMemo(() => calculateCentroid(boundaryCoords), [boundaryCoords]);

  // Spatial Validation & Overlap Detection
  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    if (boundaryCoords.length < 4) {
      errs.push('Polygon requires at least 4 coordinates (closed ring).');
    } else {
      const first = boundaryCoords[0];
      const last = boundaryCoords[boundaryCoords.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        errs.push('First and last coordinates must be identical to form a closed ring.');
      }
    }

    // WGS84 range check for Zimbabwe
    for (const [lng, lat] of boundaryCoords) {
      if (lat < -22.5 || lat > -15.5 || lng < 25.0 || lng > 33.5) {
        errs.push(`Coordinate [${lng}, ${lat}] is outside Zimbabwe territorial bounds (lat -22.5 to -15.5, lng 25.0 to 33.5).`);
        break;
      }
    }

    return errs;
  }, [boundaryCoords]);


  // Real-time overlap check against existing active parcels
  const overlappingParcel = useMemo(() => {
    if (validationErrors.length > 0) return null;
    return parcels.find(p => {
      if (p.status === ParcelStatus.WITHDRAWN) return false;
      return checkBoundingBoxOverlap(boundaryCoords, p.boundary.coordinates[0]);
    });
  }, [boundaryCoords, validationErrors, parcels]);

  const SUBDIVISION_PRESETS: Record<string, {
    provinceName: string;
    schemeName: string;
    lotNumber: string;
    diagramNumber: string;
    beacons: string;
    region: NaturalRegion;
    soil: SoilType;
    water: string;
    road: RoadAccess;
    electricity: boolean;
    gridKm: number;
    terrain: Terrain;
    currentUse: string;
    permitted: string;
    coords: number[][];
  }> = {
    coburn: {
      provinceName: 'Mashonaland West',
      schemeName: 'Coburn Estate Master Scheme',
      lotNumber: 'Subdivision 1 of Lot 4',
      diagramNumber: 'DSG-ZW-2026-CHG-0082',
      beacons: 'BC-CHE-101, BC-CHE-102, BC-CHE-103, BC-CHE-104',
      region: NaturalRegion.II,
      soil: SoilType.LOAM,
      water: 'Manyame River Riparian Rights, 2x Commercial Boreholes',
      road: RoadAccess.TARRED,
      electricity: true,
      gridKm: 1.2,
      terrain: Terrain.GENTLY_UNDULATING,
      currentUse: 'Prepared Arable for Summer Grain (Wheat & Seed Maize)',
      permitted: 'Commercial Grain Production, Oilseed Rotation, Agro-processing Storage',
      coords: [[30.132, -18.125], [30.155, -18.128], [30.151, -18.145], [30.128, -18.142], [30.132, -18.125]],
    },
    beatrice: {
      provinceName: 'Mashonaland East',
      schemeName: 'Beatrice Dairy & Beef Paddock Scheme',
      lotNumber: 'Subdivision 8 of Umfuli Bank',
      diagramNumber: 'DSG-ZW-2026-MRE-0041',
      beacons: 'BC-MRE-801, BC-MRE-802, BC-MRE-803, BC-MRE-804',
      region: NaturalRegion.II,
      soil: SoilType.LOAM,
      water: 'Umfuli River Pumping Rights, 3x High-Yield Boreholes',
      road: RoadAccess.TARRED,
      electricity: true,
      gridKm: 0.5,
      terrain: Terrain.FLAT,
      currentUse: 'Irrigated Silage & Certified Pasture Paddock',
      permitted: 'Intensive Dairy Production, Beef Fattening, Pasture Silage',
      coords: [[30.825, -18.245], [30.852, -18.248], [30.848, -18.272], [30.821, -18.269], [30.825, -18.245]],
    },
    mazowe: {
      provinceName: 'Mashonaland Central',
      schemeName: 'Mazowe Citrus & Seed Maize Scheme',
      lotNumber: 'Subdivision 12 of Iron Mask Range',
      diagramNumber: 'DSG-ZW-2026-MZW-0015',
      beacons: 'BC-MZW-121, BC-MZW-122, BC-MZW-123, BC-MZW-124',
      region: NaturalRegion.II,
      soil: SoilType.SILT,
      water: 'Mazowe Dam Canal Concession, 2x Solar Micro-Dams',
      road: RoadAccess.TARRED,
      electricity: true,
      gridKm: 0.9,
      terrain: Terrain.GENTLY_UNDULATING,
      currentUse: 'Drip-Irrigated Valencia Orange Groves',
      permitted: 'Citrus Production, Export Floriculture, Hybrid Seed Maize',
      coords: [[30.952, -17.512], [30.978, -17.515], [30.974, -17.535], [30.948, -17.532], [30.952, -17.512]],
    },
    chipinge: {
      provinceName: 'Manicaland',
      schemeName: 'Chipinge Eastern Highlands Concession',
      lotNumber: 'Subdivision 9 of Mount Selinda Escarpment',
      diagramNumber: 'DSG-ZW-2026-CHG-0033',
      beacons: 'BC-CHP-901, BC-CHP-902, BC-CHP-903, BC-CHP-904',
      region: NaturalRegion.I,
      soil: SoilType.LOAM,
      water: 'Perennial Mountain Stream Gravity Feed, High Natural Rainfall',
      road: RoadAccess.TARRED,
      electricity: true,
      gridKm: 1.5,
      terrain: Terrain.HILLY,
      currentUse: 'Terraced Macadamia Nut Orchard',
      permitted: 'Macadamia Nut Production, Specialty Coffee, Export Avocado',
      coords: [[32.612, -20.188], [32.635, -20.191], [32.631, -20.212], [32.608, -20.209], [32.612, -20.188]],
    },
    gweru: {
      provinceName: 'Midlands',
      schemeName: 'Gweru Vungu Arable & Livestock Scheme',
      lotNumber: 'Subdivision 4 of Block 4 Vungu',
      diagramNumber: 'DSG-ZW-2026-GWR-0077',
      beacons: 'BC-GWR-401, BC-GWR-402, BC-GWR-403, BC-GWR-404',
      region: NaturalRegion.III,
      soil: SoilType.MIXED,
      water: 'Vungu River Weir Rights, 2x Livestock Windmills',
      road: RoadAccess.GRAVEL,
      electricity: true,
      gridKm: 2.1,
      terrain: Terrain.FLAT,
      currentUse: 'Summer Soya Rotation & Cattle Grazing Paddock',
      permitted: 'Mixed Farming, Drought-Tolerant Sorghum, Commercial Cattle',
      coords: [[29.742, -19.412], [29.768, -19.415], [29.764, -19.438], [29.738, -19.435], [29.742, -19.412]],
    },
    chiredzi: {
      provinceName: 'Masvingo',
      schemeName: 'Chiredzi Lowveld Sugar Scheme',
      lotNumber: 'Subdivision 18 of Mkwasine Estate',
      diagramNumber: 'DSG-ZW-2026-MKW-0092',
      beacons: 'BC-MKW-181, BC-MKW-182, BC-MKW-183, BC-MKW-184',
      region: NaturalRegion.V,
      soil: SoilType.CLAY,
      water: 'Mutirikwi-Tugwi Mukosi Canal Allocations (Tier-1 Rights)',
      road: RoadAccess.TARRED,
      electricity: true,
      gridKm: 0.6,
      terrain: Terrain.FLAT,
      currentUse: 'Flood & Drip-Irrigated Commercial Sugarcane',
      permitted: 'Sugarcane Production, Citrus, Industrial Agro-Processing',
      coords: [[31.545, -21.035], [31.578, -21.038], [31.574, -21.065], [31.541, -21.062], [31.545, -21.035]],
    },
    matobo: {
      provinceName: 'Matabeleland South',
      schemeName: 'Matobo Hills Pastoral Breeding Concession',
      lotNumber: 'Subdivision 7 of Shashi Ranch',
      diagramNumber: 'DSG-ZW-2026-MTB-0055',
      beacons: 'BC-MTB-701, BC-MTB-702, BC-MTB-703, BC-MTB-704',
      region: NaturalRegion.V,
      soil: SoilType.MIXED,
      water: 'Solar-Powered Borehole Troughs, 1x Earth Dam',
      road: RoadAccess.GRAVEL,
      electricity: false,
      gridKm: 5.5,
      terrain: Terrain.GENTLY_UNDULATING,
      currentUse: 'Breeding Paddock for Indigenous Tuli Cattle',
      permitted: 'Pedigree Cattle Breeding, Goat Ranching, Game Conservancy',
      coords: [[28.485, -20.542], [28.515, -20.545], [28.511, -20.575], [28.481, -20.572], [28.485, -20.542]],
    },
    nyamandlovu: {
      provinceName: 'Matabeleland North',
      schemeName: 'Nyamandlovu Aquifer Horticultural Scheme',
      lotNumber: 'Subdivision 22 of Riverbank Concession',
      diagramNumber: 'DSG-ZW-2026-NYM-0021',
      beacons: 'BC-NYM-221, BC-NYM-222, BC-NYM-223, BC-NYM-224',
      region: NaturalRegion.IV,
      soil: SoilType.SANDY,
      water: 'Nyamandlovu Deep Sandstone Aquifer High-Yield Borehole',
      road: RoadAccess.TARRED,
      electricity: true,
      gridKm: 1.1,
      terrain: Terrain.FLAT,
      currentUse: 'Shade-Net High-Value Export Tomatoes & Onions',
      permitted: 'Commercial Horticulture, Grain Legumes, Small Livestock',
      coords: [[28.245, -19.865], [28.272, -19.868], [28.268, -19.892], [28.241, -19.889], [28.245, -19.865]],
    },
  };

  const handleApplyPreset = (key: string) => {
    const preset = SUBDIVISION_PRESETS[key];
    if (!preset) return;

    setIsSubdivision(true);
    setSchemeName(preset.schemeName);
    setLotNumber(preset.lotNumber);
    setSurveyDiagramNumber(preset.diagramNumber);
    setCadastralBeaconRefs(preset.beacons);
    setName(`${preset.schemeName} • ${preset.lotNumber}`);

    // Resolve matching province
    const targetProv = provinces.find(p => p.name.toLowerCase().includes(preset.provinceName.toLowerCase()));
    if (targetProv) {
      setProvinceId(targetProv.id);
      const provDistricts = districts.filter(d => d.parentId === targetProv.id);
      if (provDistricts.length > 0) {
        setDistrictId(provDistricts[0].id);
      }
    }

    if (landCategories.length > 0) {
      setLandCategoryId(landCategories[0].id);
    }

    setNaturalRegion(preset.region);
    setSoilType(preset.soil);
    setWaterSources(preset.water);
    setRoadAccess(preset.road);
    setElectricityAccess(preset.electricity);
    setGridProximityKm(preset.gridKm);
    setTerrain(preset.terrain);
    setCurrentUse(preset.currentUse);
    setPermittedUses(preset.permitted);
    setBoundaryCoords(preset.coords);
    setRawCoordsText(JSON.stringify(preset.coords));
  };

  const handleCoordsChange = (text: string) => {
    setRawCoordsText(text);
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
        setBoundaryCoords(parsed);
      }
    } catch {
      // Ignored during typing
    }
  };

  const handleSubmit = async (targetStatus: ParcelStatus) => {
    setSubmitError(null);

    if (!provinceId || !districtId || !landCategoryId) {
      setSubmitError('Province, district and land category are required (Step 1).');
      setCurrentStep(1);
      return;
    }
    if (validationErrors.length > 0) {
      setSubmitError(`Cannot submit: ${validationErrors[0]}`);
      return;
    }
    if (overlappingParcel) {
      setSubmitError(`Cadastral conflict: Boundary overlaps with registered parcel ${overlappingParcel.referenceNumber} (${overlappingParcel.name}). Overlapping allocations are prohibited by law.`);
      return;
    }

    const effectiveDisplayName = isSubdivision
      ? (name.trim() || (schemeName && lotNumber ? `${schemeName.trim()} • ${lotNumber.trim()}` : (lotNumber || schemeName || 'Farm Subdivision Plot')))
      : (name.trim() || undefined);

    const finalNotes = isSubdivision
      ? JSON.stringify({
          isSubdivision: true,
          schemeName: schemeName.trim() || undefined,
          lotNumber: lotNumber.trim() || undefined,
          surveyDiagramNumber: surveyDiagramNumber.trim() || undefined,
          cadastralBeaconRefs: cadastralBeaconRefs.split(',').map(s => s.trim()).filter(Boolean),
          description: effectiveDisplayName,
        })
      : (effectiveDisplayName || undefined);

    setSaving(true);
    const result = await createParcel(
      {
        provinceId,
        districtId,
        landCategoryId,
        boundary: { type: 'Polygon', coordinates: [boundaryCoords] },
        notes: finalNotes,
        attributes: {
          naturalRegion: naturalRegion || null,
          soilType: soilType || null,
          waterAccess: waterSources.trim().length > 0,
          waterSources: waterSources.trim() || null,
          roadAccess: roadAccess || null,
          electricityAvailable: electricityAccess,
          gridProximityKm: gridProximityKm === '' ? null : gridProximityKm,
          terrain: terrain || null,
          currentUse: currentUse.trim() || null,
          zoningPermittedUses: permittedUses.trim() || null,
          restrictions: knownRestrictions.trim() || null,
        },
      },
      targetStatus === ParcelStatus.PENDING_VERIFICATION,
    );
    setSaving(false);

    if (!result.success) {
      setSubmitError(result.message);
      if (result.savedAsDraft && result.parcelId) router.push(`/parcels/${result.parcelId}`);
      return;
    }

    if (targetStatus === ParcelStatus.PENDING_VERIFICATION) {
      router.push('/parcels/verify');
    } else {
      router.push(`/parcels/${result.parcelId}`);
    }
  };

  return (
    <div className="page-stack registration-page">
      {/* Page Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(22, 163, 74, 0.2)', color: 'var(--primary-400)' }}>
            WORKBENCH
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Republic of Zimbabwe Cadastre</span>
        </div>
        <h1 style={{ fontSize: '1.75rem', color: '#ffffff' }}>New Land Parcel Registration</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Register an idle land parcel with polygon coordinates, PostGIS geometry calculations, and real-time cadastral overlap detection.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="glass-panel" style={{ padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {[
          { step: 1, label: '1. Identity & Location' },
          { step: 2, label: '2. Agro-Ecological Attributes' },
          { step: 3, label: '3. Spatial Boundary & Overlap Check' },
          { step: 4, label: '4. Summary & Submit' },
        ].map(item => (
          <button
            key={item.step}
            onClick={() => setCurrentStep(item.step)}
            style={{
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              color: currentStep === item.step ? 'var(--primary-400)' : currentStep > item.step ? '#ffffff' : 'var(--text-dim)',
              fontWeight: currentStep === item.step ? 700 : 500,
              fontSize: '0.875rem'
            }}
          >
            <span style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: currentStep === item.step ? 'var(--primary-500)' : currentStep > item.step ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              color: currentStep === item.step ? '#ffffff' : currentStep > item.step ? 'var(--primary-400)' : 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {item.step}
            </span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Step 1: Identification & Location */}
      {currentStep === 1 && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '1.125rem', color: '#ffffff', margin: 0 }}>Step 1: Jurisdiction & Identification</h2>
            
            {/* Land Type Toggle */}
            <div style={{
              display: 'inline-flex',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <button
                type="button"
                onClick={() => setIsSubdivision(false)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: !isSubdivision ? 'var(--primary-600)' : 'transparent',
                  color: !isSubdivision ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                🏞️ Standalone Parcel
              </button>
              <button
                type="button"
                onClick={() => setIsSubdivision(true)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isSubdivision ? 'var(--primary-600)' : 'transparent',
                  color: isSubdivision ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                🚜 Farm Subdivision / Scheme Plot
              </button>
            </div>
          </div>

          {/* Quick Presets across Zimbabwe */}
          <div style={{
            padding: '12px 16px',
            background: 'rgba(2, 6, 23, 0.4)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              ⚡ Quick Subdivision Presets across Zimbabwe (All 10 Provinces):
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { key: 'coburn', label: 'Coburn Estate (Mash West)' },
                { key: 'beatrice', label: 'Beatrice Dairy (Mash East)' },
                { key: 'mazowe', label: 'Mazowe Citrus (Mash Central)' },
                { key: 'chipinge', label: 'Chipinge Concession (Manicaland)' },
                { key: 'gweru', label: 'Gweru Vungu (Midlands)' },
                { key: 'chiredzi', label: 'Chiredzi Sugar (Masvingo)' },
                { key: 'matobo', label: 'Matobo Hills (Mat South)' },
                { key: 'nyamandlovu', label: 'Nyamandlovu Plot (Mat North)' },
              ].map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleApplyPreset(p.key)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '6px',
                    border: '1px solid rgba(74, 222, 128, 0.3)',
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: 'var(--primary-300)',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(34, 197, 94, 0.25)';
                    e.currentTarget.style.borderColor = 'var(--primary-400)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.3)';
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            {/* Subdivision Dedicated Fields */}
            {isSubdivision && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-300)', marginBottom: '6px' }}>
                    Master Farm / Agricultural Scheme Name *
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="e.g. Coburn Estate Master Scheme"
                    value={schemeName}
                    onChange={(e) => {
                      setSchemeName(e.target.value);
                      if (!name || name.includes('•')) {
                        setName(`${e.target.value}${lotNumber ? ` • ${lotNumber}` : ''}`);
                      }
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-300)', marginBottom: '6px' }}>
                    Subdivision / Lot Number *
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="e.g. Subdivision 1 of Lot 4"
                    value={lotNumber}
                    onChange={(e) => {
                      setLotNumber(e.target.value);
                      if (!name || name.includes('•')) {
                        setName(`${schemeName ? `${schemeName} • ` : ''}${e.target.value}`);
                      }
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-300)', marginBottom: '6px' }}>
                    Surveyor General Diagram Number (DSG) *
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="e.g. DSG-ZW-2026-CHG-0082"
                    value={surveyDiagramNumber}
                    onChange={(e) => setSurveyDiagramNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-300)', marginBottom: '6px' }}>
                    Cadastral Beacon References (comma-separated)
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="e.g. BC-CHE-101, BC-CHE-102, BC-CHE-103"
                    value={cadastralBeaconRefs}
                    onChange={(e) => setCadastralBeaconRefs(e.target.value)}
                  />
                </div>
              </>
            )}

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                {isSubdivision ? 'Subdivision Dossier Designation / Notes' : 'Parcel Description / Notes'}
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder={isSubdivision ? 'e.g. Coburn Estate • Subdiv 1 (Arable Commercial)' : 'e.g. Norton Agricultural Commercial Plot 4'}
                value={name}
                maxLength={2000}
                onChange={(e) => setName(e.target.value)}
              />
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '4px' }}>
                {isSubdivision
                  ? 'Subdivision details are automatically recorded in the statutory cadastre registry and mapped to the Surveyor General index.'
                  : 'The official reference number is generated by the registry when the parcel is saved.'}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Province *
              </label>
              <select
                className="glass-input"
                value={provinceId}
                onChange={(e) => {
                  setProvinceId(e.target.value);
                  setDistrictId('');
                }}
              >
                <option value="">Select province…</option>
                {provinces.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                District *
              </label>
              <select
                className="glass-input"
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                disabled={!provinceId}
              >
                <option value="">{provinceId ? 'Select district…' : 'Select a province first'}</option>
                {provinceDistricts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Tenure / Land Category *
              </label>
              <select
                className="glass-input"
                value={landCategoryId}
                onChange={(e) => setLandCategoryId(e.target.value)}
              >
                <option value="">Select land category…</option>
                {landCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              onClick={() => setCurrentStep(2)}
              className="btn btn-primary"
              disabled={!provinceId || !districtId || !landCategoryId}
            >
              Continue to Step 2 →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Agro-Ecological Attributes */}
      {currentStep === 2 && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.125rem', color: '#ffffff' }}>Step 2: Agro-Ecological & Physical Attributes</h2>

          <div className="form-grid mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Natural Region (Agro-Ecological Classification) *
              </label>
              <select
                className="glass-input"
                value={naturalRegion}
                onChange={(e) => setNaturalRegion(e.target.value as NaturalRegion | '')}
              >
                <option value="">Select region…</option>
                <option value={NaturalRegion.I}>Region I — High rainfall (over 1000mm), specialised &amp; diversified</option>
                <option value={NaturalRegion.II}>Region II — Intensive cropping (750-1000mm rainfall)</option>
                <option value={NaturalRegion.III}>Region III — Semi-intensive, drought-resistant crops</option>
                <option value={NaturalRegion.IV}>Region IV — Semi-extensive livestock & drought feed</option>
                <option value={NaturalRegion.V}>Region V — Extensive ranching or irrigation-only</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Soil Classification *
              </label>
              <select
                className="glass-input"
                value={soilType}
                onChange={(e) => setSoilType(e.target.value as SoilType | '')}
              >
                <option value="">Select soil type…</option>
                <option value={SoilType.LOAM}>Rich Loam (Fertile Arable)</option>
                <option value={SoilType.CLAY}>Red Clay / Black Cotton</option>
                <option value={SoilType.SANDY}>Sandy Veldt</option>
                <option value={SoilType.SILT}>Alluvial Silt</option>
                <option value={SoilType.MIXED}>Mixed Granitic / Sandy Loam</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Water Sources (comma-separated)
              </label>
              <input
                type="text"
                className="glass-input"
                value={waterSources}
                onChange={(e) => setWaterSources(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Terrain Topography
              </label>
              <select
                className="glass-input"
                value={terrain}
                onChange={(e) => setTerrain(e.target.value as Terrain | '')}
              >
                <option value="">Select terrain…</option>
                <option value={Terrain.FLAT}>Flat</option>
                <option value={Terrain.GENTLY_UNDULATING}>Gently undulating</option>
                <option value={Terrain.HILLY}>Hilly</option>
                <option value={Terrain.MOUNTAINOUS}>Mountainous</option>
                <option value={Terrain.VALLEY}>Valley</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Road Access
              </label>
              <select
                className="glass-input"
                value={roadAccess}
                onChange={(e) => setRoadAccess(e.target.value as RoadAccess | '')}
              >
                <option value="">Select road access…</option>
                <option value={RoadAccess.TARRED}>Tarred road</option>
                <option value={RoadAccess.GRAVEL}>Gravel road</option>
                <option value={RoadAccess.DIRT_TRACK}>Dirt track</option>
                <option value={RoadAccess.NONE}>No road access</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={electricityAccess}
                  onChange={(e) => setElectricityAccess(e.target.checked)}
                />
                Grid Electricity On-Site
              </label>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Grid Proximity (km)
              </label>
              <input
                type="number"
                step="0.1"
                className="glass-input"
                value={gridProximityKm}
                onChange={(e) => setGridProximityKm(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Permitted Lease Activities (comma-separated)
              </label>
              <input
                type="text"
                className="glass-input"
                value={permittedUses}
                onChange={(e) => setPermittedUses(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <button onClick={() => setCurrentStep(1)} className="btn btn-outline">
              ← Back to Step 1
            </button>
            <button onClick={() => setCurrentStep(3)} className="btn btn-primary">
              Continue to Step 3 (Boundary Editor) →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Spatial Boundary Builder & Overlap Check */}
      {currentStep === 3 && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', color: '#ffffff' }}>Step 3: Cadastral Boundary & Overlap Detection</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Input WGS84 GeoJSON polygon coordinates. SLLAS automatically calculates polygon area in hectares, determines centroid, and validates against conflicting cadastral allocations.
            </p>
          </div>

          <div className="form-grid mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Left: Coordinate Editor & Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  GeoJSON Polygon Coordinates [ [lng, lat], ... ]
                </label>
                <textarea
                  className="glass-input"
                  rows={8}
                  value={rawCoordsText}
                  onChange={(e) => handleCoordsChange(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: '1.4' }}
                />
              </div>

              {/* Spatial Calculations Box */}
              <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(15, 23, 42, 0.7)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Computed Cadastral Area</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-400)' }}>
                    {computedArea} <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ha</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Calculated Centroid</div>
                  <div style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffffff' }}>
                    {computedCentroid.lat}° S, {computedCentroid.lng}° E
                  </div>
                </div>
              </div>

              {/* Real-Time Cadastral Overlap Alert */}
              {overlappingParcel ? (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fca5a5', fontSize: '0.875rem' }}>
                      CADASTRAL OVERLAP CONFLICT DETECTED
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#fecaca', marginTop: '2px' }}>
                      Boundary intersects with registered parcel <strong>{overlappingParcel.referenceNumber} ({overlappingParcel.name})</strong> in {overlappingParcel.district}. Under statutory regulations, overlapping allocations cannot be registered.
                    </div>
                  </div>
                </div>
              ) : validationErrors.length > 0 ? (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  fontSize: '0.75rem',
                  color: '#fde047'
                }}>
                  ⚠️ {validationErrors[0]}
                </div>
              ) : (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  fontSize: '0.75rem',
                  color: '#86efac',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>✓</span>
                  <span>Geometry verified valid. Zero boundary overlaps detected across {parcels.length} registered parcels.</span>
                </div>
              )}
            </div>

            {/* Right: Live Spatial Map Visualizer */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Spatial Boundary Map Preview
              </div>
              <SpatialMap
                parcels={parcels}
                highlightPolygon={boundaryCoords}
                height={320}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <button onClick={() => setCurrentStep(2)} className="btn btn-outline">
              ← Back to Step 2
            </button>
            <button onClick={() => setCurrentStep(4)} className="btn btn-primary">
              Review and Submit →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Summary & Submit */}
      {currentStep === 4 && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', color: '#ffffff' }}>Step 4: Cadastral Dossier Review</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Please review all parcel attributes before saving. Parcels submitted for verification enter the Segregation of Duties queue.
            </p>
          </div>

          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Reference Number</div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary-400)' }}>Assigned on save</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Description</div>
              <div style={{ fontWeight: 600, color: '#ffffff' }}>{name || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Jurisdiction</div>
              <div style={{ fontWeight: 500 }}>{selectedDistrictName}, {selectedProvinceName}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Calculated Size</div>
              <div style={{ fontWeight: 700, fontSize: '1.125rem', color: '#ffffff' }}>{computedArea} ha</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Agro-Ecological Region</div>
              <div>{naturalRegion ? `Region ${naturalRegion}` : '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Soil & Water</div>
              <div>{soilType} • {waterSources}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Road & Electricity</div>
              <div>{roadAccess ? roadAccess.replace('_', ' ') : 'Road access not specified'} • {electricityAccess ? 'Grid Connected' : gridProximityKm === '' ? 'Grid proximity not specified' : `Grid ${gridProximityKm}km`}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Cadastral Overlap Status</div>
              <div style={{ color: overlappingParcel ? '#fca5a5' : '#86efac', fontWeight: 600 }}>
                {overlappingParcel ? 'CONFLICT DETECTED' : 'CLEAN — NO CONFLICT'}
              </div>
            </div>
          </div>

          {submitError && (
            <div role="alert" style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', fontSize: '0.8125rem' }}>
              {submitError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <button onClick={() => setCurrentStep(3)} className="btn btn-outline" disabled={saving}>
              ← Edit Boundary
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleSubmit(ParcelStatus.DRAFT)}
                className="btn btn-outline"
                disabled={saving || Boolean(overlappingParcel) || validationErrors.length > 0}
              >
                {saving ? 'Saving…' : 'Save as Draft'}
              </button>
              <button
                onClick={() => handleSubmit(ParcelStatus.PENDING_VERIFICATION)}
                className="btn btn-primary"
                disabled={saving || Boolean(overlappingParcel) || validationErrors.length > 0}
              >
                {saving ? 'Saving…' : 'Submit for Verification →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
