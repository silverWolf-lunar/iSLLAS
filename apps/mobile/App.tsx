import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type TabKey = 'overview' | 'parcels' | 'applications' | 'alerts';
type StatusFilter =
  | 'All'
  | 'Available'
  | 'Reserved'
  | 'Allocated'
  | 'Leased'
  | 'Draft'
  | 'Pending review'
  | 'Withdrawn'
  | 'Disputed';
type FormMode = 'parcel' | 'renewal';

type Metric = {
  label: string;
  value: string;
  change: string;
  tone: 'blue' | 'green' | 'amber' | 'red';
};

type ParcelItem = {
  id: string;
  referenceNumber: string;
  district: string;
  hectares: number;
  status: 'Available' | 'Reserved' | 'Allocated' | 'Expired' | string;
  suitability: number;
  landUse: string;
  waterAccess: boolean;
  roadAccess: string;
  nextAction: string;
  province?: string;
  naturalRegion?: string;
  currentUse?: string;
  notes?: string | null;
};

type ApplicationItem = {
  id: string;
  applicant: string;
  activity: string;
  status: string;
  delta: string;
};

type ReferenceOption = {
  id: string;
  name: string;
};

type OfflineQueueEntry = {
  id: string;
  parcelRef: string;
  notes: string;
  provinceId: string;
  districtId: string;
  categoryId: string;
  boundary: unknown;
  createdAt: string;
  status: 'queued' | 'synced';
};

const metrics: Metric[] = [
  { label: 'Parcels available', value: '184', change: '+12%', tone: 'blue' },
  { label: 'Applications', value: '36', change: '+4%', tone: 'green' },
  { label: 'Renewals due', value: '9', change: '3 urgent', tone: 'amber' },
  { label: 'Alerts', value: '2', change: '1 critical', tone: 'red' },
];

const API_BASE_URL = Platform.select({
  ios: 'http://localhost:3001',
  android: 'http://10.0.2.2:3001',
  default: 'http://localhost:3001',
});

const mockParcels: ParcelItem[] = [
  {
    id: 'mock-1',
    referenceNumber: 'ZW-ME-GOR-2026-0042',
    district: 'Goromonzi',
    hectares: 42.5,
    status: 'Available',
    suitability: 92,
    landUse: 'Crop farming',
    waterAccess: true,
    roadAccess: 'GRAVEL',
    nextAction: 'Review parcel and proceed to allocation',
  },
  {
    id: 'mock-2',
    referenceNumber: 'ZW-ME-SHU-2026-0118',
    district: 'Shurugwi',
    hectares: 18.2,
    status: 'Reserved',
    suitability: 84,
    landUse: 'Mixed agriculture',
    waterAccess: true,
    roadAccess: 'TARRED',
    nextAction: 'Await lessee verification',
  },
  {
    id: 'mock-3',
    referenceNumber: 'ZW-ME-KAD-2026-0089',
    district: 'Kadoma',
    hectares: 62.1,
    status: 'Allocated',
    suitability: 88,
    landUse: 'Agro-processing',
    waterAccess: false,
    roadAccess: 'DIRT_TRACK',
    nextAction: 'Confirm site inspection and lease documents',
  },
  {
    id: 'mock-4',
    referenceNumber: 'ZW-ME-MVU-2026-0051',
    district: 'Mvuma',
    hectares: 14.8,
    status: 'Expired',
    suitability: 67,
    landUse: 'Pasture',
    waterAccess: true,
    roadAccess: 'DIRT_TRACK',
    nextAction: 'Escalate renewal or reallocation review',
  },
];

const applications: ApplicationItem[] = [
  { id: 'APP-2026-0031', applicant: 'Tafadzwa Chikata', activity: 'Crop farming', status: 'Under review', delta: '2 days ago' },
  { id: 'APP-2026-0042', applicant: 'B. Ndlovu', activity: 'Agro-processing', status: 'Approved', delta: 'Today' },
  { id: 'APP-2026-0057', applicant: 'K. Moyo', activity: 'Dairy expansion', status: 'Awaiting docs', delta: '1 day ago' },
];

const alerts = [
  'Lease ZW-LS-3021 expires in 7 days',
  'Parcel overlap review required in Mvuma district',
  'Four new client verification items need attention',
];

const statusFilters: StatusFilter[] = [
  'All',
  'Available',
  'Reserved',
  'Allocated',
  'Leased',
  'Draft',
  'Pending review',
  'Withdrawn',
  'Disputed',
];

const normalizeStatus = (status: string | undefined): ParcelItem['status'] => {
  const normalized = (status ?? 'Available').toString().toLowerCase();

  if (normalized === 'available') return 'Available';
  if (normalized === 'reserved') return 'Reserved';
  if (normalized === 'allocated') return 'Allocated';
  if (normalized === 'leased') return 'Leased';
  if (normalized === 'withdrawn') return 'Withdrawn';
  if (normalized === 'disputed') return 'Disputed';
  if (normalized === 'expired') return 'Expired';
  if (normalized === 'draft') return 'Draft';
  if (normalized === 'pending_verification') return 'Pending review';

  return status ?? 'Unknown';
};

const statusToApiValue = (status: StatusFilter): string | null => {
  switch (status) {
    case 'Available':
      return 'AVAILABLE';
    case 'Reserved':
      return 'RESERVED';
    case 'Allocated':
      return 'ALLOCATED';
    case 'Leased':
      return 'LEASED';
    case 'Draft':
      return 'DRAFT';
    case 'Pending review':
      return 'PENDING_VERIFICATION';
    case 'Withdrawn':
      return 'WITHDRAWN';
    case 'Disputed':
      return 'DISPUTED';
    default:
      return null;
  }
};

const readOfflineQueue = (): OfflineQueueEntry[] => {
  try {
    const raw = (globalThis as { __SLLAS_OFFLINE_QUEUE__?: string }).__SLLAS_OFFLINE_QUEUE__;
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((entry): entry is OfflineQueueEntry => !!entry && typeof (entry as OfflineQueueEntry).id === 'string') : [];
  } catch {
    return [];
  }
};

const writeOfflineQueue = (entries: OfflineQueueEntry[]) => {
  try {
    (globalThis as { __SLLAS_OFFLINE_QUEUE__?: string }).__SLLAS_OFFLINE_QUEUE__ = JSON.stringify(entries);
  } catch {
    // Ignore storage errors in the offline queue fallback path.
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parcels, setParcels] = useState<ParcelItem[]>(mockParcels);
  const [selectedParcel, setSelectedParcel] = useState<ParcelItem | null>(mockParcels[0]);
  const [selectedParcelDetail, setSelectedParcelDetail] = useState<ParcelItem | null>(mockParcels[0]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<FormMode>('parcel');
  const [authToken, setAuthToken] = useState('');
  const [provinces, setProvinces] = useState<ReferenceOption[]>([]);
  const [districts, setDistricts] = useState<ReferenceOption[]>([]);
  const [categories, setCategories] = useState<ReferenceOption[]>([]);
  const [provinceId, setProvinceId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [boundaryJson, setBoundaryJson] = useState('');
  const [isReferenceDataLoading, setIsReferenceDataLoading] = useState(false);
  const [referenceDataError, setReferenceDataError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueEntry[]>(() => readOfflineQueue());
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    parcelRef: mockParcels[0].referenceNumber,
    notes: '',
  });

  useEffect(() => {
    writeOfflineQueue(offlineQueue);
  }, [offlineQueue]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchParcels = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({ limit: '20' });
        const apiStatus = statusToApiValue(statusFilter);
        if (apiStatus) {
          params.set('status', apiStatus);
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/parcels?${params.toString()}`, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            ...(authToken.trim() ? { Authorization: `Bearer ${authToken.trim()}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load parcels (${response.status})`);
        }

        const payload = await response.json();
        const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

        const mappedParcels: ParcelItem[] = list.map((parcel: any) => ({
          id: parcel.id,
          referenceNumber: parcel.referenceNumber ?? parcel.reference ?? 'Unknown parcel',
          district: parcel.district?.name ?? parcel.districtName ?? 'Unknown district',
          hectares: Number(parcel.areaHectares ?? parcel.hectares ?? 0),
          status: normalizeStatus(parcel.status),
          suitability: Math.max(60, Math.min(99, Number(parcel.suitability ?? 0) || 82)),
          landUse: parcel.landCategory?.name ?? parcel.currentUse ?? 'Agriculture',
          waterAccess: Boolean(parcel.waterAccess ?? parcel.attributes?.waterAccess ?? false),
          roadAccess: parcel.roadAccess ?? parcel.attributes?.roadAccess ?? 'DIRT_TRACK',
          nextAction: parcel.notes ?? 'Review parcel and proceed to allocation',
          province: parcel.province?.name ?? parcel.provinceName,
          naturalRegion: parcel.naturalRegion ?? parcel.attributes?.naturalRegion,
          currentUse: parcel.currentUse ?? parcel.attributes?.currentUse,
          notes: parcel.notes ?? null,
        }));

        setParcels(mappedParcels);
        if (mappedParcels.length > 0) {
          setSelectedParcel(mappedParcels[0]);
          setFormData({
            parcelRef: mappedParcels[0].referenceNumber,
            notes: '',
          });
        } else {
          setSelectedParcel(null);
          setSelectedParcelDetail(null);
        }
      } catch (loadError: any) {
        if (loadError?.name === 'AbortError') {
          return;
        }
        setIsOfflineMode(true);
        setError('Using demo parcel data because the live API is not reachable.');
        setParcels(mockParcels);
        setSelectedParcel(mockParcels[0]);
        setSelectedParcelDetail(mockParcels[0]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParcels();

    return () => controller.abort();
  }, [authToken, statusFilter, refreshKey]);

  const filteredParcels = useMemo(() => {
    return parcels.filter((parcel) => {
      const searchTarget = `${parcel.referenceNumber} ${parcel.district} ${parcel.landUse}`.toLowerCase();
      const matchesText = searchTarget.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || parcel.status === statusFilter;
      return matchesText && matchesStatus;
    });
  }, [searchTerm, statusFilter, parcels]);

  const activeParcel = filteredParcels.find((parcel) => parcel.id === selectedParcel?.id) ?? filteredParcels[0] ?? null;
  const visibleStatusFilters: StatusFilter[] = authToken.trim() ? statusFilters : ['All', 'Available'];
  const isOfflineBrowser = typeof globalThis !== 'undefined' && !!(globalThis as { navigator?: { onLine?: boolean } }).navigator && (globalThis as { navigator?: { onLine?: boolean } }).navigator?.onLine === false;

  const flushOfflineQueue = async () => {
    if (offlineQueue.length === 0) {
      return;
    }

    if (isOfflineBrowser) {
      setIsOfflineMode(true);
      return;
    }

    const pendingEntries = [...offlineQueue];
    const remaining: OfflineQueueEntry[] = [];

    for (const queued of pendingEntries) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/parcels`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(authToken.trim() ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({
            provinceId: queued.provinceId,
            districtId: queued.districtId,
            landCategoryId: queued.categoryId,
            boundary: queued.boundary,
            notes: queued.notes.trim() || undefined,
          }),
        });

        if (!response.ok) {
          remaining.push({ ...queued, status: 'queued' });
          continue;
        }

        setLastSyncAt(new Date().toISOString());
      } catch {
        remaining.push({ ...queued, status: 'queued' });
      }
    }

    if (remaining.length !== offlineQueue.length) {
      setIsOfflineMode(false);
    }

    setOfflineQueue(remaining);
  };

  useEffect(() => {
    flushOfflineQueue().catch(() => {
      setIsOfflineMode(true);
    });
  }, [authToken, refreshKey]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchParcelDetail = async () => {
      setDetailError(null);
      setSelectedParcelDetail(activeParcel);

      if (!activeParcel?.id || activeParcel.id.startsWith('mock-')) {
        setIsDetailLoading(false);
        return;
      }

      try {
        setIsDetailLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/v1/parcels/${activeParcel.id}`, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            ...(authToken.trim() ? { Authorization: `Bearer ${authToken.trim()}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load parcel details (${response.status})`);
        }

        const detail = await response.json();
        if (!controller.signal.aborted) {
          setSelectedParcelDetail({
            ...activeParcel,
            id: detail.id ?? activeParcel.id,
            referenceNumber: detail.referenceNumber ?? activeParcel.referenceNumber,
            district: detail.district?.name ?? detail.districtName ?? activeParcel.district,
            hectares: Number(detail.areaHectares ?? detail.hectares ?? activeParcel.hectares),
            status: normalizeStatus(detail.status ?? activeParcel.status),
            landUse: detail.landCategory?.name ?? detail.currentUse ?? activeParcel.landUse,
            waterAccess: Boolean(detail.waterAccess ?? detail.attributes?.waterAccess ?? activeParcel.waterAccess),
            roadAccess: detail.roadAccess ?? detail.attributes?.roadAccess ?? activeParcel.roadAccess,
            nextAction: detail.notes ?? activeParcel.nextAction,
            province: detail.province?.name ?? detail.provinceName ?? activeParcel.province,
            naturalRegion: detail.naturalRegion ?? detail.attributes?.naturalRegion ?? activeParcel.naturalRegion,
            currentUse: detail.currentUse ?? detail.attributes?.currentUse ?? activeParcel.currentUse,
            notes: detail.notes ?? activeParcel.notes ?? null,
          });
        }
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }
        setDetailError(loadError instanceof Error ? loadError.message : 'Failed to load parcel details.');
      } finally {
        if (!controller.signal.aborted) {
          setIsDetailLoading(false);
        }
      }
    };

    fetchParcelDetail();
    return () => controller.abort();
  }, [activeParcel, authToken]);

  const tabButtons: { key: TabKey; label: string }[] = useMemo(
    () => [
      { key: 'overview', label: 'Overview' },
      { key: 'parcels', label: 'Parcels' },
      { key: 'applications', label: 'Applications' },
      { key: 'alerts', label: 'Alerts' },
    ],
    [],
  );

  const openModal = (mode: FormMode, parcel: ParcelItem | null = activeParcel) => {
    if (mode === 'renewal' && !parcel) {
      return;
    }

    setModalMode(mode);
    setReferenceDataError(null);
    setSubmitError(null);
    setFormData({
      parcelRef: parcel?.referenceNumber ?? '',
      notes: '',
    });
    if (mode === 'parcel') {
        setProvinceId('');
        setDistrictId('');
        setCategoryId('');
        setBoundaryJson('');
    }
    setModalVisible(true);
  };

  useEffect(() => {
    if (!modalVisible || modalMode !== 'parcel') {
        return;
    }

    const controller = new AbortController();
    const fetchReferenceData = async () => {
        try {
          setIsReferenceDataLoading(true);
          setReferenceDataError(null);
          const [provincesResponse, categoriesResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/v1/provinces`, { signal: controller.signal }),
            fetch(`${API_BASE_URL}/api/v1/parcels/categories`, { signal: controller.signal }),
          ]);
          if (!provincesResponse.ok || !categoriesResponse.ok) {
            throw new Error('Unable to load provinces or land categories.');
          }

          const [provincePayload, categoryPayload] = await Promise.all([
            provincesResponse.json(),
            categoriesResponse.json(),
          ]);
          const provinceOptions = (Array.isArray(provincePayload) ? provincePayload : provincePayload?.data ?? [])
            .filter((item: any) => item?.id && item?.name);
          const categoryOptions = (Array.isArray(categoryPayload) ? categoryPayload : categoryPayload?.data ?? [])
            .filter((item: any) => item?.id && item?.name);

          if (!controller.signal.aborted) {
            setProvinces(provinceOptions);
            setCategories(categoryOptions);
            if (provinceOptions.length === 0 || categoryOptions.length === 0) {
              setReferenceDataError('The API returned no provinces or active land categories.');
            }
          }
        } catch (loadError) {
          if (!controller.signal.aborted) {
            setReferenceDataError(loadError instanceof Error ? loadError.message : 'Failed to load parcel reference data.');
          }
        } finally {
          if (!controller.signal.aborted) {
            setIsReferenceDataLoading(false);
          }
        }
    };

    fetchReferenceData();
    return () => controller.abort();
  }, [modalVisible, modalMode]);

  useEffect(() => {
    setDistricts([]);
    setDistrictId('');
    if (!provinceId) {
      return;
    }

    const controller = new AbortController();
    const fetchDistricts = async () => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/v1/districts?provinceId=${encodeURIComponent(provinceId)}`,
            { signal: controller.signal },
          );
          if (!response.ok) {
            throw new Error('Unable to load districts for this province.');
          }
          const payload = await response.json();
          const options = (Array.isArray(payload) ? payload : payload?.data ?? [])
            .filter((item: any) => item?.id && item?.name);
          if (!controller.signal.aborted) {
            setDistricts(options);
            setDistrictId('');
            if (options.length === 0) {
              setReferenceDataError('No districts were found for the selected province.');
            }
          }
        } catch (loadError) {
          if (!controller.signal.aborted) {
            setReferenceDataError(loadError instanceof Error ? loadError.message : 'Failed to load districts.');
          }
        }
    };

    fetchDistricts();
    return () => controller.abort();
  }, [provinceId]);

  const handleSaveOrSubmit = async () => {
    if (modalMode === 'parcel') {
        let boundary: { type: 'Polygon'; coordinates: number[][][] };
        try {
          const parsedBoundary = JSON.parse(boundaryJson);
          if (
            parsedBoundary?.type !== 'Polygon' ||
            !Array.isArray(parsedBoundary.coordinates) ||
            !Array.isArray(parsedBoundary.coordinates[0]) ||
            parsedBoundary.coordinates[0].length < 4
          ) {
            throw new Error('Enter a GeoJSON Polygon with at least four coordinates in its outer ring.');
          }

          const outerRing = parsedBoundary.coordinates[0] as unknown[];
          const validCoordinates = outerRing.every((point) =>
            Array.isArray(point) &&
            point.length === 2 &&
            typeof point[0] === 'number' &&
            Number.isFinite(point[0]) &&
            point[0] >= -180 &&
            point[0] <= 180 &&
            typeof point[1] === 'number' &&
            Number.isFinite(point[1]) &&
            point[1] >= -90 &&
            point[1] <= 90,
          );
          if (!validCoordinates) {
            throw new Error('Each boundary point must be a valid [longitude, latitude] coordinate.');
          }
          const firstPoint = outerRing[0];
          const lastPoint = outerRing[outerRing.length - 1];
          if (
            !Array.isArray(firstPoint) ||
            !Array.isArray(lastPoint) ||
            firstPoint[0] !== lastPoint[0] ||
            firstPoint[1] !== lastPoint[1]
          ) {
            throw new Error('The polygon ring must be closed: repeat the first coordinate at the end.');
          }
          boundary = parsedBoundary as { type: 'Polygon'; coordinates: number[][][] };
        } catch (validationError) {
          setSubmitError(validationError instanceof Error ? validationError.message : 'Enter a valid GeoJSON Polygon.');
          return;
        }

        if (!provinceId || !districtId || !categoryId) {
          setSubmitError('Select a province, district and land category.');
          return;
        }
        if (formData.notes.length > 2000) {
          setSubmitError('Notes must be 2,000 characters or fewer.');
          return;
        }

        setIsSubmitting(true);
        setSubmitError(null);
        const response = await fetch(`${API_BASE_URL}/api/v1/parcels`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(authToken.trim() ? { Authorization: `Bearer ${authToken.trim()}` } : {}),
          },
          body: JSON.stringify({
            provinceId,
            districtId,
            landCategoryId: categoryId,
            boundary,
            notes: formData.notes.trim() || undefined,
          }),
        }).catch((requestError: unknown) => {
          setSubmitError(requestError instanceof Error ? requestError.message : 'Parcel capture request failed.');
          return null;
        });

        if (!response) {
          setIsSubmitting(false);
          return;
        }
        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          const message = Array.isArray(errorPayload?.message)
            ? errorPayload.message.join('\n')
            : errorPayload?.message ?? `Parcel capture failed (${response.status}).`;
          setSubmitError(String(message));
          setIsSubmitting(false);
          return;
        }

        const createdParcel = await response.json().catch(() => null);
        const createdReference = createdParcel?.referenceNumber ?? 'New parcel';
        setModalVisible(false);
        setIsSubmitting(false);
        setRefreshKey((current) => current + 1);
        Alert.alert('Parcel captured', `${createdReference} was created in draft status.`);
    } else {
        setSubmitError('Lease renewal submission is not available: the API does not currently expose a renewal-request endpoint. No request was sent.');
    }
  };

  const renderReferenceOptions = (
    label: string,
    options: ReferenceOption[],
    value: string,
    onSelect: (id: string) => void,
  ) => (
    <View style={styles.referenceGroup}>
      <Text style={styles.detailLabel}>{label}</Text>
      {options.length === 0 ? (
        <Text style={styles.subtleText}>No options available.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.referenceOptions}>
          {options.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => onSelect(option.id)}
              style={[styles.filterChip, value === option.id && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, value === option.id && styles.filterChipTextActive]}>
                {option.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderOverview = () => (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>Operations snapshot</Text>
      <View style={styles.metricGrid}>
        {metrics.map((metric) => (
          <View key={metric.label} style={[styles.metricCard, styles[`${metric.tone}Card`]]}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricChange}>{metric.change}</Text>
          </View>
        ))}
      </View>

      <View style={styles.listCard}>
        <Text style={styles.sectionTitle}>Recommended land leads</Text>
        {parcels.map((parcel) => (
          <Pressable key={parcel.referenceNumber} onPress={() => setSelectedParcel(parcel)} style={styles.listItem}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.listRef}>{parcel.referenceNumber}</Text>
              <Text style={styles.badge}>{parcel.status}</Text>
            </View>
            <Text style={styles.subtleText}>{parcel.district} • {parcel.hectares} ha</Text>
            <Text style={styles.suitability}>Suitability score: {parcel.suitability}/100</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderParcels = () => (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>Parcel search & review</Text>
      <Pressable style={styles.primaryButton} onPress={() => openModal('parcel', null)}>
        <Text style={styles.primaryButtonText}>Capture a new parcel</Text>
      </Pressable>

      <View style={styles.searchCard}>
        <TextInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search reference, district or use"
          style={styles.searchInput}
          placeholderTextColor="#64748b"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {visibleStatusFilters.map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setStatusFilter(filter)}
            style={[styles.filterChip, statusFilter === filter && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, statusFilter === filter && styles.filterChipTextActive]}>{filter}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.listCard}>
        {filteredParcels.length === 0 ? (
          <Text style={styles.emptyState}>
            {parcels.length === 0 ? 'No parcels are available.' : 'No parcels match this search.'}
          </Text>
        ) : (
          filteredParcels.map((parcel) => (
            <Pressable key={parcel.referenceNumber} onPress={() => setSelectedParcel(parcel)} style={styles.listItem}>
              <View style={styles.listHeaderRow}>
                <Text style={styles.listRef}>{parcel.referenceNumber}</Text>
                <Text style={styles.badge}>{parcel.status}</Text>
              </View>
              <Text style={styles.subtleText}>{parcel.district}</Text>
              <Text style={styles.subtleText}>{parcel.hectares} hectares • {parcel.landUse}</Text>
              <Text style={styles.suitability}>Match score: {parcel.suitability}/100</Text>
            </Pressable>
          ))
        )}
      </View>

      {activeParcel && (
      <View style={styles.detailCard}>
        <Text style={styles.sectionTitle}>Parcel detail</Text>
        {isDetailLoading && <Text style={styles.subtleText}>Loading parcel details…</Text>}
        {detailError && <Text style={styles.warningText}>{detailError} Showing list information.</Text>}
        <Text style={styles.listRef}>{selectedParcelDetail?.referenceNumber ?? activeParcel.referenceNumber}</Text>
        <Text style={styles.subtleText}>
          {selectedParcelDetail?.district ?? activeParcel.district}
          {selectedParcelDetail?.province ? `, ${selectedParcelDetail.province}` : ''}
        </Text>
        <View style={styles.metaGrid}>
          <View style={styles.metaTile}><Text style={styles.metaLabel}>Size</Text><Text style={styles.metaValue}>{selectedParcelDetail?.hectares ?? activeParcel.hectares} ha</Text></View>
          <View style={styles.metaTile}><Text style={styles.metaLabel}>Status</Text><Text style={styles.metaValue}>{selectedParcelDetail?.status ?? activeParcel.status}</Text></View>
          <View style={styles.metaTile}><Text style={styles.metaLabel}>Water</Text><Text style={styles.metaValue}>{(selectedParcelDetail ?? activeParcel).waterAccess ? 'Available' : 'None'}</Text></View>
          <View style={styles.metaTile}><Text style={styles.metaLabel}>Road</Text><Text style={styles.metaValue}>{selectedParcelDetail?.roadAccess ?? activeParcel.roadAccess}</Text></View>
        </View>

        <Text style={styles.detailLabel}>Recommended use</Text>
        <Text style={styles.detailValue}>{selectedParcelDetail?.landUse ?? activeParcel.landUse}</Text>

        <Text style={styles.detailLabel}>Next action</Text>
        <Text style={styles.detailValue}>{selectedParcelDetail?.nextAction ?? activeParcel.nextAction}</Text>

        <View style={styles.actionRow}>
          <Pressable style={styles.primaryButton} onPress={() => openModal('parcel', activeParcel)}>
            <Text style={styles.primaryButtonText}>Capture parcel</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => openModal('renewal', activeParcel)}>
            <Text style={styles.secondaryButtonText}>Renew lease</Text>
          </Pressable>
        </View>
      </View>
      )}
    </View>
  );

  const renderApplications = () => (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>Applications</Text>
      {applications.map((item) => (
        <View key={item.id} style={styles.listCard}>
          <Text style={styles.listRef}>{item.id}</Text>
          <Text style={styles.subtleText}>{item.applicant}</Text>
          <Text style={styles.subtleText}>{item.activity}</Text>
          <View style={styles.inlineMeta}>
            <Text style={styles.badge}>{item.status}</Text>
            <Text style={styles.metaText}>{item.delta}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderAlerts = () => (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>Operational alerts</Text>
      {alerts.map((alert) => (
        <View key={alert} style={styles.alertItem}>
          <Text style={styles.alertDot}>•</Text>
          <Text style={styles.alertText}>{alert}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>SLLAS</Text>
        <Text style={styles.headerTitle}>Field operations</Text>
      </View>

      <View style={styles.tabRow}>
        {tabButtons.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {isLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.loadingText}>Loading live parcel data…</Text>
        </View>
      )}

      {error && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>{error}</Text>
        </View>
      )}

      {isOfflineMode && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            {offlineQueue.length > 0
              ? `Offline queue active: ${offlineQueue.length} parcel capture(s) waiting to sync.`
              : 'Offline mode active: the app is using cached field data until connectivity returns.'}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'parcels' && renderParcels()}
        {activeTab === 'applications' && renderApplications()}
        {activeTab === 'alerts' && renderAlerts()}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.sectionTitle}>{modalMode === 'parcel' ? 'Parcel capture' : 'Lease renewal'}</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButton}>Close</Text>
                </Pressable>
              </View>

              {modalMode === 'parcel' ? (
                <>
                  <Text style={styles.subtleText}>
                    Reference number and area are generated by the API from the selected jurisdiction and survey boundary.
                  </Text>
                  <Text style={styles.detailLabel}>Staff API token</Text>
                  <TextInput
                    style={styles.input}
                    value={authToken}
                    onChangeText={setAuthToken}
                    placeholder="Paste token without the Bearer prefix"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={styles.subtleText}>Kept in memory only. Required for staff-only parcel creation.</Text>

                  {isReferenceDataLoading && (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#2563eb" />
                      <Text style={styles.loadingText}>Loading provinces and categories…</Text>
                    </View>
                  )}
                  {referenceDataError && <Text style={styles.warningText}>{referenceDataError}</Text>}
                  {renderReferenceOptions('Province', provinces, provinceId, setProvinceId)}
                  {renderReferenceOptions('District', districts, districtId, setDistrictId)}
                  {renderReferenceOptions('Land category', categories, categoryId, setCategoryId)}

                  <Text style={styles.detailLabel}>Survey boundary (GeoJSON Polygon)</Text>
                  <Text style={styles.subtleText}>
                    Coordinates use [longitude, latitude]. Close the outer ring by repeating its first point.
                  </Text>
                  <TextInput
                    style={[styles.input, styles.boundaryInput]}
                    multiline
                    value={boundaryJson}
                    onChangeText={setBoundaryJson}
                    placeholder={'{"type":"Polygon","coordinates":[[[31.0,-17.0],[31.01,-17.0],[31.01,-17.01],[31.0,-17.0]]]}'}
                    placeholderTextColor="#64748b"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.warningText}>
                    The API does not expose a lease-renewal request endpoint yet. No renewal request can be submitted from this app.
                  </Text>
                  <Text style={styles.detailLabel}>Parcel reference</Text>
                  <TextInput style={styles.input} value={formData.parcelRef} editable={false} />
                </>
              )}

              {submitError && <Text style={styles.warningText}>{submitError}</Text>}
              {modalMode === 'parcel' ? (
                <Pressable
                  style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
                  onPress={handleSaveOrSubmit}
                  disabled={isSubmitting || isReferenceDataLoading}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Create draft parcel</Text>
                  )}
                </Pressable>
              ) : (
                <Pressable style={[styles.primaryButton, styles.disabledButton]} disabled>
                  <Text style={styles.primaryButtonText}>Renewal submission unavailable</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#2563eb',
    textTransform: 'uppercase',
  },
  headerTitle: {
    marginTop: 6,
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  tabButtonActive: {
    backgroundColor: '#dbeafe',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tabLabelActive: {
    color: '#1d4ed8',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  loadingText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  warningBanner: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  warningText: {
    color: '#9a5b00',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionBlock: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  blueCard: {
    backgroundColor: '#eff6ff',
  },
  greenCard: {
    backgroundColor: '#ecfdf5',
  },
  amberCard: {
    backgroundColor: '#fffbeb',
  },
  redCard: {
    backgroundColor: '#fef2f2',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  listCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 8,
  },
  listItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 4,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listRef: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: '700',
    overflow: 'hidden',
  },
  subtleText: {
    fontSize: 13,
    color: '#475569',
  },
  suitability: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f766e',
  },
  inlineMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
  alertItem: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f5d0d0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertDot: {
    color: '#dc2626',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 22,
  },
  alertText: {
    flex: 1,
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  searchCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  searchInput: {
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 10,
  },
  filterRow: {
    paddingVertical: 4,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#dbeafe',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#1d4ed8',
  },
  emptyState: {
    color: '#64748b',
    fontSize: 14,
    paddingVertical: 12,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dbeafe',
    padding: 16,
    gap: 10,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaTile: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    maxHeight: '90%',
  },
  modalContent: {
    gap: 12,
  },
  referenceGroup: {
    gap: 6,
  },
  referenceOptions: {
    gap: 8,
    paddingVertical: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  boundaryInput: {
    minHeight: 130,
    textAlignVertical: 'top',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  disabledButton: {
    opacity: 0.55,
  },
});
