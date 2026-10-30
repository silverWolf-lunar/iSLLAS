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
      background: 'radial-gradient(ellipse at 50% 0%, rgba(22, 101, 52, 0.2) 0%, rgba(10, 15, 29, 0.98) 50%, #060913 100%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflowX: 'hidden',
    }}>
      {/* Top Government Banner */}
      <div style={{
        background: 'linear-gradient(90deg, #166534 0%, #064e3b 50%, #854d0e 100%)',
        padding: '6px 16px',
        fontSize: '0.75rem',
        color: '#fef08a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        borderBottom: '1px solid rgba(254, 240, 138, 0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🇿🇼</span>
          <strong>REPUBLIC OF ZIMBABWE</strong>
          <span>•</span>
          <span>Ministry of Lands & Rural Development</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Agricultural Land Settlement Act (Cap 20:01)</span>
          <span>•</span>
          <span style={{ color: '#ffffff' }}>Vision 2030 Cadastre</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        background: 'rgba(6, 9, 19, 0.85)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '12px 24px',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Logo variant="full" theme={resolvedTheme === 'light' ? 'light' : 'dark'} />
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a href="#process" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
              Application Process
            </a>
            <a href="#schemes" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
              Land Schemes
            </a>
            <a href="#eligibility" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
              Eligibility Checklist
            </a>
            <a href="#faqs" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
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
                gap: '4px',
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
                  padding: '8px 16px',
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
                  style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                >
                  Sign In to SLLAS
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Authenticated Floating Quick Access (if user already logged in) */}
      {session?.user && (
        <div style={{
          background: 'rgba(22, 163, 74, 0.15)',
          borderBottom: '1px solid rgba(22, 163, 74, 0.3)',
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

      {/* Hero Section */}
      <section style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '72px 24px 48px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.75rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          color: '#ffffff',
          maxWidth: '920px',
          margin: '0 auto 20px',
          letterSpacing: '-0.02em',
        }}>
          Fair, Transparent & Digital <br />
          <span style={{
            background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #eab308 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Agricultural Land Allocation
          </span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--text-muted)',
          maxWidth: '780px',
          margin: '0 auto 36px',
          lineHeight: 1.6,
        }}>
          Apply for available state farmland, track land board evaluations in real time, and obtain bankable 99-year leases secured by GIS spatial mapping across Zimbabwe's 10 administrative provinces.
        </p>

        {/* Hero CTA Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '56px' }}>
          <Link
            href="/parcels?status=AVAILABLE&view=map"
            className="btn btn-primary"
            style={{
              padding: '14px 28px',
              fontSize: '1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span>🗺️</span>
            <span>Explore Available Farmland (Cadastre)</span>
          </Link>

          <Link
            href="/signin"
            className="btn btn-outline"
            style={{
              padding: '14px 28px',
              fontSize: '1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderColor: 'rgba(255, 255, 255, 0.25)',
            }}
          >
            <span>📝</span>
            <span>Start Land Application</span>
          </Link>

          <a
            href="#process"
            className="btn btn-outline"
            style={{
              padding: '14px 22px',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📘</span>
            <span>View 6-Step Guide</span>
          </a>
        </div>

        {/* Live Cadastre Metrics Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          textAlign: 'left',
        }}>
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Verified State Farmland
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff', margin: '6px 0 2px' }}>
              1,240,000+ <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ha</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary-400)' }}>
              Boundaries digitally surveyed
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Available Idle Parcels
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-400)', margin: '6px 0 2px' }}>
              420+ Parcels
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary-400)' }}>
              Open for immediate application
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Bankable 99-Year Leases
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-400)', margin: '6px 0 2px' }}>
              1,850+ Issued
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-400)' }}>
              Collateral-eligible tenure
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Jurisdictional Coverage
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff', margin: '6px 0 2px' }}>
              10 Provinces
            </div>
            <div style={{ fontSize: '0.75rem', color: '#60a5fa' }}>
              60 District Land Registry Offices
            </div>
          </div>
        </div>
      </section>

      {/* 6-Step Land Application & Allocation Workflow */}
      <section id="process" style={{
        maxWidth: '1280px',
        margin: '60px auto',
        padding: '0 24px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '4px',
            background: 'rgba(22, 163, 74, 0.2)',
            color: 'var(--primary-400)',
            letterSpacing: '0.05em',
          }}>
            STATUTORY WORKFLOW
          </span>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#ffffff', marginTop: '12px', marginBottom: '10px' }}>
            How to Apply for Agricultural Land in Zimbabwe
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto', fontSize: '0.9375rem' }}>
            From identifying an idle parcel on the spatial cadastre to receiving an authenticated 99-Year Lease agreement, follow the six statutory milestones.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
        }}>
          {/* Step 1 */}
          <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px', position: 'relative' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(34, 197, 94, 0.2)',
              color: 'var(--primary-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
              marginBottom: '16px',
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}>
              1
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
              Spatial Cadastre Search
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Open the interactive cadastre map. Filter parcels by <strong>Natural Agro-Ecological Region (I to V)</strong>, available hectares, water rights (dams/boreholes), and soil classification. Select any parcel marked as <em>AVAILABLE</em>.
            </p>
            <div style={{ marginTop: '16px' }}>
              <Link href="/parcels?status=AVAILABLE&view=map" style={{ color: 'var(--primary-400)', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}>
                Open Spatial Map →
              </Link>
            </div>
          </div>

          {/* Step 2 */}
          <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px', position: 'relative' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
              marginBottom: '16px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}>
              2
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
              Digital Application & Business Plan
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Submit your formal application through the Citizen Portal. Specify your farming activity (Tobacco, Grain, Horticulture, Dairy, Cattle), declare projected capital investments, and attach your 5-Year Farm Development Plan and National ID.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px', position: 'relative' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.2)',
              color: 'var(--accent-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
              marginBottom: '16px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}>
              3
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
              District Physical Inspection & Verification
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              The District Land Registry Officer inspects the target boundaries on the ground, conducts environmental assessment (EMA guidelines), verifies applicant identity, and ensures the parcel has zero tenure disputes.
            </p>
          </div>

          {/* Step 4 */}
          <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px', position: 'relative' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.2)',
              color: '#c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
              marginBottom: '16px',
              border: '1px solid rgba(168, 85, 247, 0.3)',
            }}>
              4
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
              Provincial Land Board Evaluation
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              The Provincial Land Committee convenes to evaluate technical capability, agricultural productivity scores, and local economic impact. The board issues an affirmative recommendation to the national executive.
            </p>
          </div>

          {/* Step 5 */}
          <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px', position: 'relative' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
              marginBottom: '16px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}>
              5
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
              Ministerial Approval & Offer Letter
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              The National Approver / Minister executes the statutory allocation. An official, cryptographically verifiable <strong>Offer Letter</strong> with a secure QR code is automatically generated and delivered to your portal.
            </p>
          </div>

          {/* Step 6 */}
          <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px', position: 'relative', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(34, 197, 94, 0.2)',
              color: 'var(--primary-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
              marginBottom: '16px',
              border: '1px solid rgba(34, 197, 94, 0.4)',
            }}>
              6
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
              Cadastral Survey & 99-Year Lease
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              The Department of the Surveyor-General fixes official GPS corner beacons. The Estates Directorate issues the legal, notarized <strong>99-Year Lease Agreement</strong> with bankable financial tenure rights.
            </p>
          </div>
        </div>
      </section>

      {/* Resettlement Schemes Comparison */}
      <section id="schemes" style={{
        maxWidth: '1280px',
        margin: '80px auto',
        padding: '0 24px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '4px',
            background: 'rgba(245, 158, 11, 0.2)',
            color: 'var(--accent-400)',
            letterSpacing: '0.05em',
          }}>
            TENURE CATEGORIES
          </span>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#ffffff', marginTop: '12px', marginBottom: '10px' }}>
            Zimbabwe Agricultural Resettlement Models
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto', fontSize: '0.9375rem' }}>
            Choose the agricultural model that matches your enterprise scale, capital availability, and farming experience.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          {/* A1 Smallholder */}
          <div className="glass-panel" style={{ padding: '32px 24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--primary-400)', fontWeight: 700, textTransform: 'uppercase' }}>
                Model A1
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', margin: '8px 0 12px' }}>
                Smallholder Family Farm
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '20px' }}>
                Designed for small-scale self-sufficiency, household food security, and surplus production of maize, grains, groundnuts, and horticulture.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem', color: '#cbd5e1' }}>
                <div><strong>Standard Area:</strong> 5 to 50 Hectares</div>
                <div><strong>Target:</strong> Rural families, master farmers, agricultural graduates</div>
                <div><strong>Tenure:</strong> Settlement Permit / 99-Year Lease</div>
                <div><strong>Requirements:</strong> ID, Farming experience</div>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <Link href="/signin" className="btn btn-outline" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                Apply for A1 Parcel
              </Link>
            </div>
          </div>

          {/* A2 Commercial Farm */}
          <div className="glass-panel" style={{
            padding: '32px 24px',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderColor: 'rgba(34, 197, 94, 0.4)',
            background: 'rgba(15, 23, 42, 0.85)',
          }}>
            <div>
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(34, 197, 94, 0.25)',
                color: 'var(--primary-400)',
              }}>
                POPULAR FOR BUSINESS
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--primary-400)', fontWeight: 700, textTransform: 'uppercase', marginTop: '8px' }}>
                Model A2
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', margin: '8px 0 12px' }}>
                Commercial Farmland
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '20px' }}>
                Intensive commercial farming for domestic supply and foreign currency export. Focus on tobacco, wheat, soya beans, citrus, and dairy.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem', color: '#cbd5e1' }}>
                <div><strong>Standard Area:</strong> 50 to 500+ Hectares</div>
                <div><strong>Target:</strong> Agribusinesses, commercial farmers, corporates</div>
                <div><strong>Tenure:</strong> Bankable 99-Year Lease (Mortgageable)</div>
                <div><strong>Requirements:</strong> Tax Clearance, Proof of Capital, Business Plan</div>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <Link href="/signin" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                Apply for A2 Parcel
              </Link>
            </div>
          </div>

          {/* Specialized Ranching & Dairy */}
          <div className="glass-panel" style={{ padding: '32px 24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-400)', fontWeight: 700, textTransform: 'uppercase' }}>
                Model Specialized
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', margin: '8px 0 12px' }}>
                Livestock & Ranching
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '20px' }}>
                Allocated primarily in Natural Regions IV & V (Matabeleland, Midlands, Masvingo) for commercial cattle breeding, goat production, and wildlife ranching.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem', color: '#cbd5e1' }}>
                <div><strong>Standard Area:</strong> Up to 2,000 Hectares</div>
                <div><strong>Target:</strong> Pastoralists, livestock breeders</div>
                <div><strong>Tenure:</strong> 99-Year Commercial Grazing Lease</div>
                <div><strong>Requirements:</strong> Livestock inventory & dipping infrastructure plan</div>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <Link href="/signin" className="btn btn-outline" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                Apply for Ranching Land
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statutory Checklist Section */}
      <section id="eligibility" style={{
        maxWidth: '1280px',
        margin: '80px auto',
        padding: '0 24px',
      }}>
        <div className="glass-panel" style={{
          padding: '48px 36px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(6, 78, 59, 0.25) 100%)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center' }}>
            <div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '4px',
                background: 'rgba(34, 197, 94, 0.2)',
                color: 'var(--primary-400)',
              }}>
                CHECKLIST & MANDATORY DOCUMENTS
              </span>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#ffffff', margin: '14px 0 16px' }}>
                What You Need Before Applying
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '24px' }}>
                To ensure rapid verification by District Land Registry Officers and the Provincial Land Committee, please have digital copies of these required documents ready:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ color: 'var(--primary-400)', fontSize: '1.25rem' }}>✓</span>
                  <div>
                    <strong style={{ color: '#ffffff' }}>National Identity Document:</strong> Valid Zimbabwean Metal/Plastic ID or Passport.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ color: 'var(--primary-400)', fontSize: '1.25rem' }}>✓</span>
                  <div>
                    <strong style={{ color: '#ffffff' }}>Proof of Agricultural Training or Capability:</strong> Master Farmer Certificate, Agricultural College Diploma, or 3-year record of crop/livestock delivery (GMB/TIMB receipts).
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ color: 'var(--primary-400)', fontSize: '1.25rem' }}>✓</span>
                  <div>
                    <strong style={{ color: '#ffffff' }}>5-Year Farm Development Proposal:</strong> Planned land utilization, crop rotation schedule, mechanization plans, and employment creation projections.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ color: 'var(--primary-400)', fontSize: '1.25rem' }}>✓</span>
                  <div>
                    <strong style={{ color: '#ffffff' }}>Tax Clearance Certificate (ZIMRA):</strong> Mandatory for all commercial A2 and corporate applicants.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ color: 'var(--primary-400)', fontSize: '1.25rem' }}>✓</span>
                  <div>
                    <strong style={{ color: '#ffffff' }}>Proof of Capital or Asset Ownership:</strong> Bank statement, tractor/machinery logbook, or AFC/commercial loan pre-approval letter.
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(2, 6, 23, 0.7)',
              padding: '32px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>
                ⚖️ Anti-Corruption & Single Allocation Rule
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '16px' }}>
                In accordance with statutory policy, <strong>the one-person-one-farm principle is strictly enforced</strong>. SLLAS automatically checks national registries to reject applications from individuals or corporate entities who already hold an allocated agricultural farm parcel.
              </p>

              <div style={{
                padding: '16px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: 'var(--accent-400)',
                fontSize: '0.8125rem',
                lineHeight: 1.5,
              }}>
                <strong>Notice:</strong> Submitting fraudulent documents or speculative land applications constitutes a criminal offense under the Agricultural Land Settlement Act and will be referred to statutory authorities.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faqs" style={{
        maxWidth: '920px',
        margin: '80px auto',
        padding: '0 24px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '4px',
            background: 'rgba(59, 130, 246, 0.2)',
            color: '#60a5fa',
            letterSpacing: '0.05em',
          }}>
            FREQUENT QUESTIONS
          </span>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#ffffff', marginTop: '12px', marginBottom: '10px' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
            Everything you need to know about the digital land allocation process and leaseholder rights.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={faq.q}
                className="glass-panel"
                style={{
                  borderRadius: '12px',
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
                    padding: '20px 24px',
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
                  <span>{faq.q}</span>
                  <span style={{
                    fontSize: '1.25rem',
                    color: isOpen ? 'var(--primary-400)' : 'var(--text-muted)',
                    transform: isOpen ? 'rotate(45deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }}>
                    +
                  </span>
                </button>

                {isOpen && (
                  <div style={{
                    padding: '0 24px 20px',
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    paddingTop: '16px',
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer & Ministry Contact */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(4, 7, 15, 0.95)',
        padding: '56px 24px 24px',
        color: 'var(--text-muted)',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '40px',
          marginBottom: '40px',
        }}>
          <div>
            <Logo variant="full" theme="dark" />
            <p style={{ fontSize: '0.8125rem', marginTop: '16px', lineHeight: 1.6 }}>
              Smart Land Lease and Allocation System (SLLAS). Official digital land governance portal for the Government of Zimbabwe.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 600, marginBottom: '16px' }}>
              Statutory Quick Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
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
            <div style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
              Ministry of Lands & Rural Development<br />
              Ngungunyana Building, 1 Borrowdale Road<br />
              Harare, Republic of Zimbabwe<br />
              Hotline: +263 242 706081 / 706082<br />
              Email: info@lands.gov.zw
            </div>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 600, marginBottom: '16px' }}>
              Provincial Registry Offices
            </h4>
            <div style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
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
          maxWidth: '1280px',
          margin: '0 auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.75rem',
        }}>
          <div>© {new Date().getFullYear()} Government of Zimbabwe. All rights reserved. SLLAS Phase 2 Cadastre Engine.</div>
          <div>PostGIS Spatial SRID 4326 • Segregation of Duties Enforced</div>
        </div>
      </footer>
    </div>
  );
}
