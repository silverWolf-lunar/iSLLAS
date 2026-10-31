import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, {
  Path,
  Rect,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  G,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import {
  ZIMBABWE_NATIONAL_OUTLINE,
  ZIMBABWE_PROVINCES,
  ZIMBABWE_WATERCOURSES,
  GEODETIC_GRID,
  AGRO_REGIONS_LEGEND,
} from './zimbabwe_geo';
import {
  MOBILE_NEWS_ARTICLES,
  MobileNewsArticle,
  NEWS_IMAGES,
} from './news_data';

const SATELLITE_MAP_IMG = require('./assets/zimbabwe_satellite_map.jpg');

declare const process: {
  env: Record<string, string | undefined>;
};

// 4.3.2 Mobile Application Screen Keys
type MobileTabKey = 'home' | 'search' | 'applications' | 'map' | 'menu' | 'notifications';

type LandUseCategory = 'All' | 'Commercial Cropping' | 'Livestock Ranching' | 'Horticulture' | 'Mixed Farming';
type SizeRangeFilter = 'All' | '<50 ha' | '50-100 ha' | '100-250 ha' | '250+ ha';
type AvailabilityFilter = 'All' | 'Available' | 'Reserved' | 'Allocated';

interface ClientProfile {
  name: string;
  nationalId: string;
  email: string;
  phone: string;
  address: string;
  province: string;
  district: string;
  smsNotifications: boolean;
  emailNotifications: boolean;
  expiryReminders: boolean;
}

interface MobileParcel {
  id: string;
  referenceNumber: string;
  name: string;
  province: string;
  district: string;
  hectares: number;
  landUse: string;
  availability: 'Available' | 'Reserved' | 'Allocated';
  naturalRegion: string;
  soilType: string;
  waterAccess: boolean;
  roadAccess: string;
  mapX?: number;
  mapY?: number;
  gpsCoords?: string;
  surveyBeacons?: string;
}

interface ApplicationStatusItem {
  id: string;
  applicationNumber: string;
  waitingListNumber: string;
  parcelRef: string;
  hectares: number;
  intendedActivity: string;
  status: 'SUBMITTED' | 'UNDER_INSPECTION' | 'ALLOCATED' | 'APPROVED' | 'REJECTED';
  lodgedDate: string;
  officerRemarks: string;
  history: Array<{ status: string; date: string; note: string }>;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'STATUS_UPDATE' | 'EXPIRY_REMINDER' | 'GAZETTE';
  timestamp: string;
  read: boolean;
}

const INITIAL_PROFILE: ClientProfile = {
  name: 'Tafadzwa Chikata',
  nationalId: '63-128944-P-63',
  email: 'farmer@sllas.gov.zw',
  phone: '+263 77 345 6789',
  address: 'Stand 44, Banket Commercial Farming Block',
  province: 'Mashonaland West',
  district: 'Makonde',
  smsNotifications: true,
  emailNotifications: true,
  expiryReminders: true,
};

const MOCK_PARCELS: MobileParcel[] = [
  {
    id: 'p-1',
    referenceNumber: 'ZW-MSW-MAK-2026-0042',
    name: 'Makonde Commercial Cropping Block 4',
    province: 'Mashonaland West',
    district: 'Makonde',
    hectares: 120,
    landUse: 'Commercial Cropping',
    availability: 'Available',
    naturalRegion: 'Region II',
    soilType: 'Red Clay Loam',
    waterAccess: true,
    roadAccess: 'Tarred Highway Access',
    mapX: 223,
    mapY: 87,
    gpsCoords: '17°21\'15"S 30°11\'54"E',
    surveyBeacons: 'BM-401, BM-402, BM-403, BM-404',
  },
  {
    id: 'p-2',
    referenceNumber: 'ZW-MID-GWE-2026-0118',
    name: 'Somabula Cattle Ranch Plot 12',
    province: 'Midlands',
    district: 'Gweru',
    hectares: 350,
    landUse: 'Livestock Ranching',
    availability: 'Available',
    naturalRegion: 'Region III',
    soilType: 'Sandy Loam',
    waterAccess: true,
    roadAccess: 'All-Weather Gravel',
    mapX: 208,
    mapY: 168,
    gpsCoords: '19°27\'32"S 29°50\'16"E',
    surveyBeacons: 'BM-118A, BM-118B, BM-118C',
  },
  {
    id: 'p-3',
    referenceNumber: 'ZW-MAN-MUT-2026-0089',
    name: 'Honde Valley Macadamia & Tea Plot',
    province: 'Manicaland',
    district: 'Mutasa',
    hectares: 45,
    landUse: 'Horticulture',
    availability: 'Reserved',
    naturalRegion: 'Region I',
    soilType: 'Humic Forest Soil',
    waterAccess: true,
    roadAccess: 'Tarred Mountain Road',
    mapX: 332,
    mapY: 134,
    gpsCoords: '18°34\'18"S 32°50\'53"E',
    surveyBeacons: 'HV-089A, HV-089B',
  },
  {
    id: 'p-4',
    referenceNumber: 'ZW-MSE-GOR-2026-0145',
    name: 'Goromonzi Mixed Agriculture Subdivision A',
    province: 'Mashonaland East',
    district: 'Goromonzi',
    hectares: 80,
    landUse: 'Mixed Farming',
    availability: 'Available',
    naturalRegion: 'Region II',
    soilType: 'Red Loam',
    waterAccess: false,
    roadAccess: 'Gravel Track',
    mapX: 270,
    mapY: 105,
    gpsCoords: '17°49\'42"S 31°19\'57"E',
    surveyBeacons: 'GOR-145/1, GOR-145/2',
  },
  {
    id: 'p-5',
    referenceNumber: 'ZW-MAS-CHI-2026-0204',
    name: 'Chiredzi Sugarcane Estate Section 7',
    province: 'Masvingo',
    district: 'Chiredzi',
    hectares: 160,
    landUse: 'Commercial Cropping',
    availability: 'Available',
    naturalRegion: 'Region V',
    soilType: 'Alluvial Heavy Clay',
    waterAccess: true,
    roadAccess: 'Canal Service Road',
    mapX: 283,
    mapY: 228,
    gpsCoords: '21°02\'54"S 31°40\'01"E',
    surveyBeacons: 'CS-204A, CS-204B, CS-204C',
  },
  {
    id: 'p-6',
    referenceNumber: 'ZW-MTS-MAT-2026-0062',
    name: 'Matobo Rangeland Grazing Scheme',
    province: 'Matabeleland South',
    district: 'Matobo',
    hectares: 480,
    landUse: 'Livestock Ranching',
    availability: 'Available',
    naturalRegion: 'Region IV',
    soilType: 'Granitic Coarse Sand',
    waterAccess: true,
    roadAccess: 'District Graded Road',
    mapX: 154,
    mapY: 211,
    gpsCoords: '20°35\'00"S 28°31\'00"E',
    surveyBeacons: 'MB-062/X, MB-062/Y',
  },
  {
    id: 'p-7',
    referenceNumber: 'ZW-MSC-MAZ-2026-0177',
    name: 'Mazowe Citrus & Irrigation Estate',
    province: 'Mashonaland Central',
    district: 'Mazowe',
    hectares: 75,
    landUse: 'Horticulture',
    availability: 'Allocated',
    naturalRegion: 'Region II',
    soilType: 'Rich Ferrosol Clay',
    waterAccess: true,
    roadAccess: 'Tarred Strip Road',
    mapX: 255,
    mapY: 93,
    gpsCoords: '17°31\'00"S 30°59\'00"E',
    surveyBeacons: 'MZ-177/1, MZ-177/2',
  },
  {
    id: 'p-8',
    referenceNumber: 'ZW-MTN-UMG-2026-0094',
    name: 'Nyamandlovu Aquifer Horticulture Scheme',
    province: 'Matabeleland North',
    district: 'Umguza',
    hectares: 60,
    landUse: 'Horticulture',
    availability: 'Available',
    naturalRegion: 'Region IV',
    soilType: 'Kalahari Deep Sand Loam',
    waterAccess: true,
    roadAccess: 'All-Weather Gravel',
    mapX: 144,
    mapY: 183,
    gpsCoords: '19°52\'00"S 28°16\'00"E',
    surveyBeacons: 'NY-094A, NY-094B',
  },
];

const INITIAL_APPLICATIONS: ApplicationStatusItem[] = [
  {
    id: 'app-01',
    applicationNumber: 'APP-2026-MSW-0042',
    waitingListNumber: 'WL-2026-0184',
    parcelRef: 'ZW-MSW-MAK-2026-0042',
    hectares: 120,
    intendedActivity: 'Commercial Maize & Soya Bean Cropping',
    status: 'ALLOCATED',
    lodgedDate: '2026-10-24',
    officerRemarks: 'Boundary survey verified by District Officer. Parcel allocated subject to 99-year lease statutory acceptance.',
    history: [
      { status: 'SUBMITTED', date: '24 Oct 2026', note: 'Application lodged and assigned Waiting List #WL-2026-0184' },
      { status: 'UNDER_INSPECTION', date: '27 Oct 2026', note: 'Agro-ecological suitability and soil fertility confirmed' },
      { status: 'ALLOCATED', date: '30 Oct 2026', note: 'Allocated by Makonde District Resettlement Officer' },
    ],
  },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'Application Allocated to Land Board',
    message: 'Your application APP-2026-MSW-0042 has been allocated and forwarded to Provincial Land Board docket.',
    type: 'STATUS_UPDATE',
    timestamp: 'Today, 09:30 AM',
    read: false,
  },
  {
    id: 'n-2',
    title: 'Lease Expiry Reminder (60 Days)',
    message: 'Existing A2 statutory tenancy in Banket enters renewal window in 60 days. File renewal covenants.',
    type: 'EXPIRY_REMINDER',
    timestamp: 'Yesterday, 14:15 PM',
    read: false,
  },
  {
    id: 'n-3',
    title: 'Statutory Instrument 142/2026 Gazetted',
    message: 'Bankable 99-year lease security framework and collateral provisions gazetted by Ministry.',
    type: 'GAZETTE',
    timestamp: '25 Oct 2026',
    read: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// OFFICIAL SLLAS LOGO COMPONENT (React Native)
// ─────────────────────────────────────────────────────────────────────────────
interface SllasLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: number;
}

export function SllasLogo({ variant = 'full', size = 42 }: SllasLogoProps) {
  const stripeColors = ['#006B3F', '#FFD200', '#D40000', '#000000'];
  const iconSize = size;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: variant === 'full' ? 12 : 8 }}>
      <Svg width={iconSize} height={iconSize} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="sllasBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#ffffff" />
            <Stop offset="100%" stopColor="#f8fafc" />
          </LinearGradient>
        </Defs>

        {/* Clean rounded squircle badge base */}
        <Rect
          x="1"
          y="1"
          width="46"
          height="46"
          rx="10"
          fill="url(#sllasBadgeGrad)"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="1.2"
        />

        {/* Top Central Leaf */}
        <Path
          d="M 24.00 5.29 Q 25.62 6.91 27.06 9.11 Q 27.82 10.92 28.20 13.12 Q 28.01 15.79 27.44 17.51 Q 26.39 19.51 24.10 22.19 Q 22.85 21.14 21.33 19.23 Q 20.37 17.41 19.80 15.03 Q 19.99 12.16 20.75 9.96 Q 22.38 7.20 24.00 5.29 Z"
          fill="#2785a1"
        />

        {/* Left Leaf with negative-space vein */}
        <Path
          d="M 11.11 19.13 Q 14.55 19.42 16.46 19.99 Q 18.37 21.04 19.61 22.19 Q 20.56 23.62 21.23 25.34 Q 21.61 27.82 21.52 29.92 Q 20.18 27.63 18.84 26.10 Q 17.22 24.86 15.60 24.10 Q 15.22 24.29 15.22 24.67 Q 18.37 28.11 19.80 30.30 Q 19.99 30.97 17.89 30.97 Q 15.88 30.59 13.97 29.73 Q 12.16 28.11 10.54 25.34 Q 9.68 21.99 9.49 19.32 Q 11.02 19.23 11.11 19.13 Z"
          fill="#2785a1"
        />

        {/* Right Leaf with negative-space vein */}
        <Path
          d="M 36.79 21.04 Q 37.94 21.04 37.56 23.90 Q 36.32 27.44 35.08 29.35 Q 33.83 30.59 32.40 31.45 Q 30.59 32.02 28.58 32.12 Q 29.44 30.11 30.21 28.96 Q 32.50 26.48 32.59 26.01 Q 32.21 25.72 30.97 26.29 Q 29.63 27.25 28.01 28.96 Q 26.20 31.73 26.10 29.54 Q 26.58 27.15 27.34 25.53 Q 28.20 24.38 29.35 23.33 Q 31.35 22.19 34.41 21.33 Q 36.70 21.14 36.79 21.04 Z"
          fill="#2785a1"
        />

        {/* Stem Trunk */}
        <Path
          d="M 22.28 30.11 Q 23.33 32.69 24.00 35.46 Q 24.57 40.04 24.57 41.85 Q 24.29 42.05 23.90 41.85 Q 23.62 37.18 23.05 34.12 Q 22.09 31.26 22.19 30.21 Z"
          fill="#0a4b69"
        />
        {/* Stem Branch to right leaf */}
        <Path
          d="M 25.43 32.12 Q 25.91 32.40 25.91 32.59 Q 24.76 35.65 24.48 34.03 Q 25.43 32.21 25.43 32.12 Z"
          fill="#0a4b69"
        />

        {/* Soil Base / Ground Lobes */}
        <Path
          d="M 28.11 40.90 Q 29.54 40.90 30.59 41.19 Q 31.83 41.85 33.07 43.00 Q 24.14 43.00 15.22 43.00 Q 15.88 42.24 16.74 41.66 Q 18.56 40.99 20.18 40.99 Q 21.80 41.47 24.29 43.00 Q 26.58 41.38 28.01 40.99 Z"
          fill="#0a4b69"
        />
      </Svg>

      {variant !== 'icon' && (
        <View style={{
          justifyContent: 'center',
          ...(variant === 'full' ? { borderLeftWidth: 1, borderLeftColor: '#475569', paddingLeft: 12 } : {}),
        }}>
          <Text style={{
            color: '#ffffff',
            fontSize: variant === 'compact' ? 17 : 19,
            fontWeight: '800',
            letterSpacing: 0.5,
          }}>
            SLLAS
          </Text>
          {variant === 'full' && (
            <>
              <Text style={{
                color: '#94a3b8',
                fontSize: 9.5,
                fontWeight: '500',
                marginTop: 1,
              }}>
                Smart Land Lease &amp; Allocation System
              </Text>
              <View style={{ marginTop: 3 }}>
                <Text style={{
                  color: '#64748b',
                  fontSize: 7,
                  letterSpacing: 1.1,
                  fontWeight: '600',
                }}>
                  REPUBLIC OF ZIMBABWE
                </Text>
                <View style={{ flexDirection: 'row', width: 44, height: 3, marginTop: 2, borderRadius: 1.5, overflow: 'hidden' }}>
                  {stripeColors.map((color, index) => (
                    <View key={index} style={{ backgroundColor: color, flex: 1 }} />
                  ))}
                </View>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLLAS ANIMATED MOTION SPLASH / LOADING SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function SllasMotionSplashScreen({ onFinish }: { onFinish: () => void }) {
  const logoScale = useRef(new Animated.Value(0.2)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.85)).current;
  const glowOpacity = useRef(new Animated.Value(0.65)).current;
  const ribbonScaleX = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(24)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const [loadingStep, setLoadingStep] = useState('Initializing Vision 2030 Cadastre Spatial Engine...');

  useEffect(() => {
    // 1. Continuous breathing glow loop
    const glowLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(glowScale, {
            toValue: 1.35,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowScale, {
            toValue: 0.85,
            duration: 1800,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.12,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.65,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    glowLoop.start();

    // 2. Entrance sequence for SLLAS Emblem & Typography
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 750,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      // 3. National ribbon expansion & typography reveal
      Animated.parallel([
        Animated.timing(ribbonScaleX, {
          toValue: 1,
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 600,
          delay: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 4. Progress bar animation & Step messages
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2700,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();

    const timer1 = setTimeout(() => {
      setLoadingStep('Authenticating 99-Year Leasehold Security...');
    }, 850);

    const timer2 = setTimeout(() => {
      setLoadingStep('Loading Provincial Land Inventories & Waiting List...');
    }, 1750);

    const timer3 = setTimeout(() => {
      setLoadingStep('SLLAS Mobile Engine Ready • Launching Portal...');
    }, 2400);

    const finishTimer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2900);

    return () => {
      glowLoop.stop();
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(finishTimer);
    };
  }, []);

  const spinInterpolation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-16deg', '0deg'],
  });

  return (
    <Animated.View style={[styles.splashContainer, { opacity: screenOpacity }]}>
      <SafeAreaView style={styles.splashSafeArea}>
        {/* Top Header Pill */}
        <View style={styles.splashTopBadge}>
          <Text style={styles.splashTopBadgeText}>🇿🇼 REPUBLIC OF ZIMBABWE • VISION 2030</Text>
        </View>

        {/* Central Animated Motion Logo Section */}
        <View style={styles.splashCenterContent}>
          {/* Ambient Glowing Halo Ring */}
          <Animated.View
            style={[
              styles.splashHaloRing,
              {
                transform: [{ scale: glowScale }],
                opacity: glowOpacity,
              },
            ]}
          />

          {/* SLLAS Badge Emblem with Scale and Rotation */}
          <Animated.View
            style={[
              styles.splashEmblemWrap,
              {
                opacity: logoOpacity,
                transform: [
                  { scale: logoScale },
                  { rotate: spinInterpolation },
                ],
              },
            ]}
          >
            <Svg width={120} height={120} viewBox="0 0 48 48">
              <Defs>
                <LinearGradient id="motionSplashBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#ffffff" />
                  <Stop offset="100%" stopColor="#f8fafc" />
                </LinearGradient>
              </Defs>

              {/* Squircle Badge Base */}
              <Rect
                x="1"
                y="1"
                width="46"
                height="46"
                rx="10"
                fill="url(#motionSplashBadgeGrad)"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="1.2"
              />

              {/* Central Sprout Leaf */}
              <Path
                d="M 24.00 5.29 Q 25.62 6.91 27.06 9.11 Q 27.82 10.92 28.20 13.12 Q 28.01 15.79 27.44 17.51 Q 26.39 19.51 24.10 22.19 Q 22.85 21.14 21.33 19.23 Q 20.37 17.41 19.80 15.03 Q 19.99 12.16 20.75 9.96 Q 22.38 7.20 24.00 5.29 Z"
                fill="#2785a1"
              />

              {/* Left Leaf */}
              <Path
                d="M 11.11 19.13 Q 14.55 19.42 16.46 19.99 Q 18.37 21.04 19.61 22.19 Q 20.56 23.62 21.23 25.34 Q 21.61 27.82 21.52 29.92 Q 20.18 27.63 18.84 26.10 Q 17.22 24.86 15.60 24.10 Q 15.22 24.29 15.22 24.67 Q 18.37 28.11 19.80 30.30 Q 19.99 30.97 17.89 30.97 Q 15.88 30.59 13.97 29.73 Q 12.16 28.11 10.54 25.34 Q 9.68 21.99 9.49 19.32 Q 11.02 19.23 11.11 19.13 Z"
                fill="#2785a1"
              />

              {/* Right Leaf */}
              <Path
                d="M 36.79 21.04 Q 37.94 21.04 37.56 23.90 Q 36.32 27.44 35.08 29.35 Q 33.83 30.59 32.40 31.45 Q 30.59 32.02 28.58 32.12 Q 29.44 30.11 30.21 28.96 Q 32.50 26.48 32.59 26.01 Q 32.21 25.72 30.97 26.29 Q 29.63 27.25 28.01 28.96 Q 26.20 31.73 26.10 29.54 Q 26.58 27.15 27.34 25.53 Q 28.20 24.38 29.35 23.33 Q 31.35 22.19 34.41 21.33 Q 36.70 21.14 36.79 21.04 Z"
                fill="#2785a1"
              />

              {/* Stem Trunk */}
              <Path
                d="M 22.28 30.11 Q 23.33 32.69 24.00 35.46 Q 24.57 40.04 24.57 41.85 Q 24.29 42.05 23.90 41.85 Q 23.62 37.18 23.05 34.12 Q 22.09 31.26 22.19 30.21 Z"
                fill="#0a4b69"
              />

              {/* Stem Branch to right leaf */}
              <Path
                d="M 25.43 32.12 Q 25.91 32.40 25.91 32.59 Q 24.76 35.65 24.48 34.03 Q 25.43 32.21 25.43 32.12 Z"
                fill="#0a4b69"
              />

              {/* Soil Base / Ground Lobes */}
              <Path
                d="M 28.11 40.90 Q 29.54 40.90 30.59 41.19 Q 31.83 41.85 33.07 43.00 Q 24.14 43.00 15.22 43.00 Q 15.88 42.24 16.74 41.66 Q 18.56 40.99 20.18 40.99 Q 21.80 41.47 24.29 43.00 Q 26.58 41.38 28.01 40.99 Z"
                fill="#0a4b69"
              />
            </Svg>
          </Animated.View>

          {/* Animated Zimbabwe National 4-Stripe Ribbon */}
          <Animated.View
            style={[
              styles.splashRibbonWrap,
              {
                opacity: ribbonScaleX,
                transform: [{ scaleX: ribbonScaleX }],
              },
            ]}
          >
            <View style={[styles.splashRibbonBar, { backgroundColor: '#006B3F' }]} />
            <View style={[styles.splashRibbonBar, { backgroundColor: '#FFD200' }]} />
            <View style={[styles.splashRibbonBar, { backgroundColor: '#D40000' }]} />
            <View style={[styles.splashRibbonBar, { backgroundColor: '#000000' }]} />
          </Animated.View>

          {/* Animated Typographic Title */}
          <Animated.View
            style={[
              styles.splashTitleWrap,
              {
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              },
            ]}
          >
            <Text style={styles.splashTitle}>SLLAS</Text>
            <View style={styles.splashBadgePill}>
              <Text style={styles.splashBadgePillText}>SMART LAND LEASE & ALLOCATION SYSTEM</Text>
            </View>
          </Animated.View>

          {/* Subtitle / Ministry Tagline */}
          <Animated.View
            style={[
              styles.splashSubtitleWrap,
              {
                opacity: subtitleOpacity,
              },
            ]}
          >
            <Text style={styles.splashMinistryText}>Ministry of Lands, Agriculture, Fisheries, Water & Rural Development</Text>
            <Text style={styles.splashActText}>Agricultural Land Settlement Act (Cap 20:01)</Text>
          </Animated.View>
        </View>

        {/* Bottom Loading Progress Bar & Live Status Stepper */}
        <View style={styles.splashBottomBar}>
          <View style={styles.splashStatusRow}>
            <View style={styles.splashPulseDot} />
            <Text style={styles.splashStatusText}>{loadingStep}</Text>
          </View>

          {/* Modern Capsule Progress Track */}
          <View style={styles.splashProgressTrack}>
            <Animated.View
              style={[
                styles.splashProgressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          {/* Skip Button */}
          <Pressable onPress={onFinish} style={styles.splashSkipBtn}>
            <Text style={styles.splashSkipText}>Skip Intro →</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

export default function App() {
  // Splash / Loading Screen State
  const [isLoading, setIsLoading] = useState(true);

  // Authentication & Onboarding State - Users MUST login before accessing home
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'welcome' | 'signin' | 'register' | 'recover'>('signin');
  const [loginEmail, setLoginEmail] = useState('farmer@sllas.gov.zw');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [recoverEmail, setRecoverEmail] = useState('');
  const [regName, setRegName] = useState('Tafadzwa Chikata');
  const [regId, setRegId] = useState('63-128944-P-63');
  const [regPhone, setRegPhone] = useState('+263 77 345 6789');

  const handleSignIn = () => {
    if (!loginEmail.trim()) {
      Alert.alert('Authentication Required', 'Please enter your registered National ID or Email to proceed.');
      return;
    }
    if (!loginPassword.trim()) {
      Alert.alert('Password Required', 'Please enter your password to sign in to the SLLAS Client Portal.');
      return;
    }
    setIsAuthenticated(true);
    setActiveTab('home');
  };

  const handleRegister = () => {
    if (!regName.trim() || !regId.trim()) {
      Alert.alert('Incomplete Registration', 'Please provide your Full Legal Name and National ID to register.');
      return;
    }
    setProfile(p => ({
      ...p,
      name: regName.trim(),
      nationalId: regId.trim(),
      phone: regPhone.trim() || p.phone,
    }));
    setIsAuthenticated(true);
    setActiveTab('home');
  };

  // Main Mobile Navigation
  const [activeTab, setActiveTab] = useState<MobileTabKey>('home');

  // Client Data
  const [profile, setProfile] = useState<ClientProfile>(INITIAL_PROFILE);
  const [applications, setApplications] = useState<ApplicationStatusItem[]>(INITIAL_APPLICATIONS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Land Search Filters (Section 4.3.2 Specification: Province, District, Land Use, Size, Availability)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('All');
  const [selectedLandUse, setSelectedLandUse] = useState<LandUseCategory>('All');
  const [selectedSizeRange, setSelectedSizeRange] = useState<SizeRangeFilter>('All');
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityFilter>('All');

  // Modals & Details
  const [selectedParcel, setSelectedParcel] = useState<MobileParcel | null>(null);
  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);
  const [applyIntendedActivity, setApplyIntendedActivity] = useState('Commercial Maize & Wheat Cropping');
  const [applyInvestmentUsd, setApplyInvestmentUsd] = useState('25000');
  const [applySupportingInfo, setApplySupportingInfo] = useState('Mechanised crop production with center-pivot irrigation infrastructure.');
  const [uploadedDocument, setUploadedDocument] = useState<string | null>('National_ID_63-128944.pdf');

  // Cadastre GIS Map View States
  const [mapSelectedProvince, setMapSelectedProvince] = useState<string>('All');
  const [mapLayerMode, setMapLayerMode] = useState<'satellite' | 'cadastre' | 'agro' | 'water'>('satellite');
  const [showMapGrid, setShowMapGrid] = useState<boolean>(true);

  // Menu Hub Navigation & Sub-views: Profile Management, Settings, News Feed, Logout
  const [menuView, setMenuView] = useState<'hub' | 'profile' | 'settings' | 'news'>('hub');
  const [settingsLanguage, setSettingsLanguage] = useState<'English (ZW)' | 'ChiShona' | 'isiNdebele'>('English (ZW)');
  const [settingsBioAuth, setSettingsBioAuth] = useState(true);
  const [settingsOfflineCache, setSettingsOfflineCache] = useState(true);

  // News Feed Auto-Update & Filter States
  const [newsCategory, setNewsCategory] = useState<string>('ALL');
  const [selectedNewsArticle, setSelectedNewsArticle] = useState<MobileNewsArticle | null>(null);
  const [newsCountdown, setNewsCountdown] = useState<number>(10);
  const [isNewsPaused, setIsNewsPaused] = useState<boolean>(false);
  const [newsBatchIndex, setNewsBatchIndex] = useState<number>(0);

  // 10-Second Auto-Refresh Timer for News Feed
  useEffect(() => {
    if (activeTab !== 'menu' || menuView !== 'news' || isNewsPaused) return;

    const interval = setInterval(() => {
      setNewsCountdown(prev => {
        if (prev <= 1) {
          setNewsBatchIndex(b => (b === 0 ? 1 : 0));
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTab, menuView, isNewsPaused]);

  // Filtered News Articles
  const filteredNews = useMemo(() => {
    let list = MOBILE_NEWS_ARTICLES;
    if (newsCategory !== 'ALL') {
      list = list.filter(a => a.category === newsCategory);
    }
    return list;
  }, [newsCategory]);

  // Safe Logout Confirmation Handler (Cross-Platform Mobile & Web)
  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const g = globalThis as unknown as { confirm?: (msg: string) => boolean };
      const confirmed = typeof g.confirm === 'function' ? g.confirm('Are you sure you want to log out of the SLLAS Client Land Portal?') : true;
      if (confirmed) {
        setIsAuthenticated(false);
        setAuthView('signin');
        setActiveTab('home');
        setMenuView('hub');
      }
      return;
    }
    Alert.alert(
      'Sign Out of SLLAS',
      'Are you sure you want to log out of the SLLAS Client Land Portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            setIsAuthenticated(false);
            setAuthView('signin');
            setActiveTab('home');
            setMenuView('hub');
            Alert.alert('Session Terminated', 'You have been safely signed out.');
          },
        },
      ]
    );
  };

  // Filtered Parcels for Map View
  const mapFilteredParcels = useMemo(() => {
    return MOCK_PARCELS.filter(p => {
      if (mapSelectedProvince === 'All') return true;
      return p.province === mapSelectedProvince;
    });
  }, [mapSelectedProvince]);

  // Filtered Parcels for Search Screen
  const filteredParcels = useMemo(() => {
    return MOCK_PARCELS.filter(p => {
      const matchText = searchQuery === '' ||
        p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.district.toLowerCase().includes(searchQuery.toLowerCase());
      const matchProv = selectedProvince === 'All' || p.province === selectedProvince;
      const matchUse = selectedLandUse === 'All' || p.landUse === selectedLandUse;
      const matchAvail = selectedAvailability === 'All' || p.availability === selectedAvailability;

      let matchSize = true;
      if (selectedSizeRange === '<50 ha') matchSize = p.hectares < 50;
      else if (selectedSizeRange === '50-100 ha') matchSize = p.hectares >= 50 && p.hectares <= 100;
      else if (selectedSizeRange === '100-250 ha') matchSize = p.hectares > 100 && p.hectares <= 250;
      else if (selectedSizeRange === '250+ ha') matchSize = p.hectares > 250;

      return matchText && matchProv && matchUse && matchAvail && matchSize;
    });
  }, [searchQuery, selectedProvince, selectedLandUse, selectedAvailability, selectedSizeRange]);

  // Handle Lease Application Submission (Section 4.3.2 Specification Item 5)
  const handleSubmitLeaseApplication = () => {
    if (!selectedParcel) return;

    const newApp: ApplicationStatusItem = {
      id: `app-${Date.now()}`,
      applicationNumber: `APP-2026-${selectedParcel.province.substring(0, 3).toUpperCase()}-00${applications.length + 1}`,
      waitingListNumber: `WL-2026-0${184 + applications.length + 1}`,
      parcelRef: selectedParcel.referenceNumber,
      hectares: selectedParcel.hectares,
      intendedActivity: applyIntendedActivity,
      status: 'SUBMITTED',
      lodgedDate: 'Today',
      officerRemarks: 'Application received into district queue. Cadastre verification scheduled.',
      history: [
        { status: 'SUBMITTED', date: 'Today', note: 'Formal state land lease application lodged with uploaded KYC documents.' }
      ],
    };

    setApplications(prev => [newApp, ...prev]);
    setIsApplyModalVisible(false);
    setSelectedParcel(null);

    // Add In-App Notification
    const newNotif: NotificationItem = {
      id: `n-${Date.now()}`,
      title: 'Application Lodged Successfully',
      message: `Your application for ${selectedParcel.referenceNumber} has been received and assigned ${newApp.waitingListNumber}.`,
      type: 'STATUS_UPDATE',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);

    Alert.alert('Application Lodged', `Your application for parcel ${selectedParcel.referenceNumber} is now registered on the Waiting List (#${newApp.waitingListNumber}).`);
    setActiveTab('applications');
  };

  // 0. SLLAS ANIMATED MOTION SPLASH / LOADING SCREEN
  if (isLoading) {
    return <SllasMotionSplashScreen onFinish={() => setIsLoading(false)} />;
  }

  // 1. WELCOME & SIGN-IN / REGISTRATION SCREEN (Section 4.3.2 Item 1)
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <View style={styles.authCard}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <SllasLogo variant="full" size={56} />
          </View>
          <Text style={styles.heraldryText}>🇿🇼 REPUBLIC OF ZIMBABWE</Text>
          <Text style={styles.authHeaderTitle}>SLLAS Client Portal</Text>
          <Text style={styles.authSubtitle}>
            Smart Land Lease &amp; Allocation System • Agricultural Land Settlement Act
          </Text>

          {authView === 'welcome' && (
            <View style={styles.authButtonGroup}>
              <Pressable style={styles.primaryButton} onPress={() => setAuthView('signin')}>
                <Text style={styles.primaryButtonText}>Sign In to Account</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => setAuthView('register')}>
                <Text style={styles.secondaryButtonText}>Create New Client Account</Text>
              </Pressable>
              <Pressable onPress={() => setAuthView('recover')} style={styles.textLink}>
                <Text style={styles.textLinkText}>Forgot Access / Recover Credentials?</Text>
              </Pressable>
            </View>
          )}

          {authView === 'signin' && (
            <View style={styles.formStack}>
              <Text style={styles.inputLabel}>National ID or Email</Text>
              <TextInput
                style={styles.textInput}
                value={loginEmail}
                onChangeText={setLoginEmail}
                placeholder="e.g. 63-128944-P-63 or farmer@sllas.gov.zw"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
              />
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.textInput}
                value={loginPassword}
                onChangeText={setLoginPassword}
                placeholder="Enter password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
              <Pressable style={styles.primaryButton} onPress={handleSignIn}>
                <Text style={styles.primaryButtonText}>Sign In to SLLAS Portal</Text>
              </Pressable>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <Pressable onPress={() => setAuthView('register')} style={styles.textLink}>
                  <Text style={styles.textLinkText}>Create New Account</Text>
                </Pressable>
                <Pressable onPress={() => setAuthView('recover')} style={styles.textLink}>
                  <Text style={styles.textLinkText}>Forgot Password?</Text>
                </Pressable>
              </View>
            </View>
          )}

          {authView === 'register' && (
            <View style={styles.formStack}>
              <Text style={styles.inputLabel}>Full Legal Name</Text>
              <TextInput
                style={styles.textInput}
                value={regName}
                onChangeText={setRegName}
                placeholder="e.g. Tafadzwa Chikata"
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.inputLabel}>National ID / Passport</Text>
              <TextInput
                style={styles.textInput}
                value={regId}
                onChangeText={setRegId}
                placeholder="e.g. 63-128944-P-63"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
              />
              <Text style={styles.inputLabel}>Mobile Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={regPhone}
                onChangeText={setRegPhone}
                placeholder="+263 77..."
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
              />
              <Pressable style={styles.primaryButton} onPress={handleRegister}>
                <Text style={styles.primaryButtonText}>Complete Registration</Text>
              </Pressable>
              <Pressable onPress={() => setAuthView('signin')} style={styles.textLink}>
                <Text style={styles.textLinkText}>← Back to Sign In</Text>
              </Pressable>
            </View>
          )}

          {authView === 'recover' && (
            <View style={styles.formStack}>
              <Text style={styles.inputLabel}>Registered National ID or Email</Text>
              <TextInput
                style={styles.textInput}
                value={recoverEmail}
                onChangeText={setRecoverEmail}
                placeholder="Enter your registered ID or email"
                placeholderTextColor="#94a3b8"
              />
              <Pressable style={styles.primaryButton} onPress={() => { Alert.alert('Recovery Link Sent', 'Recovery SMS has been dispatched to your verified mobile number.'); setAuthView('welcome'); }}>
                <Text style={styles.primaryButtonText}>Send Recovery SMS / OTP</Text>
              </Pressable>
              <Pressable onPress={() => setAuthView('welcome')} style={styles.textLink}>
                <Text style={styles.textLinkText}>← Back to Welcome</Text>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      {/* Mobile Top Navigation Header */}
      <View style={styles.topHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <SllasLogo variant="icon" size={40} />
          <View>
            <Text style={styles.heraldryText}>🇿🇼 REPUBLIC OF ZIMBABWE • SLLAS</Text>
            <Text style={styles.topHeaderTitle}>Client Land Portal</Text>
          </View>
        </View>
        <Pressable
          style={styles.notifBadgeBtn}
          onPress={() => setActiveTab('notifications')}
        >
          <Text style={styles.notifIcon}>🔔</Text>
          {notifications.some(n => !n.read) && <View style={styles.unreadDot} />}
        </Pressable>
      </View>

      {/* Main Content Area by Tab */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 2. HOME SCREEN (Section 4.3.2 Item 2) */}
        {activeTab === 'home' && (
          <View style={styles.tabContent}>
            {/* Welcome Citizen Card */}
            <View style={styles.card}>
              <Text style={styles.cardEyebrow}>VERIFIED APPLICANT TIER 1</Text>
              <Text style={styles.cardTitle}>{profile.name}</Text>
              <Text style={styles.cardSub}>ID: {profile.nationalId} • {profile.district}, {profile.province}</Text>
            </View>

            {/* Quick Action Shortcuts */}
            <Text style={styles.sectionHeading}>Shortcuts</Text>
            <View style={styles.shortcutRow}>
              <Pressable style={[styles.shortcutBtn, { backgroundColor: '#166534' }]} onPress={() => setActiveTab('search')}>
                <Text style={styles.shortcutIcon}>🔍</Text>
                <Text style={styles.shortcutText}>Search</Text>
              </Pressable>
              <Pressable style={[styles.shortcutBtn, { backgroundColor: '#0f766e' }]} onPress={() => setActiveTab('map')}>
                <Text style={styles.shortcutIcon}>🗺️</Text>
                <Text style={styles.shortcutText}>Map View</Text>
              </Pressable>
              <Pressable style={[styles.shortcutBtn, { backgroundColor: '#1e3a8a' }]} onPress={() => setActiveTab('applications')}>
                <Text style={styles.shortcutIcon}>📜</Text>
                <Text style={styles.shortcutText}>My Leases</Text>
              </Pressable>
            </View>

            {/* Active Applications */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <Text style={styles.sectionHeading}>Active Applications ({applications.length})</Text>
              <Pressable onPress={() => setActiveTab('applications')}>
                <Text style={styles.linkText}>View all →</Text>
              </Pressable>
            </View>
            {applications.map(app => (
              <Pressable key={app.id} style={styles.card} onPress={() => setActiveTab('applications')}>
                <View style={styles.cardRow}>
                  <Text style={styles.refText}>{app.applicationNumber}</Text>
                  <Text style={[styles.statusBadge, { backgroundColor: '#3b82f6' }]}>{app.status}</Text>
                </View>
                <Text style={styles.itemTitle}>{app.intendedActivity}</Text>
                <Text style={styles.cardSub}>Waiting List: {app.waitingListNumber} • {app.hectares} ha</Text>
              </Pressable>
            ))}

            {/* Recent Notifications Feed */}
            <Text style={styles.sectionHeading}>Recent Notifications</Text>
            {notifications.slice(0, 3).map(notif => (
              <View key={notif.id} style={[styles.card, !notif.read && styles.unreadCard]}>
                <Text style={styles.itemTitle}>{notif.title}</Text>
                <Text style={styles.cardSub}>{notif.message}</Text>
                <Text style={styles.timestampText}>{notif.timestamp}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 3. LAND SEARCH SCREEN (Section 4.3.2 Item 3) */}
        {activeTab === 'search' && (
          <View style={styles.tabContent}>
            <Text style={styles.pageTitle}>Land Search Cadastre</Text>
            <Text style={styles.cardSub}>Filter available state land parcels by location, category, and size.</Text>

            {/* Search Input */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search reference, district, or parcel name..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Filter: Province */}
            <Text style={styles.filterLabel}>Province</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {['All', 'Mashonaland West', 'Midlands', 'Manicaland', 'Mashonaland East'].map(p => (
                <Pressable
                  key={p}
                  style={[styles.chip, selectedProvince === p && styles.chipActive]}
                  onPress={() => setSelectedProvince(p)}
                >
                  <Text style={[styles.chipText, selectedProvince === p && styles.chipTextActive]}>{p}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Filter: Land Use */}
            <Text style={styles.filterLabel}>Land Use Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {(['All', 'Commercial Cropping', 'Livestock Ranching', 'Horticulture', 'Mixed Farming'] as const).map(u => (
                <Pressable
                  key={u}
                  style={[styles.chip, selectedLandUse === u && styles.chipActive]}
                  onPress={() => setSelectedLandUse(u)}
                >
                  <Text style={[styles.chipText, selectedLandUse === u && styles.chipTextActive]}>{u}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Filter: Size Range */}
            <Text style={styles.filterLabel}>Size Range</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {(['All', '<50 ha', '50-100 ha', '100-250 ha', '250+ ha'] as const).map(s => (
                <Pressable
                  key={s}
                  style={[styles.chip, selectedSizeRange === s && styles.chipActive]}
                  onPress={() => setSelectedSizeRange(s)}
                >
                  <Text style={[styles.chipText, selectedSizeRange === s && styles.chipTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Filter: Availability Status */}
            <Text style={styles.filterLabel}>Availability Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {(['All', 'Available', 'Reserved', 'Allocated'] as const).map(a => (
                <Pressable
                  key={a}
                  style={[styles.chip, selectedAvailability === a && styles.chipActive]}
                  onPress={() => setSelectedAvailability(a)}
                >
                  <Text style={[styles.chipText, selectedAvailability === a && styles.chipTextActive]}>{a}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Parcel Results List */}
            <Text style={[styles.sectionHeading, { marginTop: 16 }]}>
              Found Parcels ({filteredParcels.length})
            </Text>
            {filteredParcels.map(parcel => (
              <Pressable
                key={parcel.id}
                style={styles.card}
                onPress={() => setSelectedParcel(parcel)}
              >
                <View style={styles.cardRow}>
                  <Text style={styles.refText}>{parcel.referenceNumber}</Text>
                  <Text style={[
                    styles.statusBadge,
                    { backgroundColor: parcel.availability === 'Available' ? '#16a34a' : '#d97706' }
                  ]}>
                    {parcel.availability}
                  </Text>
                </View>
                <Text style={styles.itemTitle}>{parcel.name}</Text>
                <Text style={styles.cardSub}>
                  📍 {parcel.district}, {parcel.province} • 📐 {parcel.hectares} ha • 🌾 {parcel.landUse}
                </Text>
                <Text style={styles.viewDetailsText}>Tap to inspect parcel &amp; apply →</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* 4. PARCEL DETAIL SCREEN & 5. LEASE APPLICATION FORM (Modal Below) */}

        {/* 6. APPLICATION STATUS SCREEN (Section 4.3.2 Item 6) */}
        {activeTab === 'applications' && (
          <View style={styles.tabContent}>
            <Text style={styles.pageTitle}>Application Status &amp; Leases</Text>
            <Text style={styles.cardSub}>Track your statutory land allocation applications and officer decisions.</Text>

            {applications.map(app => (
              <View key={app.id} style={styles.detailCard}>
                <View style={styles.cardRow}>
                  <Text style={styles.refText}>{app.applicationNumber}</Text>
                  <Text style={[styles.statusBadge, { backgroundColor: '#2563eb' }]}>{app.status}</Text>
                </View>
                <Text style={styles.itemTitle}>{app.intendedActivity}</Text>
                <Text style={styles.cardSub}>
                  Waiting List: <Text style={{ fontWeight: 'bold' }}>{app.waitingListNumber}</Text> • Parcel: {app.parcelRef} ({app.hectares} ha)
                </Text>

                {/* Status Progress Stepper */}
                <Text style={[styles.filterLabel, { marginTop: 14 }]}>Statutory Progress Stepper</Text>
                <View style={styles.stepperContainer}>
                  {['SUBMITTED', 'UNDER_INSPECTION', 'ALLOCATED', 'APPROVED'].map((step, idx) => {
                    const stepOrder = ['SUBMITTED', 'UNDER_INSPECTION', 'ALLOCATED', 'APPROVED'];
                    const currentIdx = stepOrder.indexOf(app.status);
                    const isDone = currentIdx >= idx;
                    return (
                      <View key={step} style={styles.stepItem}>
                        <View style={[styles.stepCircle, isDone && styles.stepCircleDone]}>
                          <Text style={styles.stepNum}>{isDone ? '✓' : idx + 1}</Text>
                        </View>
                        <Text style={[styles.stepLabel, isDone && styles.stepLabelDone]}>
                          {step.replace('_', ' ')}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Officer Remarks */}
                <View style={styles.remarksBox}>
                  <Text style={styles.remarksHeading}>🏛️ Resettlement Officer Remarks</Text>
                  <Text style={styles.remarksText}>{app.officerRemarks}</Text>
                </View>

                {/* Status History */}
                <Text style={[styles.filterLabel, { marginTop: 12 }]}>Status Timeline History</Text>
                {app.history.map((h, i) => (
                  <View key={i} style={styles.historyRow}>
                    <Text style={styles.historyDot}>•</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyDate}>{h.date} — {h.status}</Text>
                      <Text style={styles.historyNote}>{h.note}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* 6. CADASTRE GIS MAP VIEW SCREEN */}
        {activeTab === 'map' && (
          <View style={styles.tabContent}>
            {/* Header with Datum / Spatial Badge */}
            <View style={styles.mapHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pageTitle}>Cadastre GIS Map</Text>
                <Text style={styles.cardSub}>
                  Interactive national parcel boundary explorer & agro-ecological zones
                </Text>
              </View>
              <View style={styles.mapGpsPill}>
                <Text style={styles.mapGpsText}>📍 WGS84 / Arc1950</Text>
              </View>
            </View>

            {/* Province Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mapFilterScroll}>
              {[
                'All',
                'Mashonaland West',
                'Midlands',
                'Manicaland',
                'Mashonaland East',
                'Masvingo',
                'Mashonaland Central',
                'Matabeleland South',
                'Matabeleland North',
              ].map(prov => (
                <Pressable
                  key={prov}
                  style={[
                    styles.mapFilterChip,
                    mapSelectedProvince === prov && styles.mapFilterChipActive,
                  ]}
                  onPress={() => setMapSelectedProvince(prov)}
                >
                  <Text
                    style={[
                      styles.mapFilterChipText,
                      mapSelectedProvince === prov && styles.mapFilterChipTextActive,
                    ]}
                  >
                    {prov === 'All' ? 'All Zimbabwe' : prov}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Layer switches & Mode selector */}
            <View style={styles.mapLayerRow}>
              {[
                { id: 'satellite', label: '🛰️ Satellite' },
                { id: 'cadastre', label: '🗺️ Vector Cadastre' },
                { id: 'agro', label: '🌱 Agro Zones' },
                { id: 'water', label: '💧 Watercourses' },
              ].map(layer => (
                <Pressable
                  key={layer.id}
                  style={[
                    styles.layerToggleBtn,
                    mapLayerMode === layer.id && styles.layerToggleBtnActive,
                  ]}
                  onPress={() => setMapLayerMode(layer.id as any)}
                >
                  <Text
                    style={[
                      styles.layerToggleText,
                      mapLayerMode === layer.id && styles.layerToggleTextActive,
                    ]}
                  >
                    {layer.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* The Interactive Cadastre & Satellite Map Canvas */}
            <View style={styles.mapCanvasCard}>
              {/* Satellite Layer Backdrop when in Satellite View */}
              {mapLayerMode === 'satellite' && (
                <Image
                  source={SATELLITE_MAP_IMG}
                  style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                  resizeMode="cover"
                />
              )}

              {/* Contrast Shade Overlay for Satellite Mode */}
              {mapLayerMode === 'satellite' && (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: 'rgba(3, 7, 18, 0.28)', borderRadius: 16 },
                  ]}
                />
              )}

              {/* Map HUD Overlay Bar */}
              <View style={styles.mapHudBar}>
                <View style={styles.mapHudItem}>
                  <Text style={styles.mapHudLabel}>
                    {mapLayerMode === 'satellite' ? '🛰️ SATELLITE RADAR' : 'ACTIVE CADASTRE'}
                  </Text>
                  <Text style={styles.mapHudVal}>
                    {mapFilteredParcels.length} Mapped Parcels
                  </Text>
                </View>

                {/* Grid Toggle Button & Legend */}
                <View style={styles.mapHudRightGroup}>
                  <Pressable
                    style={[
                      styles.gridToggleBtn,
                      showMapGrid && styles.gridToggleBtnActive,
                    ]}
                    onPress={() => setShowMapGrid(g => !g)}
                  >
                    <Text
                      style={[
                        styles.gridToggleText,
                        showMapGrid && styles.gridToggleTextActive,
                      ]}
                    >
                      {showMapGrid ? '🌐 Grid: ON' : '🌐 Grid: OFF'}
                    </Text>
                  </Pressable>

                  <View style={styles.mapLegendRow}>
                    <View style={styles.legendDotItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                      <Text style={styles.legendText}>Available</Text>
                    </View>
                    <View style={styles.legendDotItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                      <Text style={styles.legendText}>Reserved</Text>
                    </View>
                    <View style={styles.legendDotItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#60a5fa' }]} />
                      <Text style={styles.legendText}>Allocated</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Interactive Vector / Satellite GIS Canvas */}
              <View style={styles.svgWrapper}>
                <Svg width="100%" height={320} viewBox="0 0 360 300">
                  <Defs>
                    <LinearGradient id="mapBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#080e1b" />
                      <Stop offset="100%" stopColor="#020617" />
                    </LinearGradient>
                  </Defs>

                  {/* Dark Map Canvas Background when not in Satellite view */}
                  {mapLayerMode !== 'satellite' && (
                    <Rect x="0" y="0" width="360" height="300" rx="12" fill="url(#mapBgGrad)" />
                  )}

                  {/* Geodetic Grid Latitudes & Longitudes */}
                  {showMapGrid && (
                    <G>
                      {GEODETIC_GRID.latitudes.map(lat => (
                        <Line
                          key={`lat-${lat.deg}`}
                          x1="0"
                          y1={lat.y}
                          x2="360"
                          y2={lat.y}
                          stroke={
                            mapLayerMode === 'satellite'
                              ? 'rgba(255, 255, 255, 0.40)'
                              : 'rgba(255, 255, 255, 0.12)'
                          }
                          strokeWidth={lat.major ? 1 : 0.6}
                          strokeDasharray={lat.major ? '4,4' : '2,3'}
                        />
                      ))}
                      {GEODETIC_GRID.longitudes.map(lon => (
                        <Line
                          key={`lon-${lon.deg}`}
                          x1={lon.x}
                          y1="0"
                          x2={lon.x}
                          y2="300"
                          stroke={
                            mapLayerMode === 'satellite'
                              ? 'rgba(255, 255, 255, 0.40)'
                              : 'rgba(255, 255, 255, 0.12)'
                          }
                          strokeWidth={lon.major ? 1 : 0.6}
                          strokeDasharray={lon.major ? '4,4' : '2,3'}
                        />
                      ))}

                      {/* Survey Crosshairs (+) at Grid Intersections */}
                      {GEODETIC_GRID.intersections.map(pt => (
                        <G key={`tick-${pt.label}`}>
                          <Line
                            x1={pt.x - 4}
                            y1={pt.y}
                            x2={pt.x + 4}
                            y2={pt.y}
                            stroke={mapLayerMode === 'satellite' ? '#38bdf8' : '#94a3b8'}
                            strokeWidth="1.2"
                          />
                          <Line
                            x1={pt.x}
                            y1={pt.y - 4}
                            x2={pt.x}
                            y2={pt.y + 4}
                            stroke={mapLayerMode === 'satellite' ? '#38bdf8' : '#94a3b8'}
                            strokeWidth="1.2"
                          />
                        </G>
                      ))}

                      {/* Geographic Grid Coordinate Labels */}
                      {GEODETIC_GRID.latitudes
                        .filter(l => l.major)
                        .map(lat => (
                          <SvgText
                            key={`lbl-lat-${lat.deg}`}
                            x="4"
                            y={lat.y - 2}
                            fill={mapLayerMode === 'satellite' ? '#ffffff' : '#64748b'}
                            fontSize="7.5"
                            fontWeight="700"
                          >
                            {lat.deg}
                          </SvgText>
                        ))}
                      {GEODETIC_GRID.longitudes
                        .filter(l => l.major)
                        .map(lon => (
                          <SvgText
                            key={`lbl-lon-${lon.deg}`}
                            x={lon.x + 2}
                            y="12"
                            fill={mapLayerMode === 'satellite' ? '#ffffff' : '#64748b'}
                            fontSize="7.5"
                            fontWeight="700"
                          >
                            {lon.deg}
                          </SvgText>
                        ))}
                    </G>
                  )}

                  {/* Authentic Zimbabwe National Perimeter */}
                  <Path
                    d={ZIMBABWE_NATIONAL_OUTLINE}
                    fill="none"
                    stroke={
                      mapLayerMode === 'satellite'
                        ? 'rgba(56, 189, 248, 0.65)'
                        : '#22c55e'
                    }
                    strokeWidth="2.4"
                  />

                  {/* Official Zimbabwe Provincial Vector Boundaries */}
                  {ZIMBABWE_PROVINCES.map(prov => {
                    const isSelected = mapSelectedProvince === prov.id;
                    const isMatchFilter = mapSelectedProvince === 'All' || mapSelectedProvince === prov.id;

                    let fillColor = 'transparent';
                    if (mapLayerMode === 'satellite') {
                      fillColor = isSelected
                        ? 'rgba(34, 197, 94, 0.32)'
                        : isMatchFilter
                        ? 'rgba(34, 197, 94, 0.08)'
                        : 'rgba(0, 0, 0, 0.35)';
                    } else if (mapLayerMode === 'agro') {
                      const agroItem = AGRO_REGIONS_LEGEND.find(a => a.id === prov.naturalRegion);
                      fillColor = isSelected
                        ? (agroItem ? `${agroItem.color}55` : 'rgba(34, 197, 94, 0.35)')
                        : (agroItem ? `${agroItem.color}25` : prov.fillColor);
                    } else {
                      fillColor = isSelected
                        ? 'rgba(34, 197, 94, 0.28)'
                        : isMatchFilter
                        ? prov.fillColor
                        : 'rgba(15, 23, 42, 0.4)';
                    }

                    const strokeColor = isSelected
                      ? '#4ade80'
                      : mapLayerMode === 'satellite'
                      ? 'rgba(74, 222, 128, 0.55)'
                      : 'rgba(74, 222, 128, 0.35)';

                    return (
                      <G
                        key={prov.id}
                        onPress={() => setMapSelectedProvince(isSelected ? 'All' : prov.id)}
                      >
                        <Path
                          d={prov.path}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={isSelected ? 2 : 1.1}
                        />
                        {/* Province Label Centroid */}
                        <SvgText
                          x={prov.centroid.x}
                          y={prov.centroid.y}
                          fill={
                            isSelected
                              ? '#ffffff'
                              : mapLayerMode === 'satellite'
                              ? '#f0fdf4'
                              : '#86efac'
                          }
                          fontSize={prov.id === 'Harare' || prov.id === 'Bulawayo' ? '8' : '9'}
                          fontWeight={isSelected ? '900' : '700'}
                          textAnchor="middle"
                        >
                          {prov.shortName}
                        </SvgText>
                        {/* Agro indicator sublabel if agro mode */}
                        {mapLayerMode === 'agro' && (
                          <SvgText
                            x={prov.centroid.x}
                            y={prov.centroid.y + 11}
                            fill="#fef08a"
                            fontSize="7"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {prov.naturalRegion}
                          </SvgText>
                        )}
                      </G>
                    );
                  })}

                  {/* Major Watercourses & Lakes */}
                  {ZIMBABWE_WATERCOURSES.map(water => (
                    <G key={water.name}>
                      <Path
                        d={water.path}
                        fill="none"
                        stroke={water.color}
                        strokeWidth={
                          mapLayerMode === 'water' || mapLayerMode === 'satellite'
                            ? water.strokeWidth * 1.3
                            : water.strokeWidth
                        }
                        strokeLinecap="round"
                      />
                      <SvgText
                        x={water.labelPos.x}
                        y={water.labelPos.y}
                        fill={mapLayerMode === 'satellite' ? '#7dd3fc' : '#38bdf8'}
                        fontSize="7.5"
                        fontStyle="italic"
                        fontWeight="600"
                      >
                        {water.name}
                      </SvgText>
                    </G>
                  ))}

                  {/* Interactive Georeferenced Parcel Beacons */}
                  {mapFilteredParcels.map(p => {
                    const isSelected = selectedParcel?.id === p.id;
                    const x = p.mapX || 180;
                    const y = p.mapY || 140;
                    const pinColor =
                      p.availability === 'Available'
                        ? '#22c55e'
                        : p.availability === 'Reserved'
                        ? '#f59e0b'
                        : '#60a5fa';

                    return (
                      <G
                        key={p.id}
                        onPress={() => {
                          setSelectedParcel(p);
                        }}
                      >
                        {/* Radar Pulse on Selected Beacon */}
                        {isSelected && (
                          <>
                            <Circle
                              cx={x}
                              cy={y}
                              r={18}
                              fill="rgba(34, 197, 94, 0.25)"
                              stroke="#4ade80"
                              strokeWidth="1.5"
                            />
                            <Circle
                              cx={x}
                              cy={y}
                              r={26}
                              fill="none"
                              stroke="rgba(74, 222, 128, 0.45)"
                              strokeWidth="1"
                              strokeDasharray="2,2"
                            />
                          </>
                        )}

                        {/* Parcel Outer Halo */}
                        <Circle
                          cx={x}
                          cy={y}
                          r={isSelected ? 9 : 6}
                          fill={pinColor}
                          stroke="#ffffff"
                          strokeWidth={isSelected ? 2 : 1.2}
                        />

                        {/* Beacon Center Core */}
                        <Circle
                          cx={x}
                          cy={y}
                          r={isSelected ? 3.5 : 2}
                          fill="#0f172a"
                        />

                        {/* Parcel Pin Callout Tag */}
                        <G x={x + 7} y={y - 8}>
                          <Rect
                            x="0"
                            y="0"
                            width={isSelected ? 62 : 48}
                            height={14}
                            rx="3"
                            fill={isSelected ? '#14532d' : 'rgba(15, 23, 42, 0.88)'}
                            stroke={isSelected ? '#4ade80' : 'rgba(255, 255, 255, 0.25)'}
                            strokeWidth="0.8"
                          />
                          <SvgText
                            x="4"
                            y="10"
                            fill={isSelected ? '#86efac' : '#e2e8f0'}
                            fontSize="7"
                            fontWeight={isSelected ? 'bold' : 'normal'}
                          >
                            {p.district.substring(0, 5)} • {p.hectares}ha
                          </SvgText>
                        </G>
                      </G>
                    );
                  })}
                </Svg>
              </View>

              {/* Map Footer Telemetry Bar */}
              <View style={styles.mapBottomHudBar}>
                <Text style={styles.mapBottomHudText}>
                  WGS 84 / ARC1950 • UTM ZONE 35S/36S
                </Text>
                <View style={styles.mapSatelliteTelemetryBadge}>
                  <Text style={styles.mapSatelliteTelemetryText}>
                    {mapLayerMode === 'satellite'
                      ? '🛰️ SENTINEL-2 RGB • 10M GSD'
                      : mapLayerMode === 'agro'
                      ? '🌱 AGRO-ECOLOGICAL ZONES'
                      : mapLayerMode === 'water'
                      ? '💧 HYDROLOGY NETWORK'
                      : '🗺️ VECTOR CADASTRE'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Agro-Ecological Legend when in Agro Mode */}
            {mapLayerMode === 'agro' && (
              <View style={styles.agroLegendCard}>
                <Text style={styles.agroLegendTitle}>Agro-Ecological Natural Regions of Zimbabwe</Text>
                {AGRO_REGIONS_LEGEND.map(reg => (
                  <View key={reg.id} style={styles.agroLegendItem}>
                    <View style={[styles.agroLegendDot, { backgroundColor: reg.color }]} />
                    <Text style={styles.agroLegendText}>{reg.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Quick Parcel Inspection Drawer / Card */}
            {selectedParcel && (
              <View style={styles.mapInspectorCard}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.refText}>{selectedParcel.referenceNumber}</Text>
                    <Text style={styles.itemTitle}>{selectedParcel.name}</Text>
                    <Text style={styles.cardSub}>
                      📍 {selectedParcel.district}, {selectedParcel.province} • {selectedParcel.gpsCoords || '17°21\'S 30°12\'E'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          selectedParcel.availability === 'Available'
                            ? '#166534'
                            : selectedParcel.availability === 'Reserved'
                            ? '#854d0e'
                            : '#1e3a8a',
                      },
                    ]}
                  >
                    {selectedParcel.availability}
                  </Text>
                </View>

                {/* Key Spec Badges */}
                <View style={styles.metaRow}>
                  <View style={styles.mapSpecBadge}>
                    <Text style={styles.mapSpecLabel}>AREA</Text>
                    <Text style={styles.mapSpecVal}>{selectedParcel.hectares} ha</Text>
                  </View>
                  <View style={styles.mapSpecBadge}>
                    <Text style={styles.mapSpecLabel}>REGION</Text>
                    <Text style={styles.mapSpecVal}>{selectedParcel.naturalRegion}</Text>
                  </View>
                  <View style={styles.mapSpecBadge}>
                    <Text style={styles.mapSpecLabel}>SOIL</Text>
                    <Text style={styles.mapSpecVal}>{selectedParcel.soilType}</Text>
                  </View>
                  <View style={styles.mapSpecBadge}>
                    <Text style={styles.mapSpecLabel}>WATER</Text>
                    <Text style={styles.mapSpecVal}>
                      {selectedParcel.waterAccess ? 'Dam/Canal' : 'Groundwater'}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.mapActionRow}>
                  {selectedParcel.availability === 'Available' && (
                    <Pressable
                      style={[styles.primaryButton, { flex: 1, paddingVertical: 10 }]}
                      onPress={() => setIsApplyModalVisible(true)}
                    >
                      <Text style={styles.primaryButtonText}>Apply for 99-Year Lease →</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={[styles.secondaryButton, { marginLeft: 8, paddingHorizontal: 12, paddingVertical: 10 }]}
                    onPress={() => setSelectedParcel(null)}
                  >
                    <Text style={styles.secondaryButtonText}>Deselect</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Horizontal Swipeable Parcels Quick-Carousel */}
            <View style={{ marginTop: 14 }}>
              <Text style={styles.sectionHeading}>
                Browse Mapped Parcels ({mapFilteredParcels.length})
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 6, gap: 10 }}
              >
                {mapFilteredParcels.map(p => {
                  const isCurrent = selectedParcel?.id === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      style={[
                        styles.mapCarouselCard,
                        isCurrent && styles.mapCarouselCardActive,
                      ]}
                      onPress={() => setSelectedParcel(p)}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.refText}>{p.referenceNumber}</Text>
                        <View
                          style={[
                            styles.badgeDot,
                            {
                              backgroundColor:
                                p.availability === 'Available'
                                  ? '#22c55e'
                                  : p.availability === 'Reserved'
                                  ? '#f59e0b'
                                  : '#3b82f6',
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.itemTitle, { fontSize: 13, marginTop: 4 }]} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={styles.cardSub}>
                        {p.district} • {p.hectares} ha • {p.naturalRegion}
                      </Text>
                      <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.linkText, { fontSize: 11 }]}>
                          {isCurrent ? '📍 Focused on Map' : 'Focus on Map →'}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}

        {/* 7. NOTIFICATIONS SCREEN (Section 4.3.2 Item 7) */}
        {activeTab === 'notifications' && (
          <View style={styles.tabContent}>
            <Pressable onPress={() => setActiveTab('home')} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back to Home</Text>
            </Pressable>
            <Text style={styles.pageTitle}>Notifications &amp; Reminders</Text>
            <Text style={styles.cardSub}>Real-time statutory updates, lease countdowns, and official gazette alerts.</Text>

            {notifications.map(n => (
              <View key={n.id} style={[styles.card, !n.read && styles.unreadCard]}>
                <View style={styles.cardRow}>
                  <Text style={[styles.badgeTag, {
                    backgroundColor: n.type === 'STATUS_UPDATE' ? '#1e3a8a' : n.type === 'EXPIRY_REMINDER' ? '#7f1d1d' : '#14532d'
                  }]}>
                    {n.type.replace('_', ' ')}
                  </Text>
                  <Text style={styles.timestampText}>{n.timestamp}</Text>
                </View>
                <Text style={styles.itemTitle}>{n.title}</Text>
                <Text style={styles.cardSub}>{n.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 8. MENU & SERVICES HUB (Profile Management, Settings, News Feed, Logout) */}
        {activeTab === 'menu' && (
          <View style={styles.tabContent}>
            {/* SUB-VIEW 1: MENU HUB OVERVIEW */}
            {menuView === 'hub' && (
              <>
                {/* Citizen User Profile Hero Card */}
                <View style={styles.menuUserHeroCard}>
                  <View style={styles.menuUserHeroRow}>
                    <View style={styles.menuAvatarWrap}>
                      <Text style={styles.menuAvatarText}>
                        {profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuUserName}>{profile.name}</Text>
                      <Text style={styles.menuUserId}>ID: {profile.nationalId}</Text>
                      <View style={styles.menuCitizenBadge}>
                        <Text style={styles.menuCitizenBadgeText}>🇿🇼 VERIFIED CITIZEN • TIER 1</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.cardSub, { marginTop: 10, fontSize: 11 }]}>
                    📍 {profile.address} • {profile.district}, {profile.province}
                  </Text>
                </View>

                {/* Section Header */}
                <Text style={styles.sectionHeading}>Services &amp; Navigation</Text>

                {/* 4 Primary Menu Function Cards */}
                <View style={styles.menuCardGrid}>
                  {/* 1. Profile Management */}
                  <Pressable
                    style={styles.menuActionCard}
                    onPress={() => setMenuView('profile')}
                  >
                    <View style={[styles.menuIconCircle, { backgroundColor: 'rgba(34, 197, 94, 0.16)' }]}>
                      <Text style={styles.menuIconGlyph}>👤</Text>
                    </View>
                    <View style={styles.menuCardContent}>
                      <View style={styles.menuCardHeaderRow}>
                        <Text style={styles.menuCardTitle}>Profile Management</Text>
                        <View style={[styles.menuCardBadge, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                          <Text style={{ color: '#4ade80', fontSize: 9, fontWeight: '700' }}>KYC Verified</Text>
                        </View>
                      </View>
                      <Text style={styles.menuCardDesc}>
                        Manage verified identification, contact numbers, email &amp; physical farm stand
                      </Text>
                    </View>
                    <Text style={styles.menuArrowGlyph}>→</Text>
                  </Pressable>

                  {/* 2. Settings */}
                  <Pressable
                    style={styles.menuActionCard}
                    onPress={() => setMenuView('settings')}
                  >
                    <View style={[styles.menuIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.16)' }]}>
                      <Text style={styles.menuIconGlyph}>⚙️</Text>
                    </View>
                    <View style={styles.menuCardContent}>
                      <View style={styles.menuCardHeaderRow}>
                        <Text style={styles.menuCardTitle}>Settings</Text>
                        <View style={[styles.menuCardBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                          <Text style={{ color: '#38bdf8', fontSize: 9, fontWeight: '700' }}>Alerts &amp; Security</Text>
                        </View>
                      </View>
                      <Text style={styles.menuCardDesc}>
                        Notification channels, language selection, biometric login &amp; offline cadastre
                      </Text>
                    </View>
                    <Text style={styles.menuArrowGlyph}>→</Text>
                  </Pressable>

                  {/* 3. News Feed */}
                  <Pressable
                    style={styles.menuActionCard}
                    onPress={() => setMenuView('news')}
                  >
                    <View style={[styles.menuIconCircle, { backgroundColor: 'rgba(234, 179, 8, 0.16)' }]}>
                      <Text style={styles.menuIconGlyph}>📰</Text>
                    </View>
                    <View style={styles.menuCardContent}>
                      <View style={styles.menuCardHeaderRow}>
                        <Text style={styles.menuCardTitle}>News Feed</Text>
                        <View style={[styles.menuCardBadge, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                          <Text style={{ color: '#facc15', fontSize: 9, fontWeight: '700' }}>Live Wire ⚡</Text>
                        </View>
                      </View>
                      <Text style={styles.menuCardDesc}>
                        Live Land Reform gazettes, Herald agricultural updates &amp; 10s auto-refresh wire
                      </Text>
                    </View>
                    <Text style={styles.menuArrowGlyph}>→</Text>
                  </Pressable>

                  {/* 4. Logout */}
                  <Pressable
                    style={[styles.menuActionCard, { borderColor: 'rgba(239, 68, 68, 0.25)' }]}
                    onPress={handleLogout}
                  >
                    <View style={[styles.menuIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.16)' }]}>
                      <Text style={styles.menuIconGlyph}>🚪</Text>
                    </View>
                    <View style={styles.menuCardContent}>
                      <View style={styles.menuCardHeaderRow}>
                        <Text style={[styles.menuCardTitle, { color: '#f87171' }]}>Logout</Text>
                        <View style={[styles.menuCardBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                          <Text style={{ color: '#f87171', fontSize: 9, fontWeight: '700' }}>End Session</Text>
                        </View>
                      </View>
                      <Text style={styles.menuCardDesc}>
                        Securely sign out of the SLLAS Client Land Portal on this device
                      </Text>
                    </View>
                    <Text style={[styles.menuArrowGlyph, { color: '#ef4444' }]}>→</Text>
                  </Pressable>
                </View>

                {/* Quick Account Summary Strip */}
                <View style={styles.menuStatsStrip}>
                  <View style={styles.menuStatTile}>
                    <Text style={styles.menuStatVal}>1 Active</Text>
                    <Text style={styles.menuStatLabel}>99-Year Lease</Text>
                  </View>
                  <View style={styles.menuStatTile}>
                    <Text style={styles.menuStatVal}>#WL-0185</Text>
                    <Text style={styles.menuStatLabel}>Waiting List</Text>
                  </View>
                  <View style={styles.menuStatTile}>
                    <Text style={styles.menuStatVal}>{notifications.filter(n => !n.read).length} Unread</Text>
                    <Text style={styles.menuStatLabel}>Notices</Text>
                  </View>
                </View>

                {/* Statutory Credits Footer */}
                <View style={styles.menuFooterBox}>
                  <Text style={styles.menuFooterTitle}>REPUBLIC OF ZIMBABWE • VISION 2030</Text>
                  <Text style={styles.menuFooterSub}>
                    Ministry of Lands, Agriculture, Fisheries, Water and Rural Development • SLLAS Mobile v2.4.0
                  </Text>
                </View>
              </>
            )}

            {/* SUB-VIEW 2: PROFILE MANAGEMENT */}
            {menuView === 'profile' && (
              <>
                <Pressable onPress={() => setMenuView('hub')} style={styles.backButton}>
                  <Text style={styles.backButtonText}>← Back to Menu</Text>
                </Pressable>
                <Text style={styles.pageTitle}>Profile Management</Text>
                <Text style={styles.cardSub}>
                  Manage your verified legal identification, contact information, and registered farm location.
                </Text>

                <View style={styles.card}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: 8, borderRadius: 8 }}>
                    <Text style={{ color: '#4ade80', fontSize: 13 }}>🟢</Text>
                    <Text style={{ color: '#86efac', fontSize: 11, fontWeight: '700' }}>
                      Citizen Identity Verified • Ministry KYC Validated
                    </Text>
                  </View>

                  <Text style={styles.inputLabel}>Full Legal Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={profile.name}
                    onChangeText={v => setProfile(p => ({ ...p, name: v }))}
                  />

                  <Text style={styles.inputLabel}>National Identification Number 🔒</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: '#1e293b', color: '#94a3b8' }]}
                    value={profile.nationalId}
                    editable={false}
                  />

                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.textInput}
                    value={profile.email}
                    onChangeText={v => setProfile(p => ({ ...p, email: v }))}
                    keyboardType="email-address"
                  />

                  <Text style={styles.inputLabel}>Contact Phone Number</Text>
                  <TextInput
                    style={styles.textInput}
                    value={profile.phone}
                    onChangeText={v => setProfile(p => ({ ...p, phone: v }))}
                    keyboardType="phone-pad"
                  />

                  <Text style={styles.inputLabel}>Physical Farm / Residential Address</Text>
                  <TextInput
                    style={styles.textInput}
                    value={profile.address}
                    onChangeText={v => setProfile(p => ({ ...p, address: v }))}
                  />

                  <Text style={styles.inputLabel}>Primary District &amp; Province</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: '#1e293b', color: '#cbd5e1' }]}
                    value={`${profile.district}, ${profile.province}`}
                    editable={false}
                  />

                  <Pressable
                    style={[styles.primaryButton, { marginTop: 14 }]}
                    onPress={() => Alert.alert('Profile Saved', 'Your contact details have been successfully updated in SLLAS.')}
                  >
                    <Text style={styles.primaryButtonText}>Save Contact Details</Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* SUB-VIEW 3: SETTINGS & PREFERENCES */}
            {menuView === 'settings' && (
              <>
                <Pressable onPress={() => setMenuView('hub')} style={styles.backButton}>
                  <Text style={styles.backButtonText}>← Back to Menu</Text>
                </Pressable>
                <Text style={styles.pageTitle}>Settings &amp; Preferences</Text>
                <Text style={styles.cardSub}>
                  Configure notification dispatch channels, preferred language, biometric security, and offline mapping.
                </Text>

                {/* Notification Channels */}
                <Text style={styles.sectionHeading}>Notification Channels</Text>
                <View style={styles.card}>
                  <Pressable
                    style={styles.preferenceRow}
                    onPress={() => setProfile(p => ({ ...p, smsNotifications: !p.smsNotifications }))}
                  >
                    <Text style={styles.preferenceText}>📱 SMS Status Progression Alerts</Text>
                    <Text style={styles.toggleState}>{profile.smsNotifications ? 'ON' : 'OFF'}</Text>
                  </Pressable>

                  <Pressable
                    style={styles.preferenceRow}
                    onPress={() => setProfile(p => ({ ...p, emailNotifications: !p.emailNotifications }))}
                  >
                    <Text style={styles.preferenceText}>📧 Official Email Dispatches</Text>
                    <Text style={styles.toggleState}>{profile.emailNotifications ? 'ON' : 'OFF'}</Text>
                  </Pressable>

                  <Pressable
                    style={styles.preferenceRow}
                    onPress={() => setProfile(p => ({ ...p, expiryReminders: !p.expiryReminders }))}
                  >
                    <Text style={styles.preferenceText}>⏰ Lease Expiry (90-Day / 60-Day) Reminders</Text>
                    <Text style={styles.toggleState}>{profile.expiryReminders ? 'ON' : 'OFF'}</Text>
                  </Pressable>
                </View>

                {/* Language Selection */}
                <Text style={styles.sectionHeading}>Language / Mutauro / Ulimi</Text>
                <View style={styles.card}>
                  <View style={styles.languageRow}>
                    {(['English (ZW)', 'ChiShona', 'isiNdebele'] as const).map(lang => (
                      <Pressable
                        key={lang}
                        style={[styles.languageBtn, settingsLanguage === lang && styles.languageBtnActive]}
                        onPress={() => setSettingsLanguage(lang)}
                      >
                        <Text style={[styles.languageBtnText, settingsLanguage === lang && styles.languageBtnTextActive]}>
                          {lang}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Security & System Preferences */}
                <Text style={styles.sectionHeading}>Security &amp; Device Preferences</Text>
                <View style={styles.card}>
                  <Pressable
                    style={styles.preferenceRow}
                    onPress={() => setSettingsBioAuth(b => !b)}
                  >
                    <Text style={styles.preferenceText}>🔐 Biometric / Face ID Unlock</Text>
                    <Text style={styles.toggleState}>{settingsBioAuth ? 'ON' : 'OFF'}</Text>
                  </Pressable>

                  <Pressable
                    style={styles.preferenceRow}
                    onPress={() => setSettingsOfflineCache(c => !c)}
                  >
                    <Text style={styles.preferenceText}>🗺️ Offline Cadastre Map Caching</Text>
                    <Text style={styles.toggleState}>{settingsOfflineCache ? 'ENABLED' : 'DISABLED'}</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={[styles.primaryButton, { marginTop: 10 }]}
                  onPress={() => setIsLoading(true)}
                >
                  <Text style={styles.primaryButtonText}>▶ Replay SLLAS Motion Logo</Text>
                </Pressable>

                <Pressable
                  style={[styles.secondaryButton, { marginTop: 10 }]}
                  onPress={handleLogout}
                >
                  <Text style={[styles.secondaryButtonText, { color: '#f87171' }]}>Sign Out of SLLAS</Text>
                </Pressable>
              </>
            )}

            {/* SUB-VIEW 4: NEWS FEED */}
            {menuView === 'news' && (
              <>
                <Pressable onPress={() => setMenuView('hub')} style={styles.backButton}>
                  <Text style={styles.backButtonText}>← Back to Menu</Text>
                </Pressable>
                <Text style={styles.pageTitle}>News Feed &amp; Gazette</Text>
                <Text style={styles.cardSub}>
                  Live land administration reporting, policy announcements, and agricultural bulletins syndicated from The Herald and Ministry of Lands.
                </Text>

                {/* 10-Second Auto-Update Wire Banner */}
                <View style={styles.newsLiveBanner}>
                  <View style={styles.newsLiveLeft}>
                    <View style={styles.newsLivePulse} />
                    <Text style={styles.newsLiveTitle}>LIVE WIRE</Text>
                    <View style={styles.newsLiveBadge}>
                      <Text style={styles.newsLiveBadgeText}>10s AUTO</Text>
                    </View>
                  </View>

                  <View style={styles.newsTrackWrap}>
                    <View style={styles.newsTrack}>
                      <View
                        style={[
                          styles.newsTrackFill,
                          {
                            width: `${Math.max(0, Math.min(100, ((10 - newsCountdown) / 10) * 100))}%`,
                            backgroundColor: isNewsPaused ? '#94a3b8' : '#22c55e',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.newsTimerText}>
                      {isNewsPaused ? 'Paused' : `${newsCountdown}s`}
                    </Text>
                    <Pressable
                      style={styles.newsPauseBtn}
                      onPress={() => setIsNewsPaused(p => !p)}
                    >
                      <Text style={styles.newsPauseText}>{isNewsPaused ? '▶' : '⏸'}</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Category Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.newsCategoryRow}>
                  {['ALL', 'CROPS', 'FINANCE', 'LIVESTOCK', 'TENURE'].map(cat => (
                    <Pressable
                      key={cat}
                      style={[styles.newsCategoryChip, newsCategory === cat && styles.newsCategoryChipActive]}
                      onPress={() => setNewsCategory(cat)}
                    >
                      <Text style={[styles.newsCategoryText, newsCategory === cat && styles.newsCategoryTextActive]}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {/* News Article Cards (4-6 max on screen) */}
                {filteredNews.slice(0, 6).map(item => (
                  <Pressable
                    key={item.id}
                    style={styles.newsArticleCard}
                    onPress={() => setSelectedNewsArticle(item)}
                  >
                    <Image
                      source={NEWS_IMAGES[item.imageKey]}
                      style={styles.newsArticleImage}
                      resizeMode="cover"
                    />
                    <View style={styles.newsArticleContent}>
                      <View style={styles.newsArticleHeaderRow}>
                        <Text style={styles.newsArticleTag}>{item.category}</Text>
                        <Text style={styles.newsArticleSource}>{item.source}</Text>
                      </View>
                      <Text style={styles.newsArticleTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.newsArticleSummary} numberOfLines={2}>
                        {item.summary}
                      </Text>
                      <View style={styles.newsArticleFooter}>
                        <Text style={styles.newsArticleDate}>{item.date} • {item.readTime}</Text>
                        <Text style={styles.newsReadMore}>Read Gazette →</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* 4. PARCEL DETAIL SCREEN MODAL (Section 4.3.2 Item 4) */}
      {selectedParcel && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedParcel(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.refText}>{selectedParcel.referenceNumber}</Text>
                  <Text style={styles.modalTitle}>{selectedParcel.name}</Text>
                </View>
                <Pressable onPress={() => setSelectedParcel(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 360 }}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Province &amp; District</Text>
                  <Text style={styles.metaVal}>{selectedParcel.district}, {selectedParcel.province}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Cadastral Area</Text>
                  <Text style={styles.metaVal}>{selectedParcel.hectares} hectares</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Agro-Ecological Region</Text>
                  <Text style={styles.metaVal}>{selectedParcel.naturalRegion}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Soil Type</Text>
                  <Text style={styles.metaVal}>{selectedParcel.soilType}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Water Access</Text>
                  <Text style={styles.metaVal}>{selectedParcel.waterAccess ? 'Available (Dam/River)' : 'None'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Road Infrastructure</Text>
                  <Text style={styles.metaVal}>{selectedParcel.roadAccess}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Availability Status</Text>
                  <Text style={[styles.metaVal, { color: '#4ade80' }]}>{selectedParcel.availability}</Text>
                </View>
              </ScrollView>

              {/* Action: Apply for Lease (Item 4) */}
              {selectedParcel.availability === 'Available' ? (
                <Pressable
                  style={[styles.primaryButton, { marginTop: 14 }]}
                  onPress={() => {
                    setIsApplyModalVisible(true);
                  }}
                >
                  <Text style={styles.primaryButtonText}>🌱 Apply for 99-Year Lease</Text>
                </Pressable>
              ) : (
                <View style={[styles.card, { marginTop: 12 }]}>
                  <Text style={styles.cardSub}>This parcel is currently {selectedParcel.availability.toLowerCase()}.</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* 5. LEASE APPLICATION FORM MODAL (Section 4.3.2 Item 5) */}
      {isApplyModalVisible && selectedParcel && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setIsApplyModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.heraldryText}>AGRICULTURAL LAND SETTLEMENT ACT</Text>
                  <Text style={styles.modalTitle}>Lease Application Form</Text>
                </View>
                <Pressable onPress={() => setIsApplyModalVisible(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 420 }}>
                {/* Pre-filled Applicant Profile */}
                <Text style={styles.filterLabel}>Applicant Details (Pre-filled from Profile)</Text>
                <View style={styles.prefillBox}>
                  <Text style={styles.prefillItem}><Text style={{ fontWeight: 'bold' }}>Applicant:</Text> {profile.name}</Text>
                  <Text style={styles.prefillItem}><Text style={{ fontWeight: 'bold' }}>National ID:</Text> {profile.nationalId}</Text>
                  <Text style={styles.prefillItem}><Text style={{ fontWeight: 'bold' }}>Contact:</Text> {profile.phone}</Text>
                  <Text style={styles.prefillItem}><Text style={{ fontWeight: 'bold' }}>Target Parcel:</Text> {selectedParcel.referenceNumber} ({selectedParcel.hectares} ha)</Text>
                </View>

                {/* Intended Agricultural Activity */}
                <Text style={styles.inputLabel}>Intended Activity / Enterprise</Text>
                <TextInput
                  style={styles.textInput}
                  value={applyIntendedActivity}
                  onChangeText={setApplyIntendedActivity}
                />

                {/* Proposed Investment */}
                <Text style={styles.inputLabel}>Proposed Capital Investment (USD)</Text>
                <TextInput
                  style={styles.textInput}
                  value={applyInvestmentUsd}
                  onChangeText={setApplyInvestmentUsd}
                  keyboardType="numeric"
                />

                {/* Supporting Information / Business Plan Summary */}
                <Text style={styles.inputLabel}>Business Plan &amp; Supporting Information</Text>
                <TextInput
                  style={[styles.textInput, { height: 70 }]}
                  multiline
                  value={applySupportingInfo}
                  onChangeText={setApplySupportingInfo}
                />

                {/* Document Upload */}
                <Text style={styles.inputLabel}>Supporting Documents (Upload)</Text>
                <Pressable
                  style={styles.uploadBtn}
                  onPress={() => {
                    Alert.alert('Document Attached', 'Agricultural_Business_Plan_2026.pdf attached from mobile storage.');
                    setUploadedDocument('Agricultural_Business_Plan_2026.pdf');
                  }}
                >
                  <Text style={styles.uploadBtnText}>
                    📁 {uploadedDocument ? `Attached: ${uploadedDocument}` : 'Tap to attach PDF / ID'}
                  </Text>
                </Pressable>
              </ScrollView>

              <Pressable
                style={[styles.primaryButton, { marginTop: 12 }]}
                onPress={handleSubmitLeaseApplication}
              >
                <Text style={styles.primaryButtonText}>Submit Formal Application</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* 5. NEWS ARTICLE GAZETTE READER MODAL */}
      {selectedNewsArticle && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedNewsArticle(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.newsArticleTag}>{selectedNewsArticle.category}</Text>
                  <Text style={styles.modalTitle} numberOfLines={2}>{selectedNewsArticle.title}</Text>
                </View>
                <Pressable onPress={() => setSelectedNewsArticle(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 380 }}>
                <Image
                  source={NEWS_IMAGES[selectedNewsArticle.imageKey]}
                  style={{ width: '100%', height: 160, borderRadius: 10, marginBottom: 12 }}
                  resizeMode="cover"
                />
                <Text style={styles.cardEyebrow}>{selectedNewsArticle.source} • {selectedNewsArticle.date}</Text>
                <Text style={[styles.cardSub, { fontSize: 13, lineHeight: 18, color: '#e2e8f0', marginTop: 8 }]}>
                  {selectedNewsArticle.summary}
                </Text>
                <Text style={[styles.sectionHeading, { marginTop: 12, marginBottom: 6 }]}>Key Policy Points</Text>
                {selectedNewsArticle.bulletPoints.map((bp, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                    <Text style={{ color: '#4ade80', fontSize: 12 }}>•</Text>
                    <Text style={[styles.cardSub, { flex: 1, fontSize: 11 }]}>{bp}</Text>
                  </View>
                ))}
                <Text style={[styles.sectionHeading, { marginTop: 12, marginBottom: 6 }]}>Official Gazette Text</Text>
                <Text style={[styles.cardSub, { fontSize: 11, fontStyle: 'italic', color: '#cbd5e1', lineHeight: 17 }]}>
                  "{selectedNewsArticle.fullGazetteText}"
                </Text>
              </ScrollView>

              <Pressable
                style={[styles.primaryButton, { marginTop: 12 }]}
                onPress={() => setSelectedNewsArticle(null)}
              >
                <Text style={styles.primaryButtonText}>Close Gazette Bulletin</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Touch-Friendly Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {[
          { key: 'home', label: 'Home', icon: '🏠' },
          { key: 'search', label: 'Land Search', icon: '🔍' },
          { key: 'applications', label: 'My Leases', icon: '📜' },
          { key: 'map', label: 'Map View', icon: '🗺️' },
          { key: 'menu', label: 'Menu', icon: '☰' },
        ].map(t => (
          <Pressable
            key={t.key}
            style={[styles.tabBarItem, activeTab === t.key && styles.tabBarItemActive]}
            onPress={() => {
              if (t.key === 'menu') {
                setMenuView('hub');
              }
              setActiveTab(t.key as MobileTabKey);
            }}
          >
            <Text style={styles.tabBarIcon}>{t.icon}</Text>
            <Text style={[styles.tabBarLabel, activeTab === t.key && styles.tabBarLabelActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#0a0f1d',
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#060913',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heraldryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#22c55e',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  authHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  authSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 20,
    lineHeight: 16,
  },
  authButtonGroup: {
    gap: 12,
  },
  formStack: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginTop: 6,
  },
  textInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#ffffff',
  },
  primaryButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#e2e8f0',
    fontWeight: '600',
    fontSize: 14,
  },
  textLink: {
    alignItems: 'center',
    marginTop: 12,
  },
  textLinkText: {
    color: '#4ade80',
    fontSize: 12,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: Platform.select({
      android: (StatusBar.currentHeight || 24) + 14,
      web: 22,
      ios: 12,
      default: 18,
    }),
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0a0f1d',
  },
  topHeaderTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  notifBadgeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notifIcon: {
    fontSize: 19,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#0a0f1d',
    position: 'absolute',
    top: 7,
    right: 7,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 18,
    paddingBottom: 88,
  },
  tabContent: {
    gap: 12,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
  },
  unreadCard: {
    borderColor: 'rgba(59, 130, 246, 0.4)',
    backgroundColor: 'rgba(30, 58, 138, 0.2)',
  },
  detailCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4ade80',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  cardSub: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  refText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4ade80',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  shortcutBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  shortcutIcon: {
    fontSize: 16,
  },
  shortcutText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  linkText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '600',
  },
  timestampText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  searchInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 10,
    color: '#ffffff',
    fontSize: 13,
    marginTop: 6,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 10,
    marginBottom: 4,
  },
  chipScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipActive: {
    backgroundColor: '#166534',
    borderColor: '#4ade80',
  },
  chipText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  viewDetailsText: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: '600',
    marginTop: 6,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginTop: 6,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleDone: {
    backgroundColor: '#16a34a',
  },
  stepNum: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
  },
  stepLabelDone: {
    color: '#4ade80',
    fontWeight: '700',
  },
  remarksBox: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  remarksHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#facc15',
    marginBottom: 2,
  },
  remarksText: {
    fontSize: 11,
    color: '#fef08a',
    lineHeight: 15,
  },
  historyRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  historyDot: {
    color: '#4ade80',
    fontSize: 14,
  },
  historyDate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  historyNote: {
    fontSize: 10,
    color: '#94a3b8',
  },
  badgeTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  preferenceText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  toggleState: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4ade80',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeBtn: {
    fontSize: 18,
    color: '#94a3b8',
    padding: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  metaLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  prefillBox: {
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  prefillItem: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  uploadBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  uploadBtnText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#070b14',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabBarItemActive: {
    transform: [{ scale: 1.05 }],
  },
  tabBarIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  tabBarLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
  },
  tabBarLabelActive: {
    color: '#4ade80',
    fontWeight: '700',
  },
  // --- SLLAS Motion Splash Screen Styles ---
  splashContainer: {
    flex: 1,
    backgroundColor: '#030712',
  },
  splashSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  splashTopBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 8,
  },
  splashTopBadgeText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  splashCenterContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  splashHaloRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(74, 222, 128, 0.35)',
  },
  splashEmblemWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  splashRibbonWrap: {
    flexDirection: 'row',
    height: 4,
    width: 90,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 20,
  },
  splashRibbonBar: {
    flex: 1,
    height: '100%',
  },
  splashTitleWrap: {
    alignItems: 'center',
    marginTop: 14,
  },
  splashTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 6,
  },
  splashBadgePill: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.25)',
    marginTop: 6,
  },
  splashBadgePillText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  splashSubtitleWrap: {
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 24,
  },
  splashMinistryText: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  splashActText: {
    color: '#64748b',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  splashBottomBar: {
    width: '100%',
    paddingHorizontal: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  splashStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  splashPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ade80',
    marginRight: 8,
  },
  splashStatusText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  splashProgressTrack: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  splashProgressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 3,
  },
  splashSkipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  splashSkipText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  // --- Cadastre GIS Map View Styles ---
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  mapGpsPill: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  mapGpsText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mapFilterScroll: {
    marginBottom: 10,
  },
  mapFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  mapFilterChipActive: {
    backgroundColor: '#166534',
    borderColor: '#4ade80',
  },
  mapFilterChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  mapFilterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  mapLayerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  layerToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  layerToggleBtnActive: {
    backgroundColor: '#064e3b',
    borderColor: '#22c55e',
  },
  layerToggleText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  layerToggleTextActive: {
    color: '#86efac',
    fontWeight: '700',
  },
  mapCanvasCard: {
    backgroundColor: '#030712',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  mapHudBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  mapHudItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapHudLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  mapHudVal: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  mapLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapHudRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gridToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  gridToggleBtnActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.22)',
    borderColor: '#4ade80',
  },
  gridToggleText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
  },
  gridToggleTextActive: {
    color: '#4ade80',
  },
  mapBottomHudBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  mapBottomHudText: {
    color: '#64748b',
    fontSize: 8.5,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  mapSatelliteTelemetryBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  mapSatelliteTelemetryText: {
    color: '#38bdf8',
    fontSize: 8.5,
    fontWeight: '700',
  },
  agroLegendCard: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  agroLegendTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  agroLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  agroLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  agroLegendText: {
    fontSize: 10,
    color: '#cbd5e1',
    flex: 1,
  },
  legendDotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '500',
  },
  svgWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapInspectorCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.35)',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  mapSpecBadge: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  mapSpecLabel: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mapSpecVal: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  mapActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  mapCarouselCard: {
    width: 220,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mapCarouselCardActive: {
    borderColor: '#4ade80',
    backgroundColor: '#062d1f',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '700',
  },
  // --- Menu Hub Styles ---
  menuUserHeroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  menuUserHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#166534',
    borderWidth: 2,
    borderColor: '#4ade80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  menuUserName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  menuUserId: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  menuCitizenBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  menuCitizenBadgeText: {
    color: '#4ade80',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  menuCardGrid: {
    gap: 10,
    marginTop: 6,
  },
  menuActionCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconGlyph: {
    fontSize: 20,
  },
  menuCardContent: {
    flex: 1,
  },
  menuCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  menuCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  menuCardBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  menuCardDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 15,
  },
  menuArrowGlyph: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700',
  },
  menuStatsStrip: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  menuStatTile: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  menuStatVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f8fafc',
  },
  menuStatLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  menuFooterBox: {
    marginTop: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  menuFooterTitle: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  menuFooterSub: {
    color: '#475569',
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  languageRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 6,
  },
  languageBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  languageBtnActive: {
    backgroundColor: '#166534',
    borderColor: '#4ade80',
  },
  languageBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  languageBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  newsLiveBanner: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  newsLiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newsLivePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  newsLiveTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  newsLiveBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newsLiveBadgeText: {
    color: '#4ade80',
    fontSize: 9,
    fontWeight: '700',
  },
  newsTrackWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newsTrack: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  newsTrackFill: {
    height: '100%',
    backgroundColor: '#22c55e',
  },
  newsTimerText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  newsPauseBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  newsPauseText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '600',
  },
  newsCategoryRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  newsCategoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 8,
  },
  newsCategoryChipActive: {
    backgroundColor: '#166534',
    borderColor: '#4ade80',
  },
  newsCategoryText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  newsCategoryTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  newsArticleCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  newsArticleImage: {
    width: '100%',
    height: 145,
  },
  newsArticleContent: {
    padding: 12,
    gap: 6,
  },
  newsArticleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsArticleTag: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    color: '#4ade80',
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  newsArticleSource: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '500',
  },
  newsArticleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 19,
  },
  newsArticleSummary: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  newsArticleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
    marginTop: 2,
  },
  newsArticleDate: {
    color: '#64748b',
    fontSize: 10,
  },
  newsReadMore: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
});
