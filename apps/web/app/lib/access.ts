import { Role } from '@sllas/contracts';

export interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

export const ROLE_CONFIG: Record<
  Role,
  {
    displayName: string;
    description: string;
    defaultDashboard: string;
    navItems: NavItem[];
  }
> = {
  [Role.CLIENT]: {
    displayName: 'Client / Citizen',
    description: 'Citizen farmer and land applicant portal',
    defaultDashboard: '/client',
    navItems: [
      { label: 'Client Overview', href: '/client' },
      { label: 'Browse Parcels', href: '/parcels' },
      { label: 'KYC & ID Documents', href: '/client/kyc' },
      { label: 'Applications & Waiting List', href: '/client/applications' },
      { label: 'Offers & Leases', href: '/client/leases' },
    ],
  },
  [Role.REGISTRY_OFFICER]: {
    displayName: 'Resettlement Officer',
    description: 'Cadastre registration, verification and allocation',
    defaultDashboard: '/officer',
    navItems: [
      { label: 'Resettlement Dashboard', href: '/officer' },
      { label: 'Parcel Explorer', href: '/parcels' },
      { label: '+ Register Parcel', href: '/parcels/new' },
      { label: 'Verification Workbench', href: '/parcels/verify' },
      { label: 'Bulk Import', href: '/parcels/bulk-import' },
      { label: 'Applicant Review Queue', href: '/officer/applicants' },
      { label: 'Allocation Workbench', href: '/officer/allocate' },
    ],
  },
  [Role.ESTATES_OFFICER]: {
    displayName: 'Estates Officer',
    description: 'Master waiting lists and legal lease documentation',
    defaultDashboard: '/estates',
    navItems: [
      { label: 'Estates Dashboard', href: '/estates' },
      { label: 'Master Waiting List', href: '/estates/waiting-list' },
      { label: 'Lease Generator & Printer', href: '/estates/leases' },
      { label: 'Parcel Explorer', href: '/parcels' },
    ],
  },
  [Role.SYSTEM_ADMIN]: {
    displayName: 'System Administrator',
    description: 'Full national platform administration',
    defaultDashboard: '/admin',
    navItems: [
      { label: 'System Admin Dashboard', href: '/admin' },
      { label: 'User & Staff Management', href: '/admin/users' },
      { label: 'Registry Offices', href: '/admin/offices' },
      { label: 'Parcel Explorer', href: '/parcels' },
      { label: 'Reports & Analytics', href: '/reports' },
      { label: 'Settings', href: '/settings' },
    ],
  },
  [Role.APPROVER]: {
    displayName: 'Resettlement Officer',
    description: 'Cadastre registration, verification and allocation',
    defaultDashboard: '/officer',
    navItems: [
      { label: 'Resettlement Dashboard', href: '/officer' },
      { label: 'Parcel Explorer', href: '/parcels' },
      { label: 'Applicant Review Queue', href: '/officer/applicants' },
      { label: 'Allocation Workbench', href: '/officer/allocate' },
    ],
  },
  [Role.AUDITOR]: {
    displayName: 'System Administrator',
    description: 'Full national platform administration',
    defaultDashboard: '/admin',
    navItems: [
      { label: 'System Admin Dashboard', href: '/admin' },
      { label: 'User & Staff Management', href: '/admin/users' },
      { label: 'Parcel Explorer', href: '/parcels' },
      { label: 'Reports & Analytics', href: '/reports' },
    ],
  },
};

export const PRIMARY_DASHBOARDS: Array<{
  role: Role;
  displayName: string;
  defaultDashboard: string;
}> = [
  { role: Role.SYSTEM_ADMIN, displayName: 'System Administrator', defaultDashboard: '/admin' },
  { role: Role.REGISTRY_OFFICER, displayName: 'Resettlement Officer', defaultDashboard: '/officer' },
  { role: Role.ESTATES_OFFICER, displayName: 'Estates Officer', defaultDashboard: '/estates' },
  { role: Role.CLIENT, displayName: 'Client / Citizen', defaultDashboard: '/client' },
];

export const ROUTE_PERMISSIONS: Array<{
  pattern: RegExp;
  allowedRoles: Role[];
}> = [
  // Public/Shared
  { pattern: /^\/signin$/, allowedRoles: Object.values(Role) },
  { pattern: /^\/register$/, allowedRoles: Object.values(Role) },
  { pattern: /^\/verify(\/.*)?$/, allowedRoles: Object.values(Role) },
  { pattern: /^\/settings$/, allowedRoles: Object.values(Role) },
  { pattern: /^\/parcels$/, allowedRoles: Object.values(Role) },
  { pattern: /^\/parcels\/[^/]+$/, allowedRoles: Object.values(Role) },

  // Client Portal
  { pattern: /^\/client(\/.*)?$/, allowedRoles: [Role.CLIENT, Role.SYSTEM_ADMIN] },

  // Officer Workbench
  {
    pattern: /^\/officer(\/.*)?$/,
    allowedRoles: [Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN],
  },
  {
    pattern: /^\/parcels\/new$/,
    allowedRoles: [Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN],
  },
  {
    pattern: /^\/parcels\/verify$/,
    allowedRoles: [Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN],
  },
  {
    pattern: /^\/parcels\/bulk-import$/,
    allowedRoles: [Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN],
  },

  // Approver Portal
  {
    pattern: /^\/approver(\/.*)?$/,
    allowedRoles: [Role.APPROVER, Role.SYSTEM_ADMIN],
  },

  // Estates Officer Portal
  {
    pattern: /^\/estates(\/.*)?$/,
    allowedRoles: [Role.ESTATES_OFFICER, Role.SYSTEM_ADMIN],
  },

  // Admin Portal
  {
    pattern: /^\/admin(\/.*)?$/,
    allowedRoles: [Role.SYSTEM_ADMIN],
  },

  // Audit
  {
    pattern: /^\/audit(\/.*)?$/,
    allowedRoles: [Role.SYSTEM_ADMIN, Role.AUDITOR],
  },

  // Reports
  {
    pattern: /^\/reports(\/.*)?$/,
    allowedRoles: [Role.SYSTEM_ADMIN, Role.AUDITOR, Role.REGISTRY_OFFICER, Role.APPROVER, Role.ESTATES_OFFICER],
  },

  // Public Landing Page (Root)
  {
    pattern: /^\/$/,
    allowedRoles: Object.values(Role),
  },
];

export function canAccessRoute(role: Role, pathname: string): boolean {
  const match = ROUTE_PERMISSIONS.find(r => r.pattern.test(pathname));
  if (!match) return true; // Default allow if not constrained
  return match.allowedRoles.includes(role);
}

export function getDefaultDashboardForRole(role: Role): string {
  return ROLE_CONFIG[role]?.defaultDashboard || '/parcels';
}
