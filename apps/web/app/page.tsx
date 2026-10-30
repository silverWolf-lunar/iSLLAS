'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Logo } from './components/Logo';
import { useTheme } from 'next-themes';
import { Role } from '@sllas/contracts';
import { getDefaultDashboardForRole, ROLE_CONFIG } from './lib/access';

export default function LandingPage() {
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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
      background: '#060913',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflowX: 'hidden',
    }}>
      {/* Top Government Ribbon */}
      <div style={{
        background: 'linear-gradient(90deg, #166534 0%, #064e3b 50%, #854d0e 100%)',
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
          <span style={{ fontSize: '0.9rem' }}>🇿🇼</span>
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
        background: 'rgba(6, 9, 19, 0.88)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 28px',
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Logo variant="full" theme={resolvedTheme === 'light' ? 'light' : 'dark'} />
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
            <a href="#process" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.15s' }}>
              Application Process
            </a>
            <a href="#cadastre-preview" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.15s' }}>
              Spatial Cadastre
            </a>
            <a href="#schemes" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.15s' }}>
              Land Schemes
            </a>
            <a href="#eligibility" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.15s' }}>
              Eligibility Checklist
            </a>
            <a href="#faqs" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.15s' }}>
              FAQs
            </a>
            <Link
              href="/parcels?status=AVAILABLE&view=map"
              style={{
                color: 'var(--primary-400)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
              }}
            >
              <span>🗺️</span>
              <span>Cadastre Map</span>
            </Link>

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
          background: 'linear-gradient(90deg, rgba(22, 101, 52, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
          borderBottom: '1px solid rgba(34, 197, 94, 0.3)',
          padding: '10px 24px',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--primary-400)',
        }}>
          <span>Signed in as <strong>{(session.user as any)?.name || session.user.email}</strong> ({roleName}).</span>{' '}
          <Link href={userDashboard || '/client'} style={{ color: '#ffffff', textDecoration: 'underline', fontWeight: 600, marginLeft: '8px' }}>
            Open Your Assigned Dashboard Console →
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
        padding: '90px 24px 80px',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        {/* Background Image Layer */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/images/hero-farmland.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
          transform: 'scale(1.02)',
        }} />

        {/* Ambient Dark Gradient Overlays for Readability & Drama */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(6, 9, 19, 0.72) 0%, rgba(6, 9, 19, 0.82) 50%, #060913 100%)',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 30%, rgba(34, 197, 94, 0.18) 0%, transparent 75%)',
        }} />

        {/* Hero Foreground Content */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1240px',
          margin: '0 auto',
          textAlign: 'center',
          width: '100%',
        }}>
          <h1 style={{
            fontSize: 'clamp(2.4rem, 5.5vw, 4.25rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            color: '#ffffff',
            maxWidth: '980px',
            margin: '0 auto 22px',
            letterSpacing: '-0.025em',
            textShadow: '0 4px 30px rgba(0, 0, 0, 0.85)',
          }}>
            Fair, Transparent & Digital <br />
            <span style={{
              background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #facc15 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Agricultural Land Allocation
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(1.05rem, 2vw, 1.3rem)',
            color: '#e2e8f0',
            maxWidth: '820px',
            margin: '0 auto 40px',
            lineHeight: 1.65,
            textShadow: '0 2px 16px rgba(0, 0, 0, 0.9)',
          }}>
            Apply for verified state farmland, track land board evaluations in real time, and obtain bankable 99-year leases secured by GIS spatial mapping across Zimbabwe's 10 administrative provinces.
          </p>

          {/* Hero Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '64px',
          }}>
            <Link
              href="/parcels?status=AVAILABLE&view=map"
              className="btn btn-primary"
              style={{
                padding: '16px 32px',
                fontSize: '1.05rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 8px 24px rgba(22, 163, 74, 0.45)',
              }}
            >
              <span>🗺️</span>
              <span>Explore Available Farmland (Cadastre)</span>
            </Link>

            <Link
              href="/signin"
              className="btn btn-outline"
              style={{
                padding: '16px 30px',
                fontSize: '1.05rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(10px)',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
              }}
            >
              <span>📝</span>
              <span>Start Land Application</span>
            </Link>

            <a
              href="#process"
              className="btn btn-outline"
              style={{
                padding: '16px 24px',
                fontSize: '1.05rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(10px)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#cbd5e1',
              }}
            >
              <span>📘</span>
              <span>6-Step Guide</span>
            </a>
          </div>

          {/* Floating Live Metric Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '18px',
            textAlign: 'left',
          }}>
            <div className="glass-panel" style={{
              padding: '22px 24px',
              borderRadius: '14px',
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(18px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Verified State Farmland
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '6px 0 2px' }}>
                1,240,000+ <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>ha</span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--primary-400)', fontWeight: 500 }}>
                Boundaries digitally surveyed
              </div>
            </div>

            <div className="glass-panel" style={{
              padding: '22px 24px',
              borderRadius: '14px',
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(18px)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Available Idle Parcels
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-400)', margin: '6px 0 2px' }}>
                420+ Parcels
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--primary-400)', fontWeight: 500 }}>
                Open for immediate application
              </div>
            </div>

            <div className="glass-panel" style={{
              padding: '22px 24px',
              borderRadius: '14px',
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(18px)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Bankable 99-Year Leases
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-400)', margin: '6px 0 2px' }}>
                1,850+ Issued
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--accent-400)', fontWeight: 500 }}>
                Collateral-eligible legal tenure
              </div>
            </div>

            <div className="glass-panel" style={{
              padding: '22px 24px',
              borderRadius: '14px',
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(18px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Jurisdictional Stations
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '6px 0 2px' }}>
                10 Provinces
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#60a5fa', fontWeight: 500 }}>
                60 District Land Registry Offices
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
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(6, 78, 59, 0.25) 100%)',
          border: '1px solid rgba(34, 197, 94, 0.25)',
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
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: 'var(--primary-400)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '14px' }}>
                <span>🛰️</span>
                <span>POSTGIS SPATIAL INTELLIGENCE (SRID 4326)</span>
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#ffffff', lineHeight: 1.25, margin: '0 0 16px' }}>
                Next-Generation National Cadastre & Satellite Land Explorer
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.65, marginBottom: '24px' }}>
                Every agricultural land parcel in Zimbabwe is surveyed with high-precision GPS coordinates, boundary polygon vectors, and environmental topography. Our automated spatial engine mathematically verifies that boundaries never overlap.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#e2e8f0' }}>
                  <span style={{ color: 'var(--primary-400)', fontSize: '1.1rem' }}>✓</span>
                  <span><strong>Zero Overlaps:</strong> Automated PostGIS intersection tests prevent double leasing.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#e2e8f0' }}>
                  <span style={{ color: 'var(--primary-400)', fontSize: '1.1rem' }}>✓</span>
                  <span><strong>Agro-Ecological Classification:</strong> Filter regions I to V for soil fertility and rainfall.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#e2e8f0' }}>
                  <span style={{ color: 'var(--primary-400)', fontSize: '1.1rem' }}>✓</span>
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
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: '4px',
            background: 'rgba(22, 163, 74, 0.2)',
            color: 'var(--primary-400)',
            letterSpacing: '0.06em',
          }}>
            STATUTORY WORKFLOW
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: '#ffffff', marginTop: '14px', marginBottom: '12px' }}>
            How to Apply for Agricultural Land in Zimbabwe
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '720px', margin: '0 auto', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            From identifying an idle parcel on the spatial cadastre to receiving an authenticated 99-Year Lease agreement, follow the six statutory milestones.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px',
        }}>
          {/* Step 1 */}
          <div className="glass-panel" style={{ padding: '32px 28px', borderRadius: '16px', position: 'relative' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(34, 197, 94, 0.2)',
              color: 'var(--primary-400)',
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              Spatial Cadastre Search
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>
              Open the interactive cadastre map. Filter parcels by <strong>Natural Agro-Ecological Region (I to V)</strong>, available hectares, water rights (dams/boreholes), and soil classification. Select any parcel marked as <em>AVAILABLE</em>.
            </p>
            <div style={{ marginTop: '18px' }}>
              <Link href="/parcels?status=AVAILABLE&view=map" style={{ color: 'var(--primary-400)', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}>
                Open Spatial Map →
              </Link>
            </div>
          </div>

          {/* Step 2 */}
          <div className="glass-panel" style={{ padding: '32px 28px', borderRadius: '16px', position: 'relative' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              Digital Application & Business Plan
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>
              Submit your formal application through the Citizen Portal. Specify your farming activity (Tobacco, Grain, Horticulture, Dairy, Cattle), declare projected capital investments, and attach your 5-Year Farm Development Plan and National ID.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-panel" style={{ padding: '32px 28px', borderRadius: '16px', position: 'relative' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.2)',
              color: 'var(--accent-400)',
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              District Physical Inspection & Verification
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>
              The District Land Registry Officer inspects the target boundaries on the ground, conducts environmental assessment (EMA guidelines), verifies applicant identity, and ensures the parcel has zero tenure disputes.
            </p>
          </div>

          {/* Step 4 */}
          <div className="glass-panel" style={{ padding: '32px 28px', borderRadius: '16px', position: 'relative' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(168, 85, 247, 0.2)',
              color: '#c084fc',
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              Provincial Land Board Evaluation
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>
              The Provincial Land Committee convenes to evaluate technical capability, agricultural productivity scores, and local economic impact. The board issues an affirmative recommendation to the national executive.
            </p>
          </div>

          {/* Step 5 */}
          <div className="glass-panel" style={{ padding: '32px 28px', borderRadius: '16px', position: 'relative' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              Ministerial Approval & Offer Letter
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>
              The National Approver / Minister executes the statutory allocation. An official, cryptographically verifiable <strong>Offer Letter</strong> with a secure QR code is automatically generated and delivered to your portal.
            </p>
          </div>

          {/* Step 6 */}
          <div className="glass-panel" style={{ padding: '32px 28px', borderRadius: '16px', position: 'relative', borderColor: 'rgba(34, 197, 94, 0.4)' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(34, 197, 94, 0.2)',
              color: 'var(--primary-400)',
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              Cadastral Survey & 99-Year Lease
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>
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
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        {/* Harvest Background Image Layer */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/images/harvest-field.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.38) contrast(1.15)',
        }} />

        {/* Ambient Dark Gradient Overlays */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #060913 0%, rgba(6, 9, 19, 0.75) 50%, #060913 100%)',
        }} />

        {/* Content Container */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1360px',
          margin: '0 auto',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: '4px',
              background: 'rgba(245, 158, 11, 0.25)',
              color: 'var(--accent-400)',
              letterSpacing: '0.06em',
            }}>
              TENURE CATEGORIES
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: '#ffffff', marginTop: '14px', marginBottom: '12px' }}>
              Zimbabwe Agricultural Resettlement Models
            </h2>
            <p style={{ color: '#cbd5e1', maxWidth: '720px', margin: '0 auto', fontSize: '0.9375rem', lineHeight: 1.6 }}>
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
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary-400)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Model A1
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ffffff', margin: '8px 0 14px' }}>
                  Smallholder Family Farm
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '22px' }}>
                  Designed for small-scale self-sufficiency, household food security, and surplus production of maize, grains, groundnuts, and horticulture.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem', color: '#cbd5e1' }}>
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
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6)',
            }}>
              <div>
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '4px',
                  background: 'rgba(34, 197, 94, 0.25)',
                  color: 'var(--primary-400)',
                }}>
                  POPULAR FOR BUSINESS
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary-400)', fontWeight: 700, textTransform: 'uppercase', marginTop: '10px' }}>
                  Model A2
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ffffff', margin: '8px 0 14px' }}>
                  Commercial Farmland
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '22px' }}>
                  Intensive commercial farming for domestic supply and foreign currency export. Focus on tobacco, wheat, soya beans, citrus, and dairy.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem', color: '#cbd5e1' }}>
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
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-400)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Model Specialized
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ffffff', margin: '8px 0 14px' }}>
                  Livestock & Ranching
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '22px' }}>
                  Allocated primarily in Natural Regions IV & V (Matabeleland, Midlands, Masvingo) for commercial cattle breeding, goat production, and wildlife ranching.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem', color: '#cbd5e1' }}>
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
      {/* 5. STATUTORY CHECKLIST & MANDATORY DOCUMENTS                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="eligibility" style={{
        maxWidth: '1360px',
        margin: '80px auto',
        padding: '0 24px',
      }}>
        <div className="glass-panel" style={{
          padding: '52px 40px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(6, 78, 59, 0.3) 100%)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '48px', alignItems: 'center' }}>
            <div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '4px',
                background: 'rgba(34, 197, 94, 0.2)',
                color: 'var(--primary-400)',
              }}>
                CHECKLIST & MANDATORY DOCUMENTS
              </span>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 800, color: '#ffffff', margin: '14px 0 16px' }}>
                What You Need Before Applying
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.65, marginBottom: '28px' }}>
                To ensure rapid verification by District Land Registry Officers and the Provincial Land Committee, please have digital copies of these required documents ready:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <span style={{ color: 'var(--primary-400)', fontSize: '1.25rem', fontWeight: 800 }}>✓</span>
                  <div>
                    <strong style={{ color: '#ffffff' }}>National Identity Document:</strong> Valid Zimbabwean Metal/Plastic ID or Passport.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <span style={{ color: 'var(--primary-400)', fontSize: '1.25rem', fontWeight: 800 }}>✓</span>
                  <div>
                    <strong style={{ color: '#ffffff' }}>Proof of Agricultural Training or Capability:</strong> Master Farmer Certificate, Agricultural College Diploma, or 3-year record of crop/livestock delivery (GMB/TIMB receipts).
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <span style={{ color: 'var(--primary-400)', fontSize: '1.25rem', fontWeight: 800 }}>✓</span>
                  <div>
                    <strong style={{ color: '#ffffff' }}>5-Year Farm Development Proposal:</strong> Planned land utilization, crop rotation schedule, mechanization plans, and employment creation projections.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <span style={{ color: 'var(--primary-400)', fontSize: '1.25rem', fontWeight: 800 }}>✓</span>
                  <div>
                    <strong style={{ color: '#ffffff' }}>Tax Clearance Certificate (ZIMRA):</strong> Mandatory for all commercial A2 and corporate applicants.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <span style={{ color: 'var(--primary-400)', fontSize: '1.25rem', fontWeight: 800 }}>✓</span>
                  <div>
                    <strong style={{ color: '#ffffff' }}>Proof of Capital or Asset Ownership:</strong> Bank statement, tractor/machinery logbook, or AFC/commercial loan pre-approval letter.
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(2, 6, 23, 0.75)',
              padding: '36px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
                ⚖️ Anti-Corruption & Single Allocation Rule
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '20px' }}>
                In accordance with statutory policy, <strong>the one-person-one-farm principle is strictly enforced</strong>. SLLAS automatically checks national registries to reject applications from individuals or corporate entities who already hold an allocated agricultural farm parcel.
              </p>

              <div style={{
                padding: '18px 20px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: 'var(--accent-400)',
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
      {/* 6. FAQ ACCORDION SECTION                                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="faqs" style={{
        maxWidth: '960px',
        margin: '90px auto',
        padding: '0 24px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: '4px',
            background: 'rgba(59, 130, 246, 0.2)',
            color: '#60a5fa',
            letterSpacing: '0.06em',
          }}>
            FREQUENT QUESTIONS
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, color: '#ffffff', marginTop: '14px', marginBottom: '12px' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
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
                  border: isOpen ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
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
                    color: '#ffffff',
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
                    color: isOpen ? 'var(--primary-400)' : 'var(--text-muted)',
                    transform: isOpen ? 'rotate(45deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }}>
                    +
                  </span>
                </button>

                {isOpen && (
                  <div style={{
                    padding: '0 26px 22px',
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem',
                    lineHeight: 1.65,
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
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
      {/* 7. FOOTER & MINISTRY DIRECTORY                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(4, 7, 15, 0.98)',
        padding: '60px 24px 28px',
        color: 'var(--text-muted)',
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
            <Logo variant="full" theme="dark" />
            <p style={{ fontSize: '0.8125rem', marginTop: '16px', lineHeight: 1.65 }}>
              Smart Land Lease and Allocation System (SLLAS). Official national digital land governance platform for the Government of Zimbabwe.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 600, marginBottom: '16px' }}>
              Statutory Quick Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
              <Link href="/parcels?status=AVAILABLE&view=map" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                Spatial Cadastre Map
              </Link>
              <Link href="/signin" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                Citizen Application Portal
              </Link>
              <a href="#schemes" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                A1 & A2 Scheme Guidelines
              </a>
              <a href="#eligibility" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                Documentation Requirements
              </a>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 600, marginBottom: '16px' }}>
              Ministry Headquarters
            </h4>
            <div style={{ fontSize: '0.8125rem', lineHeight: 1.65 }}>
              Ministry of Lands & Rural Development<br />
              Block 2 Makombe Complex<br />
              Harare, Republic of Zimbabwe<br />
              Hotline: +263 242 706081 / 706082<br />
              Email: info@lands.gov.zw
            </div>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 600, marginBottom: '16px' }}>
              Provincial Registry Stations
            </h4>
            <div style={{ fontSize: '0.8125rem', lineHeight: 1.65 }}>
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
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.75rem',
        }}>
          <div>© {new Date().getFullYear()} Government of Zimbabwe. All rights reserved. SLLAS Phase 2 Cadastre Engine.</div>
          <div>PostGIS Spatial SRID 4326 • Strict Segregation of Duties Enforced</div>
        </div>
      </footer>
    </div>
  );
}
