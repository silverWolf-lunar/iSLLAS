# SLLAS Permission Matrix

## RBAC Model

- **Role-Based Access Control (RBAC)** with **jurisdiction scoping**
- Officers are scoped to a specific office (province or district)
- Jurisdiction is enforced at the **backend service layer** on every query and mutation
- Segregation of duties: reviewer ≠ approver for the same application

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Full access |
| 📖 | Read only |
| 🔒 | Own records only |
| 🌐 | Public (rate-limited, limited fields) |
| 🏛️ | Within jurisdiction only |
| ❌ | No access |
| ⚡ | System/automated only |

---

## 1. User & Access Management

| Operation | System Admin | Registry Officer | Approver | Auditor | Client |
|-----------|:---:|:---:|:---:|:---:|:---:|
| List users | ✅ | 🏛️ | 🏛️ | 📖 | ❌ |
| Create user | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit user | ✅ | ❌ | ❌ | ❌ | 🔒 |
| Deactivate user | ✅ | ❌ | ❌ | ❌ | ❌ |
| Assign roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage offices | ✅ | ❌ | ❌ | ❌ | ❌ |
| View audit log | ✅ | ❌ | ❌ | 📖 | ❌ |

## 2. Land Parcels

| Operation | System Admin | Registry Officer | Approver | Auditor | Client | Public |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|
| Search parcels (full) | ✅ | 🏛️ | 🏛️ | 📖 | ✅ | ❌ |
| Search parcels (limited) | ✅ | 🏛️ | 🏛️ | 📖 | ✅ | 🌐 |
| View parcel detail | ✅ | 🏛️ | 🏛️ | 📖 | ✅ | 🌐 |
| Create parcel (DRAFT) | ❌ | 🏛️ | ❌ | ❌ | ❌ | ❌ |
| Edit parcel (DRAFT) | ❌ | 🏛️ | ❌ | ❌ | ❌ | ❌ |
| Submit for verification | ❌ | 🏛️ | ❌ | ❌ | ❌ | ❌ |
| Verify parcel | ❌ | 🏛️ ¹ | ❌ | ❌ | ❌ | ❌ |
| Withdraw parcel | ✅ | 🏛️ | ❌ | ❌ | ❌ | ❌ |
| Flag as disputed | ✅ | 🏛️ | ✅ | ❌ | ❌ | ❌ |
| Resolve dispute | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Upload parcel files | ❌ | 🏛️ | ❌ | ❌ | ❌ | ❌ |
| Bulk import parcels | ❌ | 🏛️ | ❌ | ❌ | ❌ | ❌ |
| View parcel history | ✅ | 🏛️ | 🏛️ | 📖 | ❌ | ❌ |

¹ Verifying officer must be different from the registering officer.

## 3. Client Profiles

| Operation | System Admin | Registry Officer | Approver | Auditor | Client |
|-----------|:---:|:---:|:---:|:---:|:---:|
| Create profile | ❌ | ❌ | ❌ | ❌ | 🔒 |
| View own profile | ❌ | ❌ | ❌ | ❌ | 🔒 |
| Edit own profile | ❌ | ❌ | ❌ | ❌ | 🔒 |
| View client profiles | ✅ | 🏛️ | 🏛️ | 📖 | ❌ |
| Upload documents | ❌ | ❌ | ❌ | ❌ | 🔒 |
| Verify client documents | ❌ | 🏛️ | ❌ | ❌ | ❌ |
| Reject client documents | ❌ | 🏛️ | ❌ | ❌ | ❌ |

## 4. Lease Applications

| Operation | System Admin | Registry Officer | Approver | Auditor | Client |
|-----------|:---:|:---:|:---:|:---:|:---:|
| Create application (DRAFT) | ❌ | ❌ | ❌ | ❌ | 🔒 |
| Edit draft application | ❌ | ❌ | ❌ | ❌ | 🔒 |
| Submit application | ❌ | ❌ | ❌ | ❌ | 🔒 |
| List all applications | ✅ | 🏛️ | 🏛️ | 📖 | 🔒 |
| View application detail | ✅ | 🏛️ | 🏛️ | 📖 | 🔒 |
| Assign to officer | ✅ | 🏛️ | ❌ | ❌ | ❌ |
| Review application | ❌ | 🏛️ ² | ❌ | ❌ | ❌ |
| Request more info | ❌ | 🏛️ | ❌ | ❌ | ❌ |
| Provide requested info | ❌ | ❌ | ❌ | ❌ | 🔒 |
| Schedule inspection | ❌ | 🏛️ | ❌ | ❌ | ❌ |
| File inspection report | ❌ | 🏛️ | ❌ | ❌ | ❌ |
| Approve application | ❌ | ❌ | 🏛️ ³ | ❌ | ❌ |
| Reject application | ❌ | ❌ | 🏛️ ³ | ❌ | ❌ |
| Withdraw application | ✅ | ❌ | ❌ | ❌ | 🔒 |
| Accept offer | ❌ | ❌ | ❌ | ❌ | 🔒 |
| Upload signed agreement | ❌ | ❌ | ❌ | ❌ | 🔒 |
| View application history | ✅ | 🏛️ | 🏛️ | 📖 | 🔒 |
| Upload documents | ❌ | 🏛️ | ❌ | ❌ | 🔒 |

² Reviewing officer must be in the same jurisdiction as the parcel.
³ Approver must be different from the reviewing officer (segregation of duties).

## 5. Leases

| Operation | System Admin | Registry Officer | Approver | Auditor | Client |
|-----------|:---:|:---:|:---:|:---:|:---:|
| List leases | ✅ | 🏛️ | 🏛️ | 📖 | 🔒 |
| View lease detail | ✅ | 🏛️ | 🏛️ | 📖 | 🔒 |
| Create lease (from application) | ❌ | ❌ | ❌ | ❌ | ❌ ⚡ |
| Request renewal | ❌ | ❌ | ❌ | ❌ | 🔒 |
| Approve renewal | ❌ | ❌ | 🏛️ | ❌ | ❌ |
| Reject renewal | ❌ | ❌ | 🏛️ | ❌ | ❌ |
| Terminate lease | ❌ | ❌ | 🏛️ | ❌ | ❌ |
| Suspend lease | ✅ | ❌ | 🏛️ | ❌ | ❌ |
| Lift suspension | ✅ | ❌ | 🏛️ | ❌ | ❌ |
| Upload lease documents | ❌ | 🏛️ | ❌ | ❌ | 🔒 |
| Download lease agreement | ✅ | 🏛️ | 🏛️ | 📖 | 🔒 |

## 6. Recommendations

| Operation | System Admin | Registry Officer | Approver | Auditor | Client |
|-----------|:---:|:---:|:---:|:---:|:---:|
| Run recommendation | ✅ | 🏛️ | 🏛️ | ❌ | ✅ |
| View recommendation results | ✅ | 🏛️ | 🏛️ | 📖 | 🔒 |
| Manage activity profiles | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit recommendation rules | ✅ | ❌ | ❌ | ❌ | ❌ |
| View recommendation history | ✅ | ❌ | ❌ | 📖 | 🔒 |

## 7. Notifications

| Operation | System Admin | Registry Officer | Approver | Auditor | Client |
|-----------|:---:|:---:|:---:|:---:|:---:|
| View own notifications | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mark as read | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit preferences | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage templates | ✅ | ❌ | ❌ | ❌ | ❌ |
| View delivery log | ✅ | ❌ | ❌ | 📖 | ❌ |

## 8. Reports & Admin

| Operation | System Admin | Registry Officer | Approver | Auditor | Client |
|-----------|:---:|:---:|:---:|:---:|:---:|
| View dashboards | ✅ | 🏛️ | 🏛️ | 📖 | ❌ |
| Export reports | ✅ | 🏛️ | 🏛️ | 📖 | ❌ |
| View audit trail | ✅ | ❌ | ❌ | 📖 | ❌ |
| Manage land categories | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage system settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage feature flags | ✅ | ❌ | ❌ | ❌ | ❌ |

## Jurisdiction Scoping Rules

1. **Registry Officer** and **Approver** are assigned to an `office`, which is linked to an `admin_area` (province or district).
2. Every query and mutation checks `user.office.admin_area_id` against the parcel's `province_id` or `district_id`.
3. **National-level** offices can see all provinces. **Provincial offices** see their province. **District offices** see their district only.
4. System Admin has no jurisdiction restriction (national scope).
5. Clients see only their own records, regardless of jurisdiction.
6. Auditors have read-only access to all records (national scope).

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Public parcel search | 30 requests | 1 minute |
| Login attempts | 5 attempts | 15 minutes |
| Password recovery | 3 attempts | 1 hour |
| Application submission | 10 submissions | 1 hour per client |
| File upload | 20 uploads | 1 hour per user |
| Recommendation runs | 10 runs | 1 hour per user |
| API (authenticated) | 300 requests | 1 minute |
