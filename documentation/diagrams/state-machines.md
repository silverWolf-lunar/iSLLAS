# SLLAS State Machine Diagrams

## 1. Land Parcel Status

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Officer creates parcel

    DRAFT --> PENDING_VERIFICATION : Officer submits for verification
    DRAFT --> WITHDRAWN : Officer withdraws

    PENDING_VERIFICATION --> AVAILABLE : Different officer verifies
    PENDING_VERIFICATION --> DRAFT : Verifier returns for corrections
    PENDING_VERIFICATION --> WITHDRAWN : Officer withdraws

    AVAILABLE --> RESERVED : Application submitted
    AVAILABLE --> WITHDRAWN : Admin withdraws
    AVAILABLE --> DISPUTED : Dispute raised

    RESERVED --> ALLOCATED : Application approved
    RESERVED --> AVAILABLE : Application rejected/withdrawn
    RESERVED --> DISPUTED : Dispute raised

    ALLOCATED --> LEASED : Lease agreement signed
    ALLOCATED --> AVAILABLE : Lease offer not accepted (timeout)
    ALLOCATED --> DISPUTED : Dispute raised

    LEASED --> AVAILABLE : Lease expired (no renewal)
    LEASED --> LEASED : Lease renewed
    LEASED --> DISPUTED : Dispute raised

    WITHDRAWN --> DRAFT : Re-opened by officer
    DISPUTED --> AVAILABLE : Dispute resolved
    DISPUTED --> WITHDRAWN : Dispute results in withdrawal

    note right of DRAFT : Boundary, attributes, photos\nCan be edited freely
    note right of PENDING_VERIFICATION : Read-only for registering officer\nDifferent officer must verify
    note right of AVAILABLE : Publicly visible in search\nCan receive applications
    note right of RESERVED : Held for an active application\nNot shown in public search
    note right of ALLOCATED : Application approved\nOffer letter issued
    note right of LEASED : Active lease agreement\nNot available for other applications
    note left of WITHDRAWN : Removed from system\nCan be re-opened
    note left of DISPUTED : Frozen pending resolution\nNo new applications accepted
```

### Parcel Status Transition Rules

| From | To | Allowed Roles | Conditions |
|------|-----|---------------|------------|
| — | DRAFT | Registry Officer | New parcel registration |
| DRAFT | PENDING_VERIFICATION | Registry Officer | All required fields filled, boundary valid |
| PENDING_VERIFICATION | AVAILABLE | Registry Officer | Different officer from registerer, no overlaps |
| PENDING_VERIFICATION | DRAFT | Registry Officer | Verifier can return with notes |
| AVAILABLE | RESERVED | System | Triggered when application is submitted for this parcel |
| RESERVED | ALLOCATED | System | Triggered when application is approved |
| RESERVED | AVAILABLE | System | Triggered when application is rejected or withdrawn |
| ALLOCATED | LEASED | System | Triggered when lease agreement is signed |
| ALLOCATED | AVAILABLE | System | Offer timeout or not accepted |
| LEASED | AVAILABLE | System | Lease expired, scheduled job |
| Any | WITHDRAWN | Registry Officer, Admin | Manual withdrawal with reason |
| Any | DISPUTED | Registry Officer, Admin | Dispute raised with documentation |
| WITHDRAWN | DRAFT | Registry Officer | Re-open for editing |
| DISPUTED | AVAILABLE / WITHDRAWN | Admin | Dispute resolution |

---

## 2. Lease Application Status

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Client starts application

    DRAFT --> SUBMITTED : Client submits
    DRAFT --> WITHDRAWN : Client withdraws

    SUBMITTED --> UNDER_REVIEW : Officer picks up
    SUBMITTED --> WITHDRAWN : Client withdraws

    UNDER_REVIEW --> INFO_REQUESTED : Officer requests more info
    UNDER_REVIEW --> SITE_INSPECTION : Officer schedules inspection
    UNDER_REVIEW --> APPROVED : Approver approves
    UNDER_REVIEW --> REJECTED : Approver rejects
    UNDER_REVIEW --> WITHDRAWN : Client withdraws

    INFO_REQUESTED --> UNDER_REVIEW : Client provides info
    INFO_REQUESTED --> WITHDRAWN : Client withdraws

    SITE_INSPECTION --> UNDER_REVIEW : Inspection complete
    SITE_INSPECTION --> WITHDRAWN : Client withdraws

    APPROVED --> OFFER_ISSUED : System generates offer letter
    APPROVED --> WITHDRAWN : Admin withdraws (exceptional)

    OFFER_ISSUED --> ACCEPTED : Client accepts offer
    OFFER_ISSUED --> REJECTED : Client declines / offer expires
    OFFER_ISSUED --> WITHDRAWN : Admin withdraws (exceptional)

    ACCEPTED --> AGREEMENT_SIGNED : Signed agreement uploaded
    ACCEPTED --> WITHDRAWN : Client withdraws

    AGREEMENT_SIGNED --> ACTIVE : Lease record created

    REJECTED --> [*]
    WITHDRAWN --> [*]
    ACTIVE --> [*]

    note right of DRAFT : Client can save partial\napplication and resume later
    note right of SUBMITTED : Assigned to officer\nSLA timer starts
    note right of UNDER_REVIEW : Officer reviews docs,\nparcel suitability
    note right of INFO_REQUESTED : Client notified,\nSLA paused
    note right of SITE_INSPECTION : Physical visit scheduled\nInspection report required
    note right of APPROVED : Segregation of duties:\nReviewer ≠ Approver
    note right of OFFER_ISSUED : PDF offer letter generated\nTime-limited acceptance
    note right of ACTIVE : Lease record created\nParcel status → LEASED
```

### Application Status Transition Rules

| From | To | Allowed Roles | Conditions |
|------|-----|---------------|------------|
| — | DRAFT | Client | Parcel must be AVAILABLE |
| DRAFT | SUBMITTED | Client | All required fields, documents, valid client profile |
| SUBMITTED | UNDER_REVIEW | Registry Officer | Officer assigned (auto or manual), same jurisdiction |
| UNDER_REVIEW | INFO_REQUESTED | Registry Officer | Specify what info is needed |
| INFO_REQUESTED | UNDER_REVIEW | Client | Upload/provide requested info |
| UNDER_REVIEW | SITE_INSPECTION | Registry Officer | Schedule date, assign inspector |
| SITE_INSPECTION | UNDER_REVIEW | Registry Officer | Inspection report filed |
| UNDER_REVIEW | APPROVED | Approver | Approver ≠ reviewing officer, within jurisdiction |
| UNDER_REVIEW | REJECTED | Approver | Reason required |
| APPROVED | OFFER_ISSUED | System | PDF generated and sent to client |
| OFFER_ISSUED | ACCEPTED | Client | Within acceptance deadline |
| OFFER_ISSUED | REJECTED | System/Admin | Deadline expired or client declines |
| ACCEPTED | AGREEMENT_SIGNED | Client/Officer | Signed document uploaded |
| AGREEMENT_SIGNED | ACTIVE | System | Lease record created, parcel → LEASED |
| Any (except ACTIVE) | WITHDRAWN | Client/Admin | Reason logged |

### Segregation of Duties

The system enforces that `application.assigned_officer_id ≠ application.assigned_approver_id`. The approval endpoint checks this at the service layer and returns `403 Forbidden` if the same user attempts both review and approval.

---

## 3. Lease Lifecycle

```mermaid
stateDiagram-v2
    [*] --> ACTIVE : Lease created from application

    ACTIVE --> EXPIRING_SOON : Scheduled job (threshold reached)

    EXPIRING_SOON --> RENEWAL_REQUESTED : Client requests renewal
    EXPIRING_SOON --> EXPIRED : End date passed, no renewal

    ACTIVE --> RENEWAL_REQUESTED : Client requests early renewal
    ACTIVE --> TERMINATED : Early termination approved
    ACTIVE --> SUSPENDED : Suspension (dispute, violation)

    RENEWAL_REQUESTED --> RENEWED : Approver approves renewal
    RENEWAL_REQUESTED --> EXPIRED : Renewal rejected, lease expired

    RENEWED --> ACTIVE : New lease period begins
    EXPIRED --> [*] : Parcel → AVAILABLE or review

    SUSPENDED --> ACTIVE : Suspension lifted
    SUSPENDED --> TERMINATED : Termination during suspension

    TERMINATED --> [*] : Parcel → AVAILABLE

    note right of ACTIVE : Normal operating state\nRent obligations in effect
    note right of EXPIRING_SOON : Notifications at 180, 90, 60, 30, 7 days\nClient can request renewal
    note right of RENEWAL_REQUESTED : Renewal application under review\nExisting lease remains active
    note right of RENEWED : New lease created\nOld lease archived
    note right of EXPIRED : Parcel returned to AVAILABLE\nAutomatic via scheduled job
    note right of SUSPENDED : Frozen pending investigation\nNo renewal allowed
    note right of TERMINATED : Early end of lease\nParcel returned to AVAILABLE
```

### Lease Expiry Notification Schedule (Configurable)

| Days Before Expiry | Notification Type | Channels |
|-------------------|-------------------|----------|
| 180 | Early reminder | In-app, Email |
| 90 | Renewal reminder | In-app, Email, SMS |
| 60 | Urgent reminder | In-app, Email, SMS, Push |
| 30 | Final warning | All channels |
| 7 | Last chance | All channels |
| 0 | Expired | All channels |

### Lease Status Transition Rules

| From | To | Trigger | Conditions |
|------|-----|---------|------------|
| — | ACTIVE | System | Application reaches ACTIVE, lease created |
| ACTIVE | EXPIRING_SOON | Scheduled Job | Days to expiry ≤ first threshold |
| ACTIVE/EXPIRING_SOON | RENEWAL_REQUESTED | Client | Renewal request submitted |
| RENEWAL_REQUESTED | RENEWED | Approver | New lease period, terms accepted |
| RENEWAL_REQUESTED | EXPIRED | Approver/System | Renewal rejected + lease expired |
| EXPIRING_SOON | EXPIRED | Scheduled Job | End date passed |
| ACTIVE | TERMINATED | Approver | Early termination approved |
| ACTIVE | SUSPENDED | Admin/Approver | Cause documented |
| SUSPENDED | ACTIVE | Admin/Approver | Suspension lifted |
| SUSPENDED | TERMINATED | Admin/Approver | Termination during suspension |
| EXPIRED/TERMINATED | — | System | Parcel status → AVAILABLE (or review) |

---

## 4. Client Profile Verification

```mermaid
stateDiagram-v2
    [*] --> UNVERIFIED : Client registers

    UNVERIFIED --> PENDING : Client uploads ID documents
    PENDING --> VERIFIED : Officer verifies documents
    PENDING --> REJECTED : Officer rejects (invalid/mismatch)
    REJECTED --> PENDING : Client re-uploads corrected docs

    note right of UNVERIFIED : Can browse but cannot apply
    note right of PENDING : Documents under officer review
    note right of VERIFIED : Can submit applications
    note right of REJECTED : Must re-upload documents
```

---

## 5. File Upload & Scanning

```mermaid
stateDiagram-v2
    [*] --> UPLOAD_INTENT : Client requests upload URL

    UPLOAD_INTENT --> UPLOADING : Client uploads to signed URL
    UPLOADING --> PENDING_SCAN : Upload complete, webhook received
    PENDING_SCAN --> CLEAN : Malware scan passed
    PENDING_SCAN --> INFECTED : Malware detected
    CLEAN --> AVAILABLE : File linked to entity
    INFECTED --> QUARANTINED : File quarantined, user notified
```
