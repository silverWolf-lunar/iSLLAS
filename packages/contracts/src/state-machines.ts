// ─────────────────────────────────────────────────────────────
// SLLAS State Machine Transition Maps
// Defines valid state transitions for enforcement in the API
// ─────────────────────────────────────────────────────────────

import { ParcelStatus, ApplicationStatus, LeaseStatus, Role } from './enums';

// ─── Parcel State Machine ───

export interface TransitionRule {
  allowedRoles: Role[];
  conditions?: string[]; // Human-readable conditions for documentation
}

export const PARCEL_TRANSITIONS: Record<
  ParcelStatus,
  Partial<Record<ParcelStatus, TransitionRule>>
> = {
  [ParcelStatus.DRAFT]: {
    [ParcelStatus.PENDING_VERIFICATION]: {
      allowedRoles: [Role.REGISTRY_OFFICER],
      conditions: ['All required fields filled', 'Boundary geometry is valid'],
    },
    [ParcelStatus.WITHDRAWN]: {
      allowedRoles: [Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN],
    },
  },
  [ParcelStatus.PENDING_VERIFICATION]: {
    [ParcelStatus.AVAILABLE]: {
      allowedRoles: [Role.REGISTRY_OFFICER],
      conditions: ['Verifier must be different from registerer', 'No overlapping boundaries'],
    },
    [ParcelStatus.DRAFT]: {
      allowedRoles: [Role.REGISTRY_OFFICER],
      conditions: ['Verifier returns with correction notes'],
    },
    [ParcelStatus.WITHDRAWN]: {
      allowedRoles: [Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN],
    },
  },
  [ParcelStatus.AVAILABLE]: {
    [ParcelStatus.RESERVED]: {
      allowedRoles: [], // System-triggered when application is submitted
      conditions: ['Triggered by application submission'],
    },
    [ParcelStatus.WITHDRAWN]: {
      allowedRoles: [Role.SYSTEM_ADMIN],
    },
    [ParcelStatus.DISPUTED]: {
      allowedRoles: [Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN],
    },
  },
  [ParcelStatus.RESERVED]: {
    [ParcelStatus.ALLOCATED]: {
      allowedRoles: [], // System-triggered when application is approved
      conditions: ['Triggered by application approval'],
    },
    [ParcelStatus.AVAILABLE]: {
      allowedRoles: [], // System-triggered when application is rejected/withdrawn
      conditions: ['Triggered by application rejection or withdrawal'],
    },
    [ParcelStatus.DISPUTED]: {
      allowedRoles: [Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN],
    },
  },
  [ParcelStatus.ALLOCATED]: {
    [ParcelStatus.LEASED]: {
      allowedRoles: [], // System-triggered when lease agreement signed
      conditions: ['Triggered by lease agreement signing'],
    },
    [ParcelStatus.AVAILABLE]: {
      allowedRoles: [], // System-triggered on offer timeout
      conditions: ['Offer not accepted within deadline'],
    },
    [ParcelStatus.DISPUTED]: {
      allowedRoles: [Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN],
    },
  },
  [ParcelStatus.LEASED]: {
    [ParcelStatus.AVAILABLE]: {
      allowedRoles: [], // System-triggered on lease expiry
      conditions: ['Lease expired, no renewal'],
    },
    [ParcelStatus.DISPUTED]: {
      allowedRoles: [Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN],
    },
  },
  [ParcelStatus.WITHDRAWN]: {
    [ParcelStatus.DRAFT]: {
      allowedRoles: [Role.REGISTRY_OFFICER],
      conditions: ['Re-open for editing'],
    },
  },
  [ParcelStatus.DISPUTED]: {
    [ParcelStatus.AVAILABLE]: {
      allowedRoles: [Role.SYSTEM_ADMIN],
      conditions: ['Dispute resolved in favour of availability'],
    },
    [ParcelStatus.WITHDRAWN]: {
      allowedRoles: [Role.SYSTEM_ADMIN],
      conditions: ['Dispute results in withdrawal'],
    },
  },
};

// ─── Application State Machine ───

export const APPLICATION_TRANSITIONS: Record<
  ApplicationStatus,
  Partial<Record<ApplicationStatus, TransitionRule>>
> = {
  [ApplicationStatus.DRAFT]: {
    [ApplicationStatus.SUBMITTED]: {
      allowedRoles: [Role.CLIENT],
      conditions: ['All required fields filled', 'Documents uploaded', 'Client profile verified'],
    },
    [ApplicationStatus.WITHDRAWN]: {
      allowedRoles: [Role.CLIENT],
    },
  },
  [ApplicationStatus.SUBMITTED]: {
    [ApplicationStatus.UNDER_REVIEW]: {
      allowedRoles: [Role.REGISTRY_OFFICER],
      conditions: ['Officer assigned to application'],
    },
    [ApplicationStatus.WITHDRAWN]: {
      allowedRoles: [Role.CLIENT, Role.SYSTEM_ADMIN],
    },
  },
  [ApplicationStatus.UNDER_REVIEW]: {
    [ApplicationStatus.INFO_REQUESTED]: {
      allowedRoles: [Role.REGISTRY_OFFICER],
      conditions: ['Specify what information is needed'],
    },
    [ApplicationStatus.SITE_INSPECTION]: {
      allowedRoles: [Role.REGISTRY_OFFICER],
      conditions: ['Inspection date and inspector assigned'],
    },
    [ApplicationStatus.APPROVED]: {
      allowedRoles: [Role.APPROVER],
      conditions: ['Approver ≠ reviewing officer', 'Within jurisdiction'],
    },
    [ApplicationStatus.REJECTED]: {
      allowedRoles: [Role.APPROVER],
      conditions: ['Reason required', 'Approver ≠ reviewing officer'],
    },
    [ApplicationStatus.WITHDRAWN]: {
      allowedRoles: [Role.CLIENT, Role.SYSTEM_ADMIN],
    },
  },
  [ApplicationStatus.INFO_REQUESTED]: {
    [ApplicationStatus.UNDER_REVIEW]: {
      allowedRoles: [Role.CLIENT],
      conditions: ['Client provides requested information'],
    },
    [ApplicationStatus.WITHDRAWN]: {
      allowedRoles: [Role.CLIENT, Role.SYSTEM_ADMIN],
    },
  },
  [ApplicationStatus.SITE_INSPECTION]: {
    [ApplicationStatus.UNDER_REVIEW]: {
      allowedRoles: [Role.REGISTRY_OFFICER],
      conditions: ['Inspection report filed'],
    },
    [ApplicationStatus.WITHDRAWN]: {
      allowedRoles: [Role.CLIENT, Role.SYSTEM_ADMIN],
    },
  },
  [ApplicationStatus.APPROVED]: {
    [ApplicationStatus.OFFER_ISSUED]: {
      allowedRoles: [], // System-triggered
      conditions: ['Offer letter PDF generated'],
    },
    [ApplicationStatus.WITHDRAWN]: {
      allowedRoles: [Role.SYSTEM_ADMIN],
      conditions: ['Exceptional — admin override only'],
    },
  },
  [ApplicationStatus.REJECTED]: {
    // Terminal state — no transitions out
  },
  [ApplicationStatus.OFFER_ISSUED]: {
    [ApplicationStatus.ACCEPTED]: {
      allowedRoles: [Role.CLIENT],
      conditions: ['Within acceptance deadline'],
    },
    [ApplicationStatus.REJECTED]: {
      allowedRoles: [Role.CLIENT, Role.SYSTEM_ADMIN],
      conditions: ['Client declines or deadline expires'],
    },
    [ApplicationStatus.WITHDRAWN]: {
      allowedRoles: [Role.SYSTEM_ADMIN],
      conditions: ['Exceptional — admin override only'],
    },
  },
  [ApplicationStatus.ACCEPTED]: {
    [ApplicationStatus.AGREEMENT_SIGNED]: {
      allowedRoles: [Role.CLIENT, Role.REGISTRY_OFFICER],
      conditions: ['Signed agreement document uploaded'],
    },
    [ApplicationStatus.WITHDRAWN]: {
      allowedRoles: [Role.CLIENT, Role.SYSTEM_ADMIN],
    },
  },
  [ApplicationStatus.AGREEMENT_SIGNED]: {
    [ApplicationStatus.ACTIVE]: {
      allowedRoles: [], // System-triggered
      conditions: ['Lease record created', 'Parcel status → LEASED'],
    },
  },
  [ApplicationStatus.ACTIVE]: {
    // Terminal state — managed through lease lifecycle
  },
  [ApplicationStatus.WITHDRAWN]: {
    // Terminal state — no transitions out
  },
};

// ─── Lease State Machine ───

export const LEASE_TRANSITIONS: Record<
  LeaseStatus,
  Partial<Record<LeaseStatus, TransitionRule>>
> = {
  [LeaseStatus.ACTIVE]: {
    [LeaseStatus.EXPIRING_SOON]: {
      allowedRoles: [], // System-triggered (scheduled job)
      conditions: ['Days to expiry ≤ first threshold (default 180)'],
    },
    [LeaseStatus.RENEWAL_REQUESTED]: {
      allowedRoles: [Role.CLIENT],
      conditions: ['Early renewal request'],
    },
    [LeaseStatus.TERMINATED]: {
      allowedRoles: [Role.APPROVER, Role.SYSTEM_ADMIN],
      conditions: ['Early termination with reason'],
    },
    [LeaseStatus.SUSPENDED]: {
      allowedRoles: [Role.APPROVER, Role.SYSTEM_ADMIN],
      conditions: ['Dispute or violation documented'],
    },
  },
  [LeaseStatus.EXPIRING_SOON]: {
    [LeaseStatus.RENEWAL_REQUESTED]: {
      allowedRoles: [Role.CLIENT],
    },
    [LeaseStatus.EXPIRED]: {
      allowedRoles: [], // System-triggered (scheduled job)
      conditions: ['End date has passed, no renewal'],
    },
  },
  [LeaseStatus.RENEWAL_REQUESTED]: {
    [LeaseStatus.RENEWED]: {
      allowedRoles: [Role.APPROVER],
      conditions: ['Renewal approved, new lease created'],
    },
    [LeaseStatus.EXPIRED]: {
      allowedRoles: [Role.APPROVER],
      conditions: ['Renewal rejected and lease has expired'],
    },
  },
  [LeaseStatus.RENEWED]: {
    [LeaseStatus.ACTIVE]: {
      allowedRoles: [], // System-triggered — new lease begins
      conditions: ['New lease period starts'],
    },
  },
  [LeaseStatus.EXPIRED]: {
    // Terminal state — parcel returned to AVAILABLE
  },
  [LeaseStatus.SUSPENDED]: {
    [LeaseStatus.ACTIVE]: {
      allowedRoles: [Role.APPROVER, Role.SYSTEM_ADMIN],
      conditions: ['Suspension lifted'],
    },
    [LeaseStatus.TERMINATED]: {
      allowedRoles: [Role.APPROVER, Role.SYSTEM_ADMIN],
      conditions: ['Termination during suspension'],
    },
  },
  [LeaseStatus.TERMINATED]: {
    // Terminal state — parcel returned to AVAILABLE
  },
};

// ─── Utility: Validate Transition ───

export function isValidTransition<T extends string>(
  transitions: Record<T, Partial<Record<T, TransitionRule>>>,
  fromStatus: T,
  toStatus: T,
): boolean {
  const fromMap = transitions[fromStatus];
  if (!fromMap) return false;
  return toStatus in fromMap;
}

export function getTransitionRule<T extends string>(
  transitions: Record<T, Partial<Record<T, TransitionRule>>>,
  fromStatus: T,
  toStatus: T,
): TransitionRule | null {
  const fromMap = transitions[fromStatus];
  if (!fromMap) return null;
  return (fromMap as Record<T, TransitionRule>)[toStatus] ?? null;
}

export function getAllowedTransitions<T extends string>(
  transitions: Record<T, Partial<Record<T, TransitionRule>>>,
  fromStatus: T,
): T[] {
  const fromMap = transitions[fromStatus];
  if (!fromMap) return [];
  return Object.keys(fromMap) as T[];
}
