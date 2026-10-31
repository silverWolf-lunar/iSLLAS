'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Logo } from './components/Logo';
import { useTheme } from 'next-themes';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { Role } from '@sllas/contracts';
import { getDefaultDashboardForRole, ROLE_CONFIG } from './lib/access';
import { ZimbabweFlag } from './components/ZimbabweFlag';

interface LandNewsArticle {
  id: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  title: string;
  date: string;
  readTime: string;
  source: string;
  sourceDomain: string;
  sourceUrl: string;
  imageUrl: string;
  gazetteRef: string;
  summary: string;
  bulletPoints: string[];
  fullGazetteText: string;
  category?: 'CROPS' | 'TENURE' | 'CADASTRE' | 'LIVESTOCK' | 'FINANCE' | string;
  isLiveWire?: boolean;
}

interface NewsTickerItem {
  id: string;
  source: string;
  headline: string;
  url: string;
  pubDate: string;
}

const LAND_NEWS_ARTICLES: LandNewsArticle[] = [
  {
    id: 'winter-wheat-herald-production',
    badge: 'The Herald • Crop Production',
    badgeBg: 'rgba(217, 119, 6, 0.14)',
    badgeColor: '#d97706',
    badgeBorder: 'rgba(217, 119, 6, 0.35)',
    title: 'National Winter Wheat Production: All Systems Go Across Irrigated Commercial Farmlands',
    date: 'The Herald Agriculture Desk • Special Bulletin',
    readTime: '4 min read',
    source: 'The Herald Agriculture Desk',
    sourceDomain: 'heraldonline.co.zw',
    sourceUrl: 'https://www.heraldonline.co.zw/winter-wheat-farming-all-systems-go/',
    imageUrl: '/images/news-farm-finance.jpg',
    gazetteRef: 'Ministry Crop Assessment Notice • National Food Security Target',
    summary: 'The Government and agricultural stakeholders have activated comprehensive support measures for winter wheat farming across all provincial farming blocks, ensuring full availability of irrigation water, seed, and fertiliser.',
    bulletPoints: [
      'Targeted 120,000 hectares under active centre-pivot and canal irrigation.',
      'GMB grain reception depots equipped with moisture meters and drying facilities.',
      'Fuel and electricity ring-fenced for continuous wheat irrigation cycles.',
    ],
    fullGazetteText: 'As reported by The Herald Agriculture Desk, Zimbabwe is poised to sustain national wheat self-sufficiency as winter wheat preparations enter peak execution. The Ministry of Lands, Agriculture, Fisheries, Water and Rural Development announced that seed houses, commercial banks, and the Grain Marketing Board (GMB) have finalised distribution of inputs to commercial A2 and smallholder irrigation schemes. With national dams brimming at above 85% capacity, water allocations have been secured to sustain uninterrupted irrigation throughout the winter cycle.',
    category: 'CROPS',
  },
  {
    id: 'joint-ventures-herald-2701',
    badge: 'The Herald • Joint Ventures',
    badgeBg: 'rgba(147, 51, 234, 0.14)',
    badgeColor: '#9333ea',
    badgeBorder: 'rgba(147, 51, 234, 0.35)',
    title: '2,701 Agricultural Joint Ventures Approved to Unlock Idle Farmland & Boost Production',
    date: 'The Herald Agriculture Desk • Joint Venture Registry',
    readTime: '3 min read',
    source: 'The Herald Online',
    sourceDomain: 'heraldonline.co.zw',
    sourceUrl: 'https://www.heraldonline.co.zw/2-701-farming-joint-ventures-get-the-nod/',
    imageUrl: '/images/news-tenure-reform.jpg',
    gazetteRef: 'Statutory Joint Venture Regulations • Land Settlement Directorate',
    summary: 'The Ministry has formally approved 2,701 agricultural joint venture partnerships, pairing A1 and A2 land beneficiaries with commercial agribusiness investors to scale up grain and horticulture output.',
    bulletPoints: [
      'Over 220,000 hectares brought into commercial production through vetted partnerships.',
      'Protects leaseholder tenure while injecting private capital, combine harvesters, and irrigation.',
      'Tripartite agreements legally witnessed and monitored by provincial land committees.',
    ],
    fullGazetteText: 'According to The Herald, more than 2,701 agricultural joint venture agreements have been ratified by the Ministry of Lands. The policy provides a secure legal vehicle for farmers lacking capital to partner with private agribusiness operators without forfeiting their land rights. Officials confirmed that approved joint ventures have already expanded national grain hectarage, created rural employment, and eliminated unproductive idle land across Mashonaland, Midlands, and Manicaland provinces.',
    category: 'FINANCE',
  },
  {
    id: 'tenure-reform-herald-2024',
    badge: 'The Herald • Farm Tenure',
    badgeBg: 'rgba(220, 38, 38, 0.14)',
    badgeColor: '#dc2626',
    badgeBorder: 'rgba(220, 38, 38, 0.35)',
    title: 'President Mnangagwa Announces Bankable, Registrable and Transferable Farm Tenure Overhaul',
    date: 'The Herald Online • Special Edition',
    readTime: '4 min read',
    source: 'The Herald Zimbabwe',
    sourceDomain: 'heraldonline.co.zw',
    sourceUrl: 'https://www.herald.co.zw/president-unveils-new-land-tenure-system/',
    imageUrl: '/images/news-tenure-reform.jpg',
    gazetteRef: 'Cabinet National Policy Directive • Land Reform Act',
    summary: 'In a landmark national address reported by The Herald, President Emmerson Mnangagwa announced a decisive overhaul of agricultural land administration, declaring that all beneficiaries of the Land Reform Programme will receive bankable, registrable, and transferable tenure documents.',
    bulletPoints: [
      'Replaces legacy offer letters with secure, bankable, and registrable title deeds.',
      'Empowers commercial banks to accept leases as collateral for farm mechanisation loans.',
      'Transferability strictly restricted among indigenous Zimbabweans to protect national sovereignty.',
    ],
    fullGazetteText: 'As reported by The Herald, President Emmerson Mnangagwa announced a decisive overhaul of Zimbabwe’s land tenure framework. The President emphasised that land held under older offer letters and permits remained "dead capital" that could not attract commercial bank financing or unlock long-term farm capital investments. Under the new policy, all verified beneficiaries of the Land Reform Programme who demonstrate agricultural productivity will transition to bankable, registrable, and assignable documents of tenure. The Ministry of Lands, together with the Reserve Bank of Zimbabwe and the Bankers Association of Zimbabwe, has finalised legal mechanisms ensuring that commercial banking institutions can legally register collateral liens over leasehold improvements, empowering farmers to secure financing for centre-pivot irrigation, tractors, and seasonal crop inputs.',
    category: 'TENURE',
  },
  {
    id: 'rangeland-rehabilitation-livestock',
    badge: 'The Herald • Livestock & Pastures',
    badgeBg: 'rgba(34, 197, 94, 0.14)',
    badgeColor: '#15803d',
    badgeBorder: 'rgba(34, 197, 94, 0.35)',
    title: 'Rangeland Management & Pasture Rehabilitation Expanded to Protect National Cattle Herds',
    date: 'The Herald Agriculture Desk • Livestock Notice',
    readTime: '3 min read',
    source: 'The Herald Agriculture Desk',
    sourceDomain: 'heraldonline.co.zw',
    sourceUrl: 'https://www.heraldonline.co.zw/reclaiming-degraded-rangelands-lessons-from-across-the-zambezi/',
    imageUrl: '/images/harvest-field.jpg',
    gazetteRef: 'Department of Livestock Development • Pasture Management Guideline',
    summary: 'To bolster the national beef and dairy herd, the Department of Livestock Development has rolled out restorative grazing models, paddock rotational fencing, and drought-tolerant fodder cultivation across southern and western provinces.',
    bulletPoints: [
      'Community fodder banks and drought-tolerant legume pastures established across Regions IV & V.',
      'Solar borehole drilling at livestock watering points to minimise trekking distances.',
      'Rotational grazing plans enforced to prevent soil erosion and pasture degradation.',
    ],
    fullGazetteText: 'The Herald reports that the Ministry of Lands, Agriculture, Fisheries, Water and Rural Development has scaled up rangeland reclamation and grazing management programmes. Livestock farming communities across Matabeleland, Masvingo, and Midlands are being capacitated with solar-powered boreholes, paddock rotational fences, and drought-hardy fodder crops (including velvet beans and bana grass) to insulate national cattle herds against erratic rainfall patterns and overgrazing.',
    category: 'LIVESTOCK',
  },
  {
    id: 'land-audit-chronicle-repossession',
    badge: 'The Chronicle • Cadastre Audit',
    badgeBg: 'rgba(22, 163, 74, 0.14)',
    badgeColor: '#16a34a',
    badgeBorder: 'rgba(22, 163, 74, 0.35)',
    title: 'National Farmland Audit: Repossession & Downsizing of Underutilised Farms for Waiting List Allocation',
    date: 'The Chronicle • ZLC Communiqué',
    readTime: '3 min read',
    source: 'The Chronicle',
    sourceDomain: 'chronicle.co.zw',
    sourceUrl: 'https://www.chronicle.co.zw/national-land-audit-underutilised-farms-downsized/',
    imageUrl: '/images/news-land-audit.jpg',
    gazetteRef: 'Land Commission Act • General Notice 389',
    summary: 'The Zimbabwe Land Commission and Ministry of Lands have intensified nationwide satellite audits and field inspections enforcing the One-Person-One-Farm policy, repossessing thousands of idle hectares for sequential distribution to waiting list applicants.',
    bulletPoints: [
      'Multispectral satellite imagery and ground GPS teams inspect farm utilisation across all provinces.',
      'Idle, abandoned, or speculative holdings downsized or repossessed under Land Commission Act provisions.',
      'Recovered arable hectarage automatically re-entered into SLLAS digital queue for verified applicant allocations.',
    ],
    fullGazetteText: 'According to reports published in The Chronicle, the Ministry of Lands, Agriculture, Fisheries, Water and Rural Development, in partnership with the Zimbabwe Land Commission (ZLC), is actively enforcing statutory productivity covenants across all agro-ecological zones. Authorities confirmed that agricultural state land is a strategic national asset and cannot be held for speculative or absentee ownership. Farms found to be chronically abandoned or held in excess of provincial size ceilings are systematically downsized or repossessed. The recovered hectares are ingested into the SLLAS digital cadastre to facilitate fair, sequential allocation to waiting list applicants, with affirmative action quotas prioritising qualifying young farmers and women agribusiness entrepreneurs.',
    category: 'CADASTRE',
  },
  {
    id: 'surveyor-general-lims-ecadastre',
    badge: 'The Herald • Spatial Tech',
    badgeBg: 'rgba(37, 99, 235, 0.14)',
    badgeColor: '#2563eb',
    badgeBorder: 'rgba(37, 99, 235, 0.35)',
    title: 'Surveyor-General Digitises Over 360,000 Agricultural Parcels Under Modernised e-Cadastre & LIMS',
    date: 'The Herald • Surveyor-General Bulletin',
    readTime: '3 min read',
    source: 'The Herald Online',
    sourceDomain: 'herald.co.zw',
    sourceUrl: 'https://www.herald.co.zw/surveyor-general-digitises-parcels-ecadastre/',
    imageUrl: '/images/news-digital-cadastre.jpg',
    gazetteRef: 'Statutory Instrument 76 of 2025 • LIMS Protocol',
    summary: 'The Department of the Surveyor-General and Ministry of Lands have deployed RTK survey drones and GIS mapping to digitise over 360,000 parcels into an integrated electronic cadastre, definitively eliminating historic boundary overlaps.',
    bulletPoints: [
      'RTK survey drone fleet delivers centimetre-grade boundary accuracy for all farm demarcations.',
      'Paper-based archives migrated to PostGIS-backed Land Information Management System (LIMS).',
      'Digital title documents feature cryptographic QR validation and automated spatial overlap prevention.',
    ],
    fullGazetteText: 'The Herald reports that the Department of the Surveyor-General and the Ministry of Lands have accelerated the nationwide rollout of the Digital Land Administration Platform (DLAP) and the Land Information Management System (LIMS). Mandated under Statutory Instrument 76, the project transitions more than 360,000 agricultural land parcels from fragile paper archives into an auditable spatial cadastre. Equipped with RTK-enabled GPS survey drones and localised base stations across all 60 administrative districts, cadastral teams complete field surveys and boundary verifications within 72 hours. Automated spatial intersection engines mathematically guarantee zero boundary overlaps, providing unambiguous legal clarity for 99-year lease schedules.',
    category: 'CADASTRE',
  },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedNews, setSelectedNews] = useState<LandNewsArticle | null>(null);

  // Real-time news state
  const [newsArticles, setNewsArticles] = useState<LandNewsArticle[]>(LAND_NEWS_ARTICLES);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [newsLastSynced, setNewsLastSynced] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'CROPS' | 'TENURE' | 'CADASTRE' | 'LIVESTOCK' | 'FINANCE'>('ALL');

  const fetchLiveNews = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshingNews(true);
    try {
      const res = await fetch('/api/news', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.articles && data.articles.length > 0) {
          setNewsArticles(data.articles);
        }
        setNewsLastSynced(new Date());
      }
    } catch (err) {
      console.warn('Real-time news fetch error, retaining existing feed:', err);
    } finally {
      if (isManual) {
        setTimeout(() => setIsRefreshingNews(false), 500);
      }
    }
  }, []);

  // Initial fetch, 20-second automatic real-time polling interval, and tab focus revalidation
  useEffect(() => {
    fetchLiveNews();
    const interval = setInterval(() => {
      fetchLiveNews();
    }, 20000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLiveNews();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchLiveNews]);

  const filteredNews = selectedCategory === 'ALL'
    ? newsArticles
    : newsArticles.filter((a) => (a.category || 'TENURE') === selectedCategory);

  const isLight = resolvedTheme === 'light';
  const userRole = (session?.user as any)?.role as Role | undefined;
  const userDashboard = userRole ? getDefaultDashboardForRole(userRole) : null;
  const roleName = userRole ? ROLE_CONFIG[userRole]?.displayName : '';

  const faqs = [
    {
      q: 'Who is eligible to apply for agricultural state land in Zimbabwe?',
      a: 'Any Zimbabwean citizen aged 18 and above with a valid National Identity Document (or passport) is eligible. Applicants must demonstrate agricultural competence (such as farming experience, Master Farmer Certificate, or agricultural diploma) and submit a viable 5-year Farm Development Plan.',
    },
    {
      q: 'What is the difference between A1 and A2 Resettlement Schemes?',
      a: 'The A1 scheme is a smallholder model (5 to 50 hectares) targeted at family-sized agricultural production and food security. The A2 scheme is a commercial model (50 to 500+ hectares depending on the natural agro-ecological region) requiring proof of capital, tax clearance, and a bankable business proposal.',
    },
    {
      q: 'How does SLLAS prevent duplicate or corrupt land allocations?',
      a: 'SLLAS uses PostGIS spatial geometry validation to automatically prevent overlapping boundaries and double allocations. Furthermore, strict statutory segregation of duties ensures that Registry Officers who inspect land cannot approve allocations, and Approvers cannot register parcels.',
    },
    {
      q: 'Is the 99-Year Lease recognized by commercial banks for financing?',
      a: 'Yes. Under the amended Agricultural Land Settlement Act and Reserve Bank directives, vetted 99-year leases issued through the SLLAS digital registry feature bankable legal clauses, allowing farmers to access agricultural working capital and equipment financing from participating financial institutions.',
    },
    {
      q: 'How long does the land application and allocation process take?',
      a: 'Once submitted online, district officers verify boundaries within 14 business days. The Provincial Land Board reviews applications during monthly sessions, followed by Ministerial endorsement and digital offer letter issuance within 30 to 45 days.',
    },
    {
      q: 'Can women and young farmers apply under affirmative action quotas?',
      a: 'Yes. In alignment with national agricultural policy and the Constitution, SLLAS reserves a minimum 20% quota for youth (aged 18–35) and a 30% quota for women farmers in all new provincial state land demarcations.',
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: isLight ? 'var(--bg-main, #f8fafc)' : '#060913',
      color: isLight ? 'var(--text-main, #0f172a)' : '#f8fafc',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflowX: 'hidden',
      transition: 'background-color 0.25s ease, color 0.25s ease',
    }}>
      {/* Top Government Ribbon */}
      <div style={{
        background: isLight ? 'linear-gradient(90deg, #15803d 0%, #166534 50%, #92400e 100%)' : 'linear-gradient(90deg, #166534 0%, #064e3b 50%, #854d0e 100%)',
        padding: '7px 20px',
        fontSize: '0.75rem',
        color: '#fef08a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        borderBottom: '1px solid rgba(254, 240, 138, 0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ZimbabweFlag width={20} height={13} />
          <strong style={{ letterSpacing: '0.04em' }}>REPUBLIC OF ZIMBABWE</strong>
          <span>•</span>
          <span>Ministry of Lands & Rural Development</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Agricultural Land Settlement Act (Cap 20:01)</span>
          <span>•</span>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>Vision 2030 Cadastre</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(6, 9, 19, 0.88)',
        borderBottom: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 28px',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Logo variant="full" theme={isLight ? 'light' : 'dark'} />
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a href="#process" style={{ color: isLight ? '#334155' : '#cbd5e1', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.15s' }}>
              Application Process
            </a>
            <a href="#cadastre-preview" style={{ color: isLight ? '#334155' : '#cbd5e1', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.15s' }}>
              Spatial Cadastre
            </a>
            <a href="#schemes" style={{ color: isLight ? '#334155' : '#cbd5e1', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.15s' }}>
              Land Schemes
            </a>
            <a href="#news" style={{ color: isLight ? '#334155' : '#cbd5e1', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.15s' }}>
              Land News
            </a>
            <a href="#eligibility" style={{ color: isLight ? '#334155' : '#cbd5e1', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.15s' }}>
              Eligibility Checklist
            </a>
            <a href="#faqs" style={{ color: isLight ? '#334155' : '#cbd5e1', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.15s' }}>
              FAQs
            </a>

            {/* Quick Theme Switcher Function */}
            <ThemeSwitcher />

            {/* Authentication Action */}
            {session?.user ? (
              <Link
                href={userDashboard || '/client'}
                className="btn btn-primary"
                style={{
                  padding: '9px 18px',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>Go to {roleName || 'Portal'}</span>
                <span>→</span>
              </Link>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link
                  href="/signin"
                  className="btn btn-primary"
                  style={{ padding: '9px 20px', fontSize: '0.875rem', fontWeight: 600 }}
                >
                  Sign In to SLLAS
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Authenticated Floating Quick Access Bar */}
      {session?.user && (
        <div style={{
          background: isLight ? 'rgba(236, 253, 245, 0.95)' : 'rgba(6, 30, 20, 0.88)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(34, 197, 94, 0.3)',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          fontSize: '0.875rem',
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: isLight ? '#065f46' : '#a7f3d0',
            fontWeight: 500,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
            Active Session: <strong>{(session.user as any)?.name || session.user.email}</strong>
            <span style={{
              background: 'rgba(34, 197, 94, 0.2)',
              color: isLight ? '#047857' : '#4ade80',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}>{roleName}</span>
          </span>
          <Link
            href={userDashboard || '/client'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              padding: '5px 16px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.8125rem',
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            Launch Assigned Dashboard Console →
          </Link>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION WITH RICH ZIMBABWE FARMLAND BACKGROUND       */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        minHeight: '740px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px 80px',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        {/* Background Image Layer - High Visibility */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/images/hero-farmland.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 38%',
          filter: isLight ? 'brightness(1.06) contrast(1.08) saturate(1.18)' : 'brightness(0.96) contrast(1.12) saturate(1.22)',
          transform: 'scale(1.02)',
        }} />

        {/* Ambient Overlays for Readability while Keeping Landscape Visible */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: isLight
            ? 'linear-gradient(180deg, rgba(6, 9, 19, 0.28) 0%, rgba(6, 9, 19, 0.44) 55%, rgba(248, 250, 252, 0.95) 90%, #f8fafc 100%)'
            : 'linear-gradient(180deg, rgba(6, 9, 19, 0.32) 0%, rgba(6, 9, 19, 0.48) 55%, #060913 100%)',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 30%, rgba(34, 197, 94, 0.16) 0%, transparent 75%)',
        }} />

        {/* Hero Foreground Content */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1360px',
          margin: '0 auto',
          width: '100%',
        }}>
          {/* Twin Frosted Glass Command Grid Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '36px',
            alignItems: 'stretch',
          }}>
            {/* Left Column: Statutory Identity & Main Heading Card */}
            <div style={{
              background: isLight ? 'rgba(255, 255, 255, 0.90)' : 'rgba(8, 14, 26, 0.80)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              padding: '38px 34px',
              borderRadius: '24px',
              border: isLight ? '1px solid rgba(255, 255, 255, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow: isLight
                ? '0 20px 45px -10px rgba(15, 23, 42, 0.12)'
                : '0 24px 50px -12px rgba(0, 0, 0, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div>
                <h1 style={{
                  fontSize: 'clamp(2.1rem, 3.8vw, 3.3rem)',
                  fontWeight: 850,
                  lineHeight: 1.14,
                  color: isLight ? '#064e3b' : '#ffffff',
                  letterSpacing: '-0.03em',
                  margin: '0 0 22px',
                }}>
                  Fair, Transparent &amp; Digital <br />
                  <span style={{
                    display: 'inline-block',
                    background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #facc15 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 2px 12px rgba(34, 197, 94, 0.4))',
                  }}>
                    Agricultural Land Allocation
                  </span>
                </h1>
              </div>

              {/* Pillars / Trust Badges */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                marginTop: '16px',
              }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: isLight ? '#334155' : '#e2e8f0',
                  background: isLight ? 'rgba(241, 245, 249, 0.9)' : 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(10px)',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.14)',
                }}>
                  <svg width="14" height="14" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  PostGIS Geovalidation
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: isLight ? '#334155' : '#e2e8f0',
                  background: isLight ? 'rgba(241, 245, 249, 0.9)' : 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(10px)',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.14)',
                }}>
                  <svg width="14" height="14" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Bankable 99-Year Leases
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: isLight ? '#334155' : '#e2e8f0',
                  background: isLight ? 'rgba(241, 245, 249, 0.9)' : 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(10px)',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.14)',
                }}>
                  <svg width="14" height="14" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Segregation of Duties
                </span>
              </div>
            </div>

            {/* Right Column: Subheading & Action Buttons in a Matching Glass Card */}
            <div style={{
              background: isLight ? 'rgba(255, 255, 255, 0.90)' : 'rgba(8, 14, 26, 0.80)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              padding: '38px 34px',
              borderRadius: '24px',
              border: isLight ? '1px solid rgba(255, 255, 255, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow: isLight
                ? '0 20px 45px -10px rgba(15, 23, 42, 0.12)'
                : '0 24px 50px -12px rgba(0, 0, 0, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div>
                <p style={{
                  fontSize: 'clamp(1.05rem, 1.6vw, 1.2rem)',
                  color: isLight ? '#334155' : '#e2e8f0',
                  margin: '0 0 28px',
                  lineHeight: 1.68,
                  fontWeight: 450,
                }}>
                  Apply for verified state farmland, track land board evaluations in real time, and obtain bankable 99-year leases secured by GIS spatial mapping across Zimbabwe's 10 administrative provinces.
                </p>

                {/* Hero Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '14px',
                  flexWrap: 'wrap',
                  marginBottom: '26px',
                }}>
                  <Link
                    href="/signin"
                    className="btn btn-primary"
                    style={{
                      padding: '16px 28px',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 8px 24px rgba(22, 163, 74, 0.45)',
                      flex: '1 1 200px',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    <span>Start Land Application</span>
                  </Link>

                  <a
                    href="#process"
                    className="btn btn-outline"
                    style={{
                      padding: '16px 24px',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: isLight ? 'rgba(241, 245, 249, 0.85)' : 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(10px)',
                      borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.22)',
                      color: isLight ? '#0f172a' : '#ffffff',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    <span>6-Step Guide</span>
                  </a>
                </div>
              </div>

              {/* Intake Status Notice */}
              <div style={{
                padding: '14px 18px',
                borderRadius: '12px',
                background: isLight ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.14)',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.8125rem',
                color: isLight ? '#15803d' : '#e2e8f0',
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(34, 197, 94, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#22c55e',
                }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
                    <strong style={{ color: isLight ? '#166534' : '#4ade80' }}>Open Intake Cycle Active:</strong>
                  </div>
                  <div>Allocation rounds currently open for A1 Smallholder and A2 Commercial farmland across all 10 provinces.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. SPATIAL CADASTRE & GIS INTELLIGENCE SHOWCASE               */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="cadastre-preview" style={{
        maxWidth: '1360px',
        margin: '80px auto',
        padding: '0 24px',
      }}>
        <div className="glass-panel" style={{
          padding: '48px 36px',
          borderRadius: '24px',
          background: isLight
            ? 'linear-gradient(135deg, #ffffff 0%, rgba(220, 252, 231, 0.45) 100%)'
            : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(6, 78, 59, 0.25) 100%)',
          border: isLight ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(34, 197, 94, 0.25)',
          boxShadow: isLight ? '0 12px 36px rgba(15, 23, 42, 0.08)' : undefined,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '40px',
            alignItems: 'center',
          }}>
            {/* Left Content */}
            <div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff', lineHeight: 1.25, margin: '0 0 16px' }}>
                Next-Generation National Cadastre & Satellite Land Explorer
              </h2>
              <p style={{ color: isLight ? '#475569' : 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.65, marginBottom: '24px' }}>
                Every agricultural land parcel in Zimbabwe is surveyed with high-precision GPS coordinates, boundary polygon vectors, and environmental topography. Our automated spatial engine mathematically verifies that boundaries never overlap.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: isLight ? '#334155' : '#e2e8f0' }}>
                  <span style={{ color: isLight ? '#16a34a' : 'var(--primary-400)', fontSize: '1.1rem' }}>✓</span>
                  <span><strong>Zero Overlaps:</strong> Automated PostGIS intersection tests prevent double leasing.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: isLight ? '#334155' : '#e2e8f0' }}>
                  <span style={{ color: isLight ? '#16a34a' : 'var(--primary-400)', fontSize: '1.1rem' }}>✓</span>
                  <span><strong>Agro-Ecological Classification:</strong> Filter regions I to V for soil fertility and rainfall.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: isLight ? '#334155' : '#e2e8f0' }}>
                  <span style={{ color: isLight ? '#16a34a' : 'var(--primary-400)', fontSize: '1.1rem' }}>✓</span>
                  <span><strong>Direct Farmer Selection:</strong> Click any available parcel on the map to apply directly.</span>
                </div>
              </div>

              <Link
                href="/parcels?status=AVAILABLE&view=map"
                className="btn btn-primary"
                style={{
                  padding: '14px 28px',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>Launch Interactive Cadastre Map</span>
                <span>→</span>
              </Link>
            </div>

            {/* Right Visual Image Showcase (Satellite Cadastre) */}
            <div style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 24px 50px -10px rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              background: '#090e1a',
            }}>
              {/* Cadastre Satellite Image */}
              <img
                src="/images/cadastre-gis.jpg"
                alt="SLLAS Satellite Land Cadastre GIS System"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  filter: 'contrast(1.05) brightness(0.95)',
                  transition: 'transform 0.4s ease',
                }}
              />

              {/* Live Overlay HUD Card */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(6, 9, 19, 0.85)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: '#ffffff',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                <span>CADASTRE ENGINE • POSTGIS SRID 4326</span>
              </div>

              {/* Bottom Floating Parcel Detail Chip */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                padding: '10px 16px',
                borderRadius: '8px',
                background: 'rgba(6, 9, 19, 0.9)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#ffffff',
                fontSize: '0.8125rem',
              }}>
                <div style={{ color: 'var(--accent-400)', fontWeight: 700, fontSize: '0.75rem' }}>PARCEL REFERENCE</div>
                <div style={{ fontWeight: 600 }}>ZIM-CAD-0311 • 12.4 Hectares</div>
                <div style={{ fontSize: '0.7rem', color: '#22c55e', marginTop: '2px' }}>✓ AVAILABLE FOR LEASE</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. 6-STEP LAND APPLICATION & ALLOCATION WORKFLOW             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="process" style={{
        maxWidth: '1360px',
        margin: '90px auto',
        padding: '0 24px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff', margin: '0 0 12px' }}>
            How to Apply for Agricultural Land in Zimbabwe
          </h2>
          <p style={{ color: isLight ? '#475569' : 'var(--text-muted)', maxWidth: '720px', margin: '0 auto', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            From identifying an idle parcel on the spatial cadastre to receiving an authenticated 99-Year Lease agreement, follow the six statutory milestones.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px',
        }}>
          {/* Step 1 */}
          <div className="glass-panel" style={{
            padding: '32px 28px',
            borderRadius: '16px',
            position: 'relative',
            background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: isLight ? '0 4px 20px rgba(0, 0, 0, 0.05)' : undefined,
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: isLight ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.2)',
              color: isLight ? '#15803d' : 'var(--primary-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem',
              marginBottom: '18px',
              border: '1px solid rgba(34, 197, 94, 0.4)',
            }}>
              1
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', marginBottom: '10px' }}>
              Spatial Cadastre Search
            </h3>
            <p style={{ color: isLight ? '#475569' : 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>
              Open the interactive cadastre map. Filter parcels by <strong>Natural Agro-Ecological Region (I to V)</strong>, available hectares, water rights (dams/boreholes), and soil classification. Select any parcel marked as <em>AVAILABLE</em>.
            </p>
            <div style={{ marginTop: '18px' }}>
              <Link href="/parcels?status=AVAILABLE&view=map" style={{ color: isLight ? '#15803d' : 'var(--primary-400)', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}>
                Open Spatial Map →
              </Link>
            </div>
          </div>

          {/* Step 2 */}
          <div className="glass-panel" style={{
            padding: '32px 28px',
            borderRadius: '16px',
            position: 'relative',
            background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: isLight ? '0 4px 20px rgba(0, 0, 0, 0.05)' : undefined,
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: isLight ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.2)',
              color: isLight ? '#2563eb' : '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem',
              marginBottom: '18px',
              border: '1px solid rgba(59, 130, 246, 0.4)',
            }}>
              2
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', marginBottom: '10px' }}>
              Digital Application & Business Plan
            </h3>
            <p style={{ color: isLight ? '#475569' : 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>
              Submit your formal application through the Citizen Portal. Specify your farming activity (Tobacco, Grain, Horticulture, Dairy, Cattle), declare projected capital investments, and attach your 5-Year Farm Development Plan and National ID.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-panel" style={{
            padding: '32px 28px',
            borderRadius: '16px',
            position: 'relative',
            background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: isLight ? '0 4px 20px rgba(0, 0, 0, 0.05)' : undefined,
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: isLight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.2)',
              color: isLight ? '#d97706' : 'var(--accent-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem',
              marginBottom: '18px',
              border: '1px solid rgba(245, 158, 11, 0.4)',
            }}>
              3
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', marginBottom: '10px' }}>
              District Physical Inspection & Verification
            </h3>
            <p style={{ color: isLight ? '#475569' : 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>
              The District Land Registry Officer inspects the target boundaries on the ground, conducts environmental assessment (EMA guidelines), verifies applicant identity, and ensures the parcel has zero tenure disputes.
            </p>
          </div>

          {/* Step 4 */}
          <div className="glass-panel" style={{
            padding: '32px 28px',
            borderRadius: '16px',
            position: 'relative',
            background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: isLight ? '0 4px 20px rgba(0, 0, 0, 0.05)' : undefined,
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: isLight ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.2)',
              color: isLight ? '#9333ea' : '#c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem',
              marginBottom: '18px',
              border: '1px solid rgba(168, 85, 247, 0.4)',
            }}>
              4
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', marginBottom: '10px' }}>
              Provincial Land Board Evaluation
            </h3>
            <p style={{ color: isLight ? '#475569' : 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>
              The Provincial Land Committee convenes to evaluate technical capability, agricultural productivity scores, and local economic impact. The board issues an affirmative recommendation to the national executive.
            </p>
          </div>

          {/* Step 5 */}
          <div className="glass-panel" style={{
            padding: '32px 28px',
            borderRadius: '16px',
            position: 'relative',
            background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: isLight ? '0 4px 20px rgba(0, 0, 0, 0.05)' : undefined,
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: isLight ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.2)',
              color: isLight ? '#dc2626' : '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem',
              marginBottom: '18px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
            }}>
              5
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', marginBottom: '10px' }}>
              Ministerial Approval & Offer Letter
            </h3>
            <p style={{ color: isLight ? '#475569' : 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>
              The National Approver / Minister executes the statutory allocation. An official, cryptographically verifiable <strong>Offer Letter</strong> with a secure QR code is automatically generated and delivered to your portal.
            </p>
          </div>

          {/* Step 6 */}
          <div className="glass-panel" style={{
            padding: '32px 28px',
            borderRadius: '16px',
            position: 'relative',
            background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)',
            border: isLight ? '1px solid rgba(34, 197, 94, 0.45)' : '1px solid rgba(34, 197, 94, 0.4)',
            boxShadow: isLight ? '0 4px 20px rgba(0, 0, 0, 0.05)' : undefined,
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: isLight ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.2)',
              color: isLight ? '#15803d' : 'var(--primary-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem',
              marginBottom: '18px',
              border: '1px solid rgba(34, 197, 94, 0.4)',
            }}>
              6
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', marginBottom: '10px' }}>
              Cadastral Survey & 99-Year Lease
            </h3>
            <p style={{ color: isLight ? '#475569' : 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>
              The Department of the Surveyor-General fixes official GPS corner beacons. The Estates Directorate issues the legal, notarized <strong>99-Year Lease Agreement</strong> with bankable financial tenure rights.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. RESETTLEMENT SCHEMES WITH GOLDEN HARVEST BACKGROUND       */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="schemes" style={{
        position: 'relative',
        padding: '90px 24px',
        margin: '60px 0',
        overflow: 'hidden',
        borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        {/* Harvest Background Image Layer - High Visibility */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/images/harvest-field.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: isLight ? 'brightness(0.92) contrast(1.08) saturate(1.15)' : 'brightness(0.72) contrast(1.12) saturate(1.2)',
        }} />

        {/* Ambient Overlays for Contrast while Keeping Harvest Field Visible */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: isLight
            ? 'linear-gradient(180deg, #f8fafc 0%, rgba(6, 9, 19, 0.40) 25%, rgba(6, 9, 19, 0.46) 75%, #ffffff 100%)'
            : 'linear-gradient(180deg, #060913 0%, rgba(6, 9, 19, 0.50) 50%, #060913 100%)',
        }} />

        {/* Content Container */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1360px',
          margin: '0 auto',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: '#ffffff', margin: '0 0 12px', textShadow: '0 2px 14px rgba(0,0,0,0.8)' }}>
              Zimbabwe Agricultural Resettlement Models
            </h2>
            <p style={{ color: '#e2e8f0', maxWidth: '720px', margin: '0 auto', fontSize: '0.9375rem', lineHeight: 1.6, textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>
              Choose the agricultural tenure model that matches your enterprise scale, capital availability, and farming experience.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '28px',
          }}>
            {/* A1 Smallholder */}
            <div className="glass-panel" style={{
              padding: '36px 28px',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(20px)',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: isLight ? '0 8px 24px rgba(0, 0, 0, 0.08)' : undefined,
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: isLight ? '#15803d' : 'var(--primary-400)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Model A1
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', margin: '8px 0 14px' }}>
                  Smallholder Family Farm
                </h3>
                <p style={{ color: isLight ? '#475569' : 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '22px' }}>
                  Designed for small-scale self-sufficiency, household food security, and surplus production of maize, grains, groundnuts, and horticulture.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem', color: isLight ? '#334155' : '#cbd5e1' }}>
                  <div><strong>Standard Area:</strong> 5 to 50 Hectares</div>
                  <div><strong>Target:</strong> Rural families, master farmers, agricultural graduates</div>
                  <div><strong>Tenure:</strong> Settlement Permit / 99-Year Lease</div>
                  <div><strong>Requirements:</strong> ID, Farming experience</div>
                </div>
              </div>

              <div style={{ marginTop: '28px' }}>
                <Link href="/signin" className="btn btn-outline" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                  Apply for A1 Parcel
                </Link>
              </div>
            </div>

            {/* A2 Commercial Farm */}
            <div className="glass-panel" style={{
              padding: '36px 28px',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderColor: 'rgba(34, 197, 94, 0.45)',
              background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(20px)',
              boxShadow: isLight ? '0 12px 30px rgba(22, 163, 74, 0.12)' : '0 20px 40px -10px rgba(0, 0, 0, 0.6)',
            }}>
              <div>
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '4px',
                  background: 'rgba(34, 197, 94, 0.25)',
                  color: isLight ? '#15803d' : 'var(--primary-400)',
                }}>
                  POPULAR FOR BUSINESS
                </span>
                <div style={{ fontSize: '0.75rem', color: isLight ? '#15803d' : 'var(--primary-400)', fontWeight: 700, textTransform: 'uppercase', marginTop: '10px' }}>
                  Model A2
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', margin: '8px 0 14px' }}>
                  Commercial Farmland
                </h3>
                <p style={{ color: isLight ? '#475569' : 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '22px' }}>
                  Intensive commercial farming for domestic supply and foreign currency export. Focus on tobacco, wheat, soya beans, citrus, and dairy.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem', color: isLight ? '#334155' : '#cbd5e1' }}>
                  <div><strong>Standard Area:</strong> 50 to 500+ Hectares</div>
                  <div><strong>Target:</strong> Agribusinesses, commercial farmers, corporates</div>
                  <div><strong>Tenure:</strong> Bankable 99-Year Lease (Mortgageable)</div>
                  <div><strong>Requirements:</strong> Tax Clearance, Proof of Capital, Business Plan</div>
                </div>
              </div>

              <div style={{ marginTop: '28px' }}>
                <Link href="/signin" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                  Apply for A2 Parcel
                </Link>
              </div>
            </div>

            {/* Specialized Ranching & Dairy */}
            <div className="glass-panel" style={{
              padding: '36px 28px',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(20px)',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: isLight ? '0 8px 24px rgba(0, 0, 0, 0.08)' : undefined,
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: isLight ? '#d97706' : 'var(--accent-400)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Model Specialized
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', margin: '8px 0 14px' }}>
                  Livestock & Ranching
                </h3>
                <p style={{ color: isLight ? '#475569' : 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '22px' }}>
                  Allocated primarily in Natural Regions IV & V (Matabeleland, Midlands, Masvingo) for commercial cattle breeding, goat production, and wildlife ranching.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem', color: isLight ? '#334155' : '#cbd5e1' }}>
                  <div><strong>Standard Area:</strong> Up to 2,000 Hectares</div>
                  <div><strong>Target:</strong> Pastoralists, livestock breeders</div>
                  <div><strong>Tenure:</strong> 99-Year Commercial Grazing Lease</div>
                  <div><strong>Requirements:</strong> Livestock inventory & dipping infrastructure plan</div>
                </div>
              </div>

              <div style={{ marginTop: '28px' }}>
                <Link href="/signin" className="btn btn-outline" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                  Apply for Ranching Land
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. LATEST LAND NEWS & POLICY HIGHLIGHTS (REAL-TIME BROADCAST) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="news" style={{
        maxWidth: '1360px',
        margin: '90px auto',
        padding: '0 24px',
      }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>

          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 800,
            color: isLight ? '#0f172a' : '#ffffff',
            margin: '0 0 12px',
            letterSpacing: '-0.02em',
          }}>
            Live Land, Farm &amp; Agricultural Updates
          </h2>
          <p style={{
            color: isLight ? '#475569' : 'var(--text-muted)',
            maxWidth: '760px',
            margin: '0 auto 24px',
            fontSize: '0.95rem',
            lineHeight: 1.65,
          }}>
            Continuously refreshed with real agricultural dispatches, syndications from The Herald Agriculture Desk, The Chronicle, and national farmland tenure authorities.
          </p>



        </div>

        {/* News Feed Grid (x2 Grid on Large Screens) */}
        <div className="news-feed-grid">
          {filteredNews.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              borderRadius: '16px',
              background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.6)',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
              color: isLight ? '#64748b' : 'var(--text-muted)',
              gridColumn: '1 / -1',
            }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>No farming news updates currently available. Checking live feed...</p>
            </div>
          )}
          {filteredNews.map((article) => (
            <article
              key={article.id}
              className="glass-panel horizontal-news-card"
              style={{
                background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: isLight ? '0 8px 24px rgba(15, 23, 42, 0.06)' : '0 12px 32px rgba(0, 0, 0, 0.4)',
              }}
            >
              {/* Left Column: Visual Media & Source Branding */}
              <div
                className="news-card-image"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  background: '#0a0f1d',
                  flexShrink: 0,
                }}
              >
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('harvest-field.jpg')) {
                      target.src = '/images/harvest-field.jpg';
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.4s ease',
                  }}
                />
                {/* Media Gradient Scrim */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.85) 100%)',
                }} />

                {/* Overlaid Source Badge */}
                <div style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}>
                  <span style={{ color: '#22c55e' }}>●</span>
                  <span>{article.source}</span>
                </div>

                {/* Overlaid Date / Read Time */}
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '14px',
                  right: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  color: '#e2e8f0',
                  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                }}>
                  <span>📅 {article.date}</span>
                  <span>⏱️ {article.readTime}</span>
                </div>
              </div>

              {/* Right Column: Article Details & Key Takeaways */}
              <div className="news-card-content">
                <div>
                  {/* Top Bar with Category Badge & Actual News Website External Link */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        padding: '4px 12px',
                        borderRadius: '6px',
                        background: article.badgeBg,
                        color: article.badgeColor,
                        border: `1px solid ${article.badgeBorder}`,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}>
                        {article.badge}
                      </span>

                      {article.isLiveWire && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isLight ? 'rgba(22, 163, 74, 0.12)' : 'rgba(34, 197, 94, 0.2)',
                          color: isLight ? '#15803d' : '#4ade80',
                          border: isLight ? '1px solid rgba(22, 163, 74, 0.3)' : '1px solid rgba(34, 197, 94, 0.35)',
                        }}>
                          <span className="live-pulse-dot" style={{ width: 6, height: 6 }} />
                          <span>LIVE WIRE</span>
                        </span>
                      )}
                    </div>

                    <a
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: isLight ? '#1d4ed8' : '#60a5fa',
                        textDecoration: 'none',
                        background: isLight ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.15)',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        border: isLight ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.15s ease',
                      }}
                      title={`Open actual coverage on ${article.sourceDomain}`}
                    >
                      <span>{article.sourceDomain}</span>
                      <span>↗</span>
                    </a>
                  </div>

                  {/* Headline */}
                  <h3 style={{
                    fontSize: 'clamp(1.15rem, 1.6vw, 1.4rem)',
                    fontWeight: 800,
                    lineHeight: 1.35,
                    color: isLight ? '#0f172a' : '#ffffff',
                    marginBottom: '8px',
                    letterSpacing: '-0.015em',
                  }}>
                    {article.title}
                  </h3>

                  {/* Statutory Reference */}
                  <div style={{
                    fontSize: '0.775rem',
                    color: isLight ? '#15803d' : 'var(--primary-400)',
                    fontWeight: 600,
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <span>🏛️</span>
                    <span>{article.gazetteRef}</span>
                  </div>

                  {/* Synopsis */}
                  <p style={{
                    fontSize: '0.9rem',
                    color: isLight ? '#475569' : 'var(--text-muted)',
                    lineHeight: 1.65,
                    marginBottom: '16px',
                  }}>
                    {article.summary}
                  </p>

                  {/* Key Highlights Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '8px 16px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: isLight ? 'rgba(241, 245, 249, 0.75)' : 'rgba(2, 6, 23, 0.55)',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
                    marginBottom: '20px',
                  }}>
                    {article.bulletPoints.map((point, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        fontSize: '0.8125rem',
                        color: isLight ? '#334155' : '#cbd5e1',
                        lineHeight: 1.5,
                      }}>
                        <span style={{ color: isLight ? '#16a34a' : '#4ade80', fontWeight: 800 }}>✓</span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.08)',
                }}>
                  <div style={{
                    fontSize: '0.775rem',
                    color: isLight ? '#64748b' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <span>🗞️</span>
                    <span>Actual Media Reporting: <strong>{article.source}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <a
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '9px 16px',
                        borderRadius: '8px',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.16)',
                        background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.06)',
                        color: isLight ? '#0f172a' : '#ffffff',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <span>Visit {article.sourceDomain}</span>
                      <span>↗</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setSelectedNews(article)}
                      className="btn btn-primary"
                      style={{
                        padding: '9px 18px',
                        fontSize: '0.8125rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>Read Full Analysis</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Interactive Communiqué Modal */}
        {selectedNews && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}>
            <div style={{
              background: isLight ? '#ffffff' : '#090e1a',
              borderRadius: '20px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(34, 197, 94, 0.4)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)',
              position: 'relative',
            }}>
              {/* Top Official Ministry Banner */}
              <div style={{
                background: 'linear-gradient(90deg, #166534 0%, #15803d 50%, #854d0e 100%)',
                padding: '16px 24px',
                color: '#fef08a',
                fontSize: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTopLeftRadius: '19px',
                borderTopRightRadius: '19px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ZimbabweFlag width={20} height={13} />
                  <strong>REPUBLIC OF ZIMBABWE • STATUTORY COMMUNIQUÉ</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNews(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    lineHeight: 1,
                    padding: '2px 8px',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Featured Image Header */}
              <div style={{ position: 'relative', height: '220px', width: '100%', overflow: 'hidden' }}>
                <img
                  src={selectedNews.imageUrl}
                  alt={selectedNews.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 50%, rgba(9, 14, 26, 0.95) 100%)',
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '14px',
                  left: '24px',
                  right: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: selectedNews.badgeBg,
                    color: selectedNews.badgeColor,
                    border: `1px solid ${selectedNews.badgeBorder}`,
                  }}>
                    {selectedNews.badge}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#e2e8f0', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                    Published: {selectedNews.date}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '24px 28px 32px' }}>
                <h3 style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: isLight ? '#0f172a' : '#ffffff',
                  lineHeight: 1.35,
                  marginBottom: '12px',
                }}>
                  {selectedNews.title}
                </h3>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.8125rem',
                  marginBottom: '20px',
                  color: isLight ? '#334155' : '#cbd5e1',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}>
                  <div>
                    <strong>Authority Reference:</strong> {selectedNews.gazetteRef} • <em>{selectedNews.source}</em>
                  </div>
                  <a
                    href={selectedNews.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: isLight ? '#1d4ed8' : '#60a5fa',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Open {selectedNews.sourceDomain} ↗
                  </a>
                </div>

                <div style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.7,
                  color: isLight ? '#334155' : '#e2e8f0',
                  marginBottom: '24px',
                  padding: '16px 18px',
                  borderRadius: '12px',
                  background: isLight ? 'rgba(34, 197, 94, 0.06)' : 'rgba(34, 197, 94, 0.1)',
                  borderLeft: '4px solid #22c55e',
                }}>
                  {selectedNews.fullGazetteText}
                </div>

                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', marginBottom: '10px' }}>
                  Statutory Enactments & Directives:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
                  {selectedNews.bulletPoints.map((pt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.875rem', color: isLight ? '#475569' : '#cbd5e1' }}>
                      <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>

                {/* Footer action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <a
                    href={selectedNews.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.2)',
                      background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
                      color: isLight ? '#0f172a' : '#ffffff',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>Read on {selectedNews.sourceDomain}</span>
                    <span>↗</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setSelectedNews(null)}
                    className="btn btn-primary"
                    style={{ padding: '10px 24px', fontSize: '0.875rem' }}
                  >
                    Close Communiqué
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. STATUTORY CHECKLIST & MANDATORY DOCUMENTS                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="eligibility" style={{
        maxWidth: '1360px',
        margin: '80px auto',
        padding: '0 24px',
      }}>
        <div className="glass-panel" style={{
          padding: '52px 40px',
          borderRadius: '24px',
          background: isLight
            ? 'linear-gradient(135deg, #ffffff 0%, rgba(220, 252, 231, 0.4) 100%)'
            : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(6, 78, 59, 0.3) 100%)',
          border: isLight ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(34, 197, 94, 0.3)',
          boxShadow: isLight ? '0 12px 36px rgba(15, 23, 42, 0.08)' : undefined,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '48px', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff', margin: '0 0 16px' }}>
                What You Need Before Applying
              </h2>
              <p style={{ color: isLight ? '#475569' : 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.65, marginBottom: '28px' }}>
                To ensure rapid verification by District Land Registry Officers and the Provincial Land Committee, please have digital copies of these required documents ready:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <span style={{ color: isLight ? '#16a34a' : 'var(--primary-400)', fontSize: '1.25rem', fontWeight: 800 }}>✓</span>
                  <div>
                    <strong style={{ color: isLight ? '#0f172a' : '#ffffff' }}>National Identity Document:</strong> <span style={{ color: isLight ? '#334155' : 'inherit' }}>Valid Zimbabwean Metal/Plastic ID or Passport.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <span style={{ color: isLight ? '#16a34a' : 'var(--primary-400)', fontSize: '1.25rem', fontWeight: 800 }}>✓</span>
                  <div>
                    <strong style={{ color: isLight ? '#0f172a' : '#ffffff' }}>Proof of Agricultural Training or Capability:</strong> <span style={{ color: isLight ? '#334155' : 'inherit' }}>Master Farmer Certificate, Agricultural College Diploma, or 3-year record of crop/livestock delivery (GMB/TIMB receipts).</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <span style={{ color: isLight ? '#16a34a' : 'var(--primary-400)', fontSize: '1.25rem', fontWeight: 800 }}>✓</span>
                  <div>
                    <strong style={{ color: isLight ? '#0f172a' : '#ffffff' }}>5-Year Farm Development Proposal:</strong> <span style={{ color: isLight ? '#334155' : 'inherit' }}>Planned land utilization, crop rotation schedule, mechanization plans, and employment creation projections.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <span style={{ color: isLight ? '#16a34a' : 'var(--primary-400)', fontSize: '1.25rem', fontWeight: 800 }}>✓</span>
                  <div>
                    <strong style={{ color: isLight ? '#0f172a' : '#ffffff' }}>Tax Clearance Certificate (ZIMRA):</strong> <span style={{ color: isLight ? '#334155' : 'inherit' }}>Mandatory for all commercial A2 and corporate applicants.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <span style={{ color: isLight ? '#16a34a' : 'var(--primary-400)', fontSize: '1.25rem', fontWeight: 800 }}>✓</span>
                  <div>
                    <strong style={{ color: isLight ? '#0f172a' : '#ffffff' }}>Proof of Capital or Asset Ownership:</strong> <span style={{ color: isLight ? '#334155' : 'inherit' }}>Bank statement, tractor/machinery logbook, or AFC/commercial loan pre-approval letter.</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.75)',
              padding: '36px',
              borderRadius: '20px',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: isLight ? '0 4px 16px rgba(0, 0, 0, 0.04)' : undefined,
            }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', marginBottom: '16px' }}>
                ⚖️ Anti-Corruption & Single Allocation Rule
              </h3>
              <p style={{ color: isLight ? '#475569' : 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '20px' }}>
                In accordance with statutory policy, <strong>the one-person-one-farm principle is strictly enforced</strong>. SLLAS automatically checks national registries to reject applications from individuals or corporate entities who already hold an allocated agricultural farm parcel.
              </p>

              <div style={{
                padding: '18px 20px',
                borderRadius: '10px',
                background: isLight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: isLight ? '#b45309' : 'var(--accent-400)',
                fontSize: '0.8125rem',
                lineHeight: 1.6,
              }}>
                <strong>Notice:</strong> Submitting fraudulent documents or speculative land applications constitutes a criminal offense under the Agricultural Land Settlement Act and will be referred to statutory authorities.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 7. FAQ ACCORDION SECTION                                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="faqs" style={{
        maxWidth: '960px',
        margin: '90px auto',
        padding: '0 24px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff', margin: '0 0 12px' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: isLight ? '#475569' : 'var(--text-muted)', fontSize: '0.9375rem' }}>
            Everything you need to know about the digital land allocation process and leaseholder rights.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={faq.q}
                className="glass-panel"
                style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.6)',
                  border: isOpen
                    ? (isLight ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(34, 197, 94, 0.4)')
                    : (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'),
                  boxShadow: isLight ? '0 2px 8px rgba(0, 0, 0, 0.04)' : undefined,
                  transition: 'all 0.2s ease',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  style={{
                    width: '100%',
                    padding: '22px 26px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    color: isLight ? '#0f172a' : '#ffffff',
                    fontSize: '1rem',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ paddingRight: '16px' }}>{faq.q}</span>
                  <span style={{
                    fontSize: '1.35rem',
                    color: isOpen ? (isLight ? '#16a34a' : 'var(--primary-400)') : (isLight ? '#94a3b8' : 'var(--text-muted)'),
                    transform: isOpen ? 'rotate(45deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }}>
                    +
                  </span>
                </button>

                {isOpen && (
                  <div style={{
                    padding: '0 26px 22px',
                    color: isLight ? '#475569' : 'var(--text-muted)',
                    fontSize: '0.875rem',
                    lineHeight: 1.65,
                    borderTop: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.06)',
                    paddingTop: '18px',
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 8. FOOTER & MINISTRY DIRECTORY                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
        background: isLight ? '#f1f5f9' : 'rgba(4, 7, 15, 0.98)',
        padding: '60px 24px 28px',
        color: isLight ? '#475569' : 'var(--text-muted)',
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '44px',
          marginBottom: '44px',
        }}>
          <div>
            <Logo variant="full" theme={isLight ? 'light' : 'dark'} />
            <p style={{ fontSize: '0.8125rem', marginTop: '16px', lineHeight: 1.65, color: isLight ? '#64748b' : undefined }}>
              Smart Land Lease and Allocation System (SLLAS). Official national digital land governance platform for the Government of Zimbabwe.
            </p>
          </div>

          <div>
            <h4 style={{ color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.875rem', fontWeight: 600, marginBottom: '16px' }}>
              Statutory Quick Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
              <Link href="/parcels?status=AVAILABLE&view=map" style={{ color: isLight ? '#334155' : 'var(--text-muted)', textDecoration: 'none' }}>
                Spatial Cadastre Map
              </Link>
              <Link href="/signin" style={{ color: isLight ? '#334155' : 'var(--text-muted)', textDecoration: 'none' }}>
                Citizen Application Portal
              </Link>
              <a href="#schemes" style={{ color: isLight ? '#334155' : 'var(--text-muted)', textDecoration: 'none' }}>
                A1 & A2 Scheme Guidelines
              </a>
              <a href="#eligibility" style={{ color: isLight ? '#334155' : 'var(--text-muted)', textDecoration: 'none' }}>
                Documentation Requirements
              </a>
            </div>
          </div>

          <div>
            <h4 style={{ color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.875rem', fontWeight: 600, marginBottom: '16px' }}>
              Ministry Headquarters
            </h4>
            <div style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: isLight ? '#475569' : undefined }}>
              Ministry of Lands & Rural Development<br />
              Block 2 Makombe Complex<br />
              Harare, Republic of Zimbabwe<br />
              Hotline: +263 242 706081 / 706082<br />
              Email: info@lands.gov.zw
            </div>
          </div>

          <div>
            <h4 style={{ color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.875rem', fontWeight: 600, marginBottom: '16px' }}>
              Provincial Registry Stations
            </h4>
            <div style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: isLight ? '#475569' : undefined }}>
              • Mashonaland West (Chinhoyi)<br />
              • Mashonaland East (Marondera)<br />
              • Mashonaland Central (Bindura)<br />
              • Midlands (Gweru)<br />
              • Manicaland (Mutare)<br />
              • Masvingo (Masvingo)<br />
              • Matabeleland North (Lupane)<br />
              • Matabeleland South (Gwanda)
            </div>
          </div>
        </div>

        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.75rem',
          color: isLight ? '#64748b' : undefined,
        }}>
          <div>© {new Date().getFullYear()} Government of Zimbabwe. All rights reserved. SLLAS Phase 2 Cadastre Engine.</div>
          <div>PostGIS Spatial SRID 4326 • Strict Segregation of Duties Enforced</div>
        </div>
      </footer>
    </div>
  );
}
