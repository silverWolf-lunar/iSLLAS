# REPUBLIC OF ZIMBABWE
## MINISTRY OF LANDS, AGRICULTURE, FISHERIES, WATER & RURAL DEVELOPMENT

---

# SMART LAND LEASE AND ALLOCATION SYSTEM (SLLAS)
### Authoritative End-User Operational Guide & System User Manual
#### Comprehensive Handbook for Citizens, Farmers, Land Officers, Estates Personnel & System Administrators

---

**Document Reference:** MLRD/SLLAS/MANUAL/2026/V1.0  
**Security Classification:** Official / Public Distribution  
**Governing Statutory Instruments:**  
- Agricultural Land Settlement Act [Chapter 20:01]  
- Zimbabwe Land Commission Act [Chapter 20:29]  
- Traditional Leaders Act [Chapter 29:17]  
**Coordinate Reference System:** EPSG:4326 (WGS 84 / SRID 4326)  
**Publication Date:** November 2026  
**Authoring Unit:** Department of Land Administration, Cadastral Demarcation & Information Technology  

---

<div style="page-break-after: always;"></div>

## TABLE OF CONTENTS

1. [System Overview & Institutional Mandate](#1-system-overview--institutional-mandate)
   - 1.1 Purpose of SLLAS
   - 1.2 Statutory Legislative Framework
   - 1.3 Key Benefits for Citizens & Government
   - 1.4 System Architecture & Platforms (Web & Mobile)
2. [Getting Started & System Access](#2-getting-started--system-access)
   - 2.1 Hardware, Browser & Mobile OS Requirements
   - 2.2 Access URLs & Mobile Application Installation
   - 2.3 User Accounts & Role Permissions Overview
3. [Citizen & Farmer User Guide](#3-citizen--farmer-user-guide)
   - 3.1 Citizen Self-Registration (14 Statutory KYC Fields)
   - 3.2 Pre-Submission Verification & Certification
   - 3.3 Signing In & Multi-Factor Security
   - 3.4 Exploring Zimbabwe Farmland (Satellite, Terrain & Roads GIS)
   - 3.5 Inspecting Farm Subdivisions & Cadastral Dossiers
   - 3.6 Applying for an Agricultural Land Lease
   - 3.7 Tracking Application Progress & Master Waiting List Position
   - 3.8 Receiving Offers, Accepting Leases & 99-Year Bankable Documents
   - 3.9 Verifying Leases via Cryptographic QR Seals
   - 3.10 Account Management & Security Settings
4. [Resettlement Officer User Guide (Web Console)](#4-resettlement-officer-user-guide-web-console)
   - 4.1 Officer Dashboard Overview & Key Performance Indicators
   - 4.2 Registering New Land Parcels (4-Step Cadastre Wizard)
   - 4.3 Spatial Boundary Drawing & Overlap Validation
   - 4.4 Bulk Cadastre Parcel Import via CSV
   - 4.5 Inspecting & Verifying Pending Land Parcels
   - 4.6 Applicant Review Queue & Suitability Scoring
   - 4.7 Land Allocation Workbench & Affirmative Action Quotas
5. [Estates Officer User Guide (Web Console)](#5-estates-officer-user-guide-web-console)
   - 5.1 Estates Directorate Dashboard
   - 5.2 Master Waiting List Administration
   - 5.3 Generating 99-Year Bankable Agricultural Leases
   - 5.4 Printing Statutory Lease Deeds with Legal Emblems & Seal
6. [Land Board Approver User Guide (Web Console)](#6-land-board-approver-user-guide-web-console)
   - 6.1 Board Approvals Docket & Application Queue
   - 6.2 Reviewing Land Allocation Recommendations
   - 6.3 Approving, Amending, or Rejecting Leases with Audit Remarks
7. [National Compliance Auditor User Guide](#7-national-compliance-auditor-user-guide)
   - 7.1 Accessing the Immutable Audit Trail
   - 7.2 Searching & Filtering Statutory Actions
   - 7.3 Auditing Quota Compliance (Youth, Women, War Veterans)
   - 7.4 Exporting Compliance Reports for Parliamentary Oversight
8. [System Administrator User Guide](#8-system-administrator-user-guide)
   - 8.1 Staff Account Provisioning & Role Assignments
   - 8.2 Registry Offices & District Jurisdiction Management
   - 8.3 Security Monitoring, Lock-outs & Account Recovery
   - 8.4 System Configuration & Data Synchronization
9. [Mobile Application Specific Operations](#9-mobile-application-specific-operations)
   - 9.1 Offline Operation & Synchronization
   - 9.2 GPS Location Integration for Field Visits
   - 9.3 In-App Push Notifications & Alerts
   - 9.4 Mobile Settings, Font Sizing, Languages & Dark Mode
10. [Troubleshooting & Helpdesk Support](#10-troubleshooting--helpdesk-support)
    - 10.1 Frequently Encountered Operational Issues
    - 10.2 Error Messages & Recommended Remedies
    - 10.3 Contacting the Ministry Support Desk

---

<div style="page-break-after: always;"></div>

## 1. SYSTEM OVERVIEW & INSTITUTIONAL MANDATE

### 1.1 Purpose of SLLAS
The **Smart Land Lease and Allocation System (SLLAS)** is the sovereign digital land governance and cadastral management platform of the **Republic of Zimbabwe**. Administered by the **Ministry of Lands, Agriculture, Fisheries, Water & Rural Development**, SLLAS replaces fragmented paper-based land administration with a tamper-resistant, GIS-enabled digital registry.

The platform provides end-to-end management of agricultural state land:
- **Demarcation & Registration:** Cataloguing state agricultural land with high-precision polygon boundaries in **EPSG:4326 (WGS 84)**.
- **Fair Allocation:** Processing citizen land applications against transparent, automated waiting lists and constitutional quotas.
- **Statutory 99-Year Leases:** Generating bankable lease agreements equipped with cryptographic QR verification seals.
- **Cadastral Transparency:** Providing real-time satellite, topographic terrain, and highway network spatial mapping across all 10 provinces.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       REPUBLIC OF ZIMBABWE — SLLAS                          │
│                                                                             │
│  [Citizen / Farmer] ──► [Resettlement Officer] ──► [Land Board Approver]    │
│   • Registration         • Boundary Demarcation     • Recommendation Review │
│   • GIS Exploration      • Parcel Verification      • Statutory Approval    │
│   • Application          • Allocation Matching                              │
│                                                                             │
│  [Compliance Auditor] ◄── [Estates Officer] ◄───────────────────────────────┤
│   • Audit Trail Log        • Master Waiting List                            │
│   • Quota Inspection       • 99-Year Lease Generation                       │
│   • Anti-Corruption        • Deed Printing & QR Verification                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Statutory Legislative Framework
All system procedures, forms, workflows, and state transitions in SLLAS are codified in strict accordance with Zimbabwean law:
1. **Agricultural Land Settlement Act [Chapter 20:01]:** Governs state land lease agreements, economic hectarage ceilings, permitted uses, and ministerial termination rights.
2. **Zimbabwe Land Commission Act [Chapter 20:29]:** Enforces the constitutional *"One-Person-One-Farm"* mandate, periodic land audits, and non-discrimination.
3. **Statutory Affirmative Action Quotas:**
   - **Minimum 20% Allocation Quota:** Reserved for Youth (citizens aged 35 and below).
   - **Minimum 30% Allocation Quota:** Reserved for Women Agricultural Producers.
   - **Priority Resettlement:** Reserved for War Veterans and War Collaborators under national empowerment statutes.

### 1.3 Key Benefits for Citizens & Government
- **Zero Intermediaries:** Direct citizen application through web or Android/iOS mobile devices.
- **Bankability:** 99-Year agricultural leases generated through SLLAS meet banking sector collateral requirements with survey diagram numbers and corner beacon coordinates.
- **Immutable Audit Trail:** Every transaction, status alteration, and officer approval is cryptographically logged with actor IDs, client timestamps, and hash signatures.
- **Zero Watermark High-Resolution GIS:** Satellite imagery, topographic contours, road grids, and 16 authoritative farm subdivisions across all provinces.

### 1.4 System Architecture & Platforms
SLLAS is delivered through two synchronized interfaces:
1. **SLLAS Web Portal & Console (`apps/web`):** Accessible via standard web browsers. Serves as the primary console for land administration, cadastral GIS mapping, lease document printing, and citizen registration.
2. **SLLAS Mobile Application (`apps/mobile`):** Native touch-optimized experience built for Android and iOS devices. Engineered for low-bandwidth rural environments, mobile cadastral inspection, and SMS/push status notifications.

---

<div style="page-break-after: always;"></div>

## 2. GETTING STARTED & SYSTEM ACCESS

### 2.1 Hardware, Browser & Mobile OS Requirements

| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Web Browser** | Chrome 110+, Edge 110+, Firefox 115+, Safari 16+ | Latest Chrome or Edge with WebGL enabled |
| **Display Resolution** | 1280 x 720 pixels | 1920 x 1080 pixels (Full HD) |
| **Internet Bandwidth** | 256 kbps (optimized caching) | 2 Mbps or higher for real-time satellite imagery |
| **Mobile OS** | Android 9.0+ / iOS 14.0+ | Android 12.0+ / iOS 16.0+ |
| **Mobile Storage** | 60 MB free storage | 150 MB free storage (for offline map tiles) |

### 2.2 Access URLs & Mobile Application Installation
- **Official Web Portal URL:** `https://isllas.onrender.com` (or national intranet gateway)
- **Local Development / Offline Access:** `http://localhost:3000`
- **Mobile Android Application:** Download the official `SLLAS.apk` signed package from the Ministry Portal or Google Play Store.
- **Mobile iOS Application:** Install via Apple TestFlight or App Store by searching "SLLAS Zimbabwe".

### 2.3 User Accounts & Role Permissions Overview

```
┌───────────────────────────┬────────────────────────────────────────────────────────┐
│ Role                      │ Primary Responsibilities & Permitted Portals           │
├───────────────────────────┼────────────────────────────────────────────────────────┤
│ Citizen / Farmer          │ Self-registration, GIS farm browsing, application     │
│ (Role.CLIENT)             │ submission, lease offer acceptance, deed verification. │
├───────────────────────────┼────────────────────────────────────────────────────────┤
│ Resettlement Officer      │ Cadastre demarcation, boundary upload, verification,   │
│ (Role.REGISTRY_OFFICER)   │ applicant scoring, allocation workbench matching.     │
├───────────────────────────┼────────────────────────────────────────────────────────┤
│ Estates Officer           │ Master waiting list curation, 99-year lease agreement  │
│ (Role.ESTATES_OFFICER)    │ generation, deed printing with ministerial seal.       │
├───────────────────────────┼────────────────────────────────────────────────────────┤
│ Land Board Approver       │ Statutory review docket, approving allocations,        │
│ (Role.APPROVER)           │ returning dockets for correction, ministerial appeals. │
├───────────────────────────┼────────────────────────────────────────────────────────┤
│ Compliance Auditor        │ Immutable audit ledger inspection, quota compliance,   │
│ (Role.AUDITOR)            │ anti-corruption oversight, executive reporting.        │
├───────────────────────────┼────────────────────────────────────────────────────────┤
│ System Administrator      │ Staff provisioning, jurisdiction office assignment,   │
│ (Role.SYSTEM_ADMIN)       │ security lockout management, platform maintenance.     │
└───────────────────────────┴────────────────────────────────────────────────────────┘
```

---

<div style="page-break-after: always;"></div>

## 3. CITIZEN & FARMER USER GUIDE

### 3.1 Citizen Self-Registration (14 Statutory KYC Fields)
Citizens wishing to apply for agricultural state land must complete statutory registration under the Agricultural Land Settlement Act.

```
Web Portal Navigation: https://isllas.onrender.com/signin?mode=register
Mobile App Navigation: Welcome Screen ──► "Register New Account"
```

The system requires exactly **14 statutory fields**:

1. **Surname:** Citizen's legal family name (as recorded on National ID card).
2. **First Name:** Citizen's legal given name.
3. **Other Names:** Optional middle names.
4. **Gender:** Select **Male** or **Female** (determines 30% Women's affirmative quota).
5. **Title:** Select `Mr.`, `Mrs.`, `Ms.`, `Miss`, or `Dr.`.
6. **Date of Birth:** Select date (YYYY-MM-DD). Automatically verifies age for the 20% Youth quota (18 to 35 years).
7. **National ID Number:** Standard Zimbabwean format (e.g., `63-123456-X-42` or `08-234567-Y-12`).
8. **Upload National ID:** Attach scanned PDF or camera photo of the metal or plastic National ID bio-page.
9. **Marital Status:** Select `Single`, `Married`, `Divorced`, or `Widowed`.
10. **Citizenship:** Verified Zimbabwean 🇿🇼 (auto-detected and locked upon ID document verification).
11. **Phone Number:** E.164 mobile contact number (e.g., `+263 77 123 4567`) for SMS alert dispatches.
12. **Residential Address:** Physical domicile, farm stand, or village dwelling.
13. **Email Address:** Optional email address for electronic dispatch of formal lease agreements.
14. **Farmer Category:** Select statutory resettlement category:
    - *War Veteran / War Collaborator*
    - *Uniformed Forces*
    - *Business Person*
    - *Youth [35 years and below]*
    - *Civil Servant*
    - *MP / Senator*
    - *ZEPDRA*
    - *Ordinary Citizen*
    - *Others [specify]* (provides custom specification field)

### 3.2 Pre-Submission Verification & Certification
Before an account can be committed to the national database, SLLAS initiates a **Mandatory Pre-Submission Review**:
1. Review all 14 entered fields on the confirmation grid.
2. Ensure national ID number, spelling of legal names, and contact telephone numbers match uploaded documents.
3. Check the legal declaration checkbox:
   > *"I solemnly declare under penalty of perjury and statutory sanction under the Agricultural Land Settlement Act [Cap 20:01] that the particulars supplied are true and correct."*
4. Click **Confirm & Create SLLAS Account**.

> [!IMPORTANT]
> To preserve the integrity of national land records, once an account is established, **Full Legal Names**, **National ID Number**, **Gender**, and **Citizenship** cannot be altered without physical validation at a Provincial Ministry Office.

### 3.3 Signing In & Multi-Factor Security
1. Navigate to the Sign In screen (`/signin`).
2. Enter your registered **Email or Username** and **Password**.
3. Select your designated role (default: **Citizen / Farmer**).
4. Click **Sign In to SLLAS**.
5. *Security Lockout Protection:* Entering 5 consecutive incorrect passwords triggers a statutory **5-minute cooldown period**. The screen displays a live countdown timer until retry is permitted.

---

### 3.4 Exploring Zimbabwe Farmland (Satellite, Terrain & Roads GIS)
SLLAS provides an interactive, full-country spatial GIS explorer (`/parcels` on Web or the **Map View** tab on Mobile).

```
Navigation: Main Navigation Bar ──► "Spatial Cadastre" or "/parcels"
```

#### Selecting Basemap Views
Use the floating basemap mode selector in the top-right corner of the map:
- **🛰️ Satellite View (Default):** High-resolution true-color aerial photography showing actual crop rows, centre pivots, rivers, and homesteads. Check the **Road & Town Labels** box to overlay national highways and town names.
- **⛰️ Terrain View:** Topographic shaded relief displaying mountain ranges (Eastern Highlands, Chimanimani, Great Dyke), elevation contours, and river drainage basins.
- **🛣️ Roads & Highways:** Street map displaying Zimbabwe's highway corridors (Highways A1 to A9, Chirundu, Beitbridge, Plumtree, Mutare) and farm access feeder tracks.
- **🗺️ Cadastre Dark:** High-contrast dark background for survey beacon contrast and nighttime inspection.

#### Map Quick Navigation Actions
- **`+` / `−` Buttons:** Smoothly zoom in and out of provinces and farming wards.
- **`Reset Zim`:** Instantly re-centres the viewport to display the entire Republic of Zimbabwe.
- **`🚜 Focus Farms`:** Instantly zooms to fit all active, surveyed agricultural farm subdivisions.
- **Coordinates Readout:** Live cursor tracker in the bottom-right showing WGS 84 GPS coordinates (`Lat ...° S | Lon ...° E`).

---

### 3.5 Inspecting Farm Subdivisions & Cadastral Dossiers
SLLAS features 16 authoritative farm subdivisions across Zimbabwe's 10 provinces:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FARM SUBDIVISION DOSSIER                        │
├────────────────────────────────────────────────────────────────────────┤
│ Status: [AVAILABLE]                     Ref: ZW-MSW-CHE-0044           │
│ Name:   Coburn Estate • Subdiv 1        Scheme: Coburn Master Scheme   │
│ Lot:    Subdivision 1 of Lot 4          Diagram: DSG-ZW-2026-CHG-0082  │
│ Admin:  Chegutu District, Ward 12       Province: Mashonaland West     │
├────────────────────────────────────────────────────────────────────────┤
│ Hectares: 245.5 ha                      Natural Region: Region IIA     │
│ Soil:     Arable Red Clay / Loam        Water: Manyame River Riparian  │
│ Power:    Grid Connected (1.2 km)       Access: All-weather gravel     │
├────────────────────────────────────────────────────────────────────────┤
│ Permitted Uses: Commercial Grain, Wheat, Seed Maize, Silo Storage      │
│ Restrictions:   Statutory 30m riparian environmental buffer on Manyame │
│ Survey Beacons: BC-CHE-101, BC-CHE-102, BC-CHE-103, BC-CHE-104        │
└────────────────────────────────────────────────────────────────────────┘
```

1. Click any highlighted green or amber farm subdivision polygon on the map.
2. A detailed inspection popup displays the scheme name, lot number, hectarage, and surveyor diagram reference.
3. Click **Inspect Full Farm Cadastre Dossier →** to view environmental buffer zones, water rights, and permitted agricultural rotations.
4. Click **Apply for Lease Allocation** to begin the application process for that specific parcel.

---

### 3.6 Applying for an Agricultural Land Lease
When you find a land parcel or subdivision marked **AVAILABLE**, lodge an application through the 5-step wizard:

```
Step 1: Personal KYC Verification
   │── Verify National ID, Farmer Category & Quota Eligibility
Step 2: Land Particulars & Zoning
   │── Confirm Province, District, Ward, Target Hectarage & Intended Enterprise
Step 3: Farm Production Business Plan
   │── Detail Planned Crops/Livestock, Expected Yield, Cropping Calendar
Step 4: Financial & Capital Resource Declaration
   │── Declare Available Tractors, Implements, Boreholes & Bank Capital
Step 5: Statutory Declarations & Affirmation
   └── Affirm "One-Person-One-Farm" compliance under penalty of law
```

1. **Step 1 — Identity Verification:** Confirms your validated KYC profile.
2. **Step 2 — Land Particulars:** Displays the parcel reference number (`ZW-MSW-CHE-0044`), province, district, and zoning classification (A1 Settlement, A2 Commercial, or Peri-Urban).
3. **Step 3 — 5-Year Farm Plan:** Detail your proposed agricultural operations:
   - Primary enterprise (e.g., Irrigated Wheat, Seed Maize, Citrus, Dairy, Beef Cattle).
   - Expected annual output (tonnes / head of livestock).
   - Employment creation projections for local rural communities.
4. **Step 4 — Machinery & Capital Declaration:** Declare movable assets, tractors, combine harvesters, irrigation pipes, and working capital lines to prove productive capability.
5. **Step 5 — Statutory Affirmation:** Affirm under the Land Commission Act that you do not hold any other agricultural state lease.
6. Click **Submit Application to District Land Registry**.

### 3.7 Tracking Application Progress & Master Waiting List Position
Navigate to **Applications & Waiting List** (`/client/applications` on Web or the **My Leases** tab on Mobile):

```
┌────────────────────────────────────────────────────────────────────────┐
│ APPLICATION STATUS TRACKER                                             │
├────────────────────────────────────────────────────────────────────────┤
│ Ref: APP-2026-0842                      Target: Coburn Estate Subdiv 1 │
│                                                                        │
│  [✓] SUBMITTED ──► [✓] INSPECTION ──► [●] BOARD DOCKET ──► [ ] OFFER   │
│      15 Mar 2026       02 Apr 2026        In Review                    │
│                                                                        │
│ Master Waiting List Position: #14 (Mashonaland West Commercial Queue) │
│ Affirmative Action Priority: Youth Quota Verified (Score: 88/100)      │
└────────────────────────────────────────────────────────────────────────┘
```

- **SUBMITTED:** Application lodged into the provincial electronic docket.
- **UNDER_INSPECTION:** Resettlement Officer has reviewed documents and conducted cadastral validation.
- **BOARD_REVIEW:** Land Board is evaluating suitability scoring and statutory quotas.
- **ALLOCATED:** Land parcel successfully allocated; offer letter generated.
- **ACTIVE:** 99-Year lease executed, digitally signed, and registered.

### 3.8 Receiving Offers, Accepting Leases & 99-Year Bankable Documents
When your application is approved:
1. You will receive an SMS alert and email notification.
2. Navigate to **Offers & Leases** (`/client/leases`).
3. Click **Review Official Offer Letter**.
4. The offer specifies annual statutory lease rentals, development conditions, and environmental maintenance covenants.
5. Click **Accept Lease Offer & Execute 99-Year Agreement**.

### 3.9 Verifying Leases via Cryptographic QR Seals
Every official lease generated through SLLAS contains a cryptographic QR code:
1. Scan the QR code using any smartphone camera or the SLLAS Mobile App scanner.
2. The browser navigates directly to the sovereign verification gateway (`/verify/lease/[id]`).
3. The page displays the official verification certificate:
   - Gold Zimbabwean Coat of Arms emblem.
   - Verification status: `OFFICIAL STATUTORY RECORD — VERIFIED VALID`.
   - Lessee legal name and national ID number.
   - Department of the Surveyor-General survey diagram reference.
   - 99-Year lease term commencement and expiration dates.
   - SHA-256 cryptographic tamper-evident signature hash.

---

<div style="page-break-after: always;"></div>

## 4. RESETTLEMENT OFFICER USER GUIDE (WEB CONSOLE)

The Resettlement Officer (`Role.REGISTRY_OFFICER`) administers district land parcels, verifies boundary demarcation, scores incoming citizen applications, and prepares allocation recommendations.

### 4.1 Officer Dashboard Overview & Key Performance Indicators
Upon signing in at `/officer`, the dashboard displays 7 live command cards:

```
┌───────────────────┬───────────────────┬───────────────────┬───────────────────┐
│ Registered Farms  │ Available Farms   │ Applications Rec. │ Pending Review    │
│       1,420       │        384        │       2,840       │        142        │
├───────────────────┼───────────────────┼───────────────────┼───────────────────┤
│ Active Leases     │ Expiring Soon     │ Dispatched Alerts │ Quota Compliance  │
│        892        │         18        │       5,120       │   96.4% Met       │
└───────────────────┴───────────────────┴───────────────────┴───────────────────┘
```

### 4.2 Registering New Land Parcels (4-Step Cadastre Wizard)
Navigate to **Register Land Parcel** (`/parcels/new`):

#### Step 1: Location & Administrative Jurisdiction
- **Parcel Reference Number:** Auto-generated or manual entry (e.g., `ZW-MW-CHE-0088`). Real-time validation checks against duplicate registrations across all 10 provinces.
- **Farm / Scheme Name:** Official cadastral name (e.g., `Coburn Estate • Section 4`).
- **Province, District & Ward:** Select jurisdictional administrative areas from the statutory dropdown menus.
- **Land Classification:** Select tenure scheme (A1 Settlement, A2 Commercial 99-Year, Peri-Urban Commercial, or Agro-Industrial).

#### Step 2: Agro-Ecological Characteristics
- **Total Area (Hectares):** Enter demarcated hectarage (e.g., `310.5`).
- **Natural Agro-Ecological Region:** Select Region I, IIA, IIB, III, IV, or V.
- **Soil Classification:** Select dominant soil type (Heavy Clay, Red Clay, Loam, Sandy Loam, Kalahari Sand, or Alluvial).
- **Water Access & Sources:** Specify riparian rights, dams, or commercial boreholes.
- **Electricity & Infrastructure:** Record grid proximity (km) and road access type (Tar, All-weather gravel, or Dirt track).

#### Step 3: Spatial Boundary Demarcation (GIS Polygon)
- Enter surveyor polygon coordinates in `[[lng, lat], [lng, lat], ...]` format (EPSG:4326).
- SLLAS automatically calculates:
  - Coordinate closure (first and last vertex must match).
  - Territorial bounding box validation (ensuring the farm is entirely inside Zimbabwe's borders).
  - Intersection checks against existing registered parcel polygons to prevent double-allocation conflicts.
- Corner beacons (`BC-XX`) automatically populate on the interactive satellite preview map.

#### Step 4: Review & Final Registration
- Review the cadastral dossier summary.
- Choose **Save as Draft** (for unverified preliminary surveys) or **Submit for Final Verification**.

### 4.3 Bulk Cadastre Parcel Import via CSV
For large provincial resettlement schemes, navigate to **Bulk Import** (`/parcels/bulk-import`):
1. Prepare a standard UTF-8 CSV file with statutory headers:
   `referenceNumber,name,province,district,ward,areaHectares,naturalRegion,soilType,coordinates`
2. Drag and drop the CSV into the upload pane.
3. Click **Perform Dry-Run Validation**. SLLAS validates all geometries, bounds, and references without modifying the live database.
4. Once the dry run reports `Valid Count: 100%`, click **Commit Parcels to National Cadastre**.

### 4.4 Land Allocation Workbench & Affirmative Action Quotas
Navigate to **Allocation Workbench** (`/officer/allocate`):
1. Select an unallocated parcel marked **AVAILABLE**.
2. SLLAS runs the automated **Allocation Suitability Algorithm**:
   - **Agro-Ecological Alignment Score (40 pts):** Matches applicant experience with parcel crop zoning.
   - **Capital & Implement Readiness Score (30 pts):** Evaluates declared machinery and financial backing.
   - **Affirmative Action Quota Bonus (30 pts):** Awards statutory points for Youth (20% reserve) and Women farmers (30% reserve).
3. The system presents the ranked waiting list docket.
4. Select the top-ranked applicant and click **Generate Allocation Recommendation Docket**.
5. The docket forwards directly to the **Land Board Approver Queue**.

---

<div style="page-break-after: always;"></div>

## 5. ESTATES OFFICER USER GUIDE (WEB CONSOLE)

The Estates Officer (`Role.ESTATES_OFFICER`) is responsible for managing the Master Waiting List and generating legally binding 99-year lease agreements.

### 5.1 Master Waiting List Administration
Navigate to **Master Waiting List** (`/estates/waiting-list`):
- Filter applications across all 10 provinces.
- Sort applicants by lodging date, seniority points, and affirmative action category.
- Export certified provincial waiting lists to CSV for official gazetting under Section 8 of the Agricultural Land Settlement Act.

### 5.2 Generating 99-Year Bankable Agricultural Leases
Navigate to **Lease Generator** (`/estates/leases`):
1. View all dockets with status `APPROVED_BY_BOARD`.
2. Click **Generate Formal Lease Agreement**.
3. SLLAS binds the applicant metadata, parcel cadastral diagram, and statutory terms:
   - **Statutory Act:** Agricultural Land Settlement Act [Cap 20:01].
   - **Term:** 99 Years (Bankable, Transferable upon Ministerial Consent).
   - **Annual Rentals:** Calculated per hectare according to Natural Region economic rates.
   - **Survey Diagram Reference:** Assigned from the Department of the Surveyor-General (`DSG-ZW-2026-XXX`).
   - **Beacon Coordinates:** Lat/Lon perimeter points locked into the agreement schedule.
4. Click **Issue Official Lease Offer**.

### 5.3 Printing Statutory Lease Deeds with Legal Emblems & Seal
Navigate to `/estates/leases/[id]/print`:
- Features the official **Republic of Zimbabwe Coat of Arms** header.
- Formatted in statutory legal styling with official indentation, numbered clauses, and witness signature lines.
- Renders the live cryptographic **Verification Seal & QR Code** in the top-right corner.
- Click **Print Statutory Lease Deed (A4 Format)** or press `Ctrl + P` to produce a court-ready PDF.

---

<div style="page-break-after: always;"></div>

## 6. LAND BOARD APPROVER USER GUIDE (WEB CONSOLE)

The Land Board Approver (`Role.APPROVER`) exercises senior statutory authority over allocations, leases, and policy adherence.

### 6.1 Board Approvals Docket & Application Queue
Navigate to **Board Approvals** (`/approver`):
- Displays all dockets submitted by District Resettlement Officers.
- Highlights affirmative quota tracking indicators:
  - Youth Quota: Target 20% | Current 22.4% (Compliant)
  - Women Quota: Target 30% | Current 31.8% (Compliant)

### 6.2 Reviewing Land Allocation Recommendations
Click on any application to open the **Full Board Docket**:
1. **Applicant Particulars:** Full KYC biography, farmer category, and declared capital.
2. **Target Parcel Dossier:** Polygon boundary on satellite imagery, soil suitability, and water rights.
3. **Suitability Score Breakdown:** Inspect algorithmic scores and officer notes.
4. **Constitutional Compliance Check:** SLLAS automatically verifies that neither the applicant nor their registered spouse holds another active agricultural lease ("One-Person-One-Farm" check).

### 6.3 Approving, Amending, or Rejecting Leases
- **Approve Allocation:** Authorises the generation of a 99-Year Lease Offer. Click **Approve Allocation Docket**.
- **Request Clarification / Changes:** Returns the docket to the Resettlement Officer with specific instructions (e.g., *"Provide updated borehole yield certificate"*).
- **Reject Allocation:** Denies the allocation. Mandatory written legal remarks must be entered into the statutory audit log.

---

<div style="page-break-after: always;"></div>

## 7. NATIONAL COMPLIANCE AUDITOR USER GUIDE

The Compliance Auditor (`Role.AUDITOR`) exercises read-only oversight across all cadastral and allocation events to prevent corruption and double-allocations.

### 7.1 Accessing the Immutable Audit Trail
Navigate to **Audit Trail** (`/audit`):
- Displays a real-time cryptographic ledger of every system event.
- Every entry records:
  - Timestamp (UTC & CAT).
  - Actor Identity (Email, User ID, and Staff Role).
  - Entity Type (`PARCEL`, `APPLICATION`, `LEASE`, `USER`, `AUTH`).
  - Action (`CREATE`, `UPDATE`, `ALLOCATE`, `APPROVE`, `LOGIN_FAILED`).
  - SHA-256 Checksum Signature.

### 7.2 Searching & Filtering Statutory Actions
- Filter by actor email to trace specific officer transactions.
- Filter by parcel reference number (`ZW-MSW-CHE-0044`) to inspect the complete history of an estate from initial demarcation through multiple tenant generations.
- Export filtered audit logs to signed CSV for submission to the **Zimbabwe Land Commission** or Parliament.

---

<div style="page-break-after: always;"></div>

## 8. SYSTEM ADMINISTRATOR USER GUIDE

The System Administrator (`Role.SYSTEM_ADMIN`) manages system configuration, staff accounts, and platform security.

### 8.1 Staff Account Provisioning & Role Assignments
Navigate to **User Management** (`/admin/users`):
1. Click **+ Provision Staff Account**.
2. Enter official government email (`...@sllas.gov.zw`), first name, and surname.
3. Assign administrative role:
   - `Role.REGISTRY_OFFICER`
   - `Role.ESTATES_OFFICER`
   - `Role.APPROVER`
   - `Role.AUDITOR`
   - `Role.SYSTEM_ADMIN`
4. Assign provincial jurisdiction (e.g., `Mashonaland West`).
5. SLLAS dispatches an activation credential dispatch to the staff member.

### 8.2 Security Monitoring, Lock-outs & Account Recovery
- If an officer or citizen triggers a security lockout (5 failed attempts), administrators can view the lockout status under the user details pane.
- Click **Reset Security Lockout & Issue Temporary Password** to restore access following official identity verification.

---

<div style="page-break-after: always;"></div>

## 9. MOBILE APPLICATION SPECIFIC OPERATIONS

The SLLAS Mobile App (`apps/mobile`) provides field-optimized tools for farmers and resettlement officers.

```
┌─────────────────────────────────────────────────────────────┐
│ SLLAS MOBILE NAVIGATION DOCK (56px)                         │
│                                                             │
│   [Home]     [Search]     [Map View]     [My Leases]  [Menu]│
│     🏠          🔍            🗺️             📜         ☰   │
└─────────────────────────────────────────────────────────────┘
```

### 9.1 Offline Operation & Synchronization
- Cadastral boundaries, farm schemes, and user application statuses are cached locally on the device using SQLite and AsyncStorage.
- In rural wards with no cellular network, farmers and officers can view previously loaded farm polygons and draft applications.
- When an internet connection is re-established, the app automatically syncs drafted records with the central cloud database.

### 9.2 Mobile Settings, Font Sizing & Dark Mode
Navigate to **Menu ──► Settings**:
- **Accounts & Profile:** View profile details (National ID, Full Legal Names, Gender, and Citizenship are statutory locked).
- **Behavior & Performance:**
  - Toggle Push Notifications for application status changes.
  - Dark / Light Mode selector.
  - Font Size adjustments for outdoor sunlight readability.
  - Language selection: English, Shona, and Ndebele.
- **Support & Feedback:** Send feedback, access FAQs, and rate the application.
- **App Info:** View software version (`v0.2.0`), developer credits, and statutory notices.

---

<div style="page-break-after: always;"></div>

## 10. TROUBLESHOOTING & HELPDESK SUPPORT

### 10.1 Frequently Encountered Operational Issues

| Issue / Symptom | Probable Cause | Recommended Resolution |
| :--- | :--- | :--- |
| **"API KEY REQUIRED" watermark on map** | Deprecated CARTO map tile URLs | Ensure the latest version (`v0.2.0`) is loaded. SLLAS now uses keyless Esri Satellite, Terrain, and OSM endpoints. |
| **"Unable to load account data" error** | Backend API container offline or unreachable | The app now automatically falls back to your active session. Click **Retry Account Sync** or switch roles via the Portal dropdown. |
| **"Account Locked Out for 5 Minutes"** | 5 consecutive incorrect password entries | Wait for the 300-second timer to expire, or contact a System Administrator to reset your credentials. |
| **"Boundary coordinate overlap detected"** | Farm polygon overlaps with another registered parcel | Inspect corner beacon coordinates. Ensure boundary vertices do not intersect adjacent surveyed estate polygons. |
| **GPS coordinates outside Zimbabwe** | Inverted Latitude/Longitude coordinates | Ensure coordinates follow the standard `[Longitude, Latitude]` format: Longitude between `25.0° E` and `33.5° E`; Latitude between `-22.5° S` and `-15.5° S`. |

### 10.2 Contacting the Ministry Support Desk

For operational assistance, land disputes, or technical support:

- **Ministry Directorate:** Department of Spatial Cadastre & Land Administration
- **Physical Address:** Block 2, Makombe Complex, Harare, Republic of Zimbabwe
- **National Toll-Free Helpline:** `0800 222 5263` (0800 AAA LAND)
- **Official Support Email:** `support@sllas.gov.zw` / `cadastre@lands.gov.zw`
- **Hours of Operation:** Monday to Friday, 07:45 – 16:45 CAT

---

**End of Official User Operational Manual**  
*Republic of Zimbabwe &bull; Ministry of Lands, Agriculture, Fisheries, Water & Rural Development &bull; 2026*
