export type AppRole =
  | 'SUPER_ADMIN'
  | 'ADMIN_MANAGER'
  | 'STAFF_MANAGER'
  | 'ADMIN'
  | 'STAFF';

export const ALL_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_MANAGER',
  'STAFF_MANAGER',
  'ADMIN',
  'STAFF'
];

export const SUPER_ADMIN_ROLE: AppRole = 'SUPER_ADMIN';

export const MANAGER_ROLES: AppRole[] = [
  'ADMIN_MANAGER',
  'STAFF_MANAGER'
];

export const WORKER_ROLES: AppRole[] = [
  'ADMIN',
  'STAFF'
];

export const ROUTE_ROLES: Record<string, AppRole[]> = {
  superAdmin: [SUPER_ADMIN_ROLE],
  managers: [SUPER_ADMIN_ROLE, ...MANAGER_ROLES],
  everyone: ALL_ROLES
};

export function currentRole(): AppRole {
  return (
    (localStorage.getItem('role') || 'STAFF').toUpperCase() as AppRole
  );
}

export function hasRoles(...roles: AppRole[]): boolean {
  return roles.includes(currentRole());
}

export function isSuperAdmin(): boolean {
  return currentRole() === SUPER_ADMIN_ROLE;
}

export function isManager(): boolean {
  return hasRoles(SUPER_ADMIN_ROLE, ...MANAGER_ROLES);
}

export function isWorker(): boolean {
  return hasRoles(...WORKER_ROLES);
}

export function hasFullInventoryAccess(): boolean {
  return isManager() || isSuperAdmin();
}

export function roleLabel(role: string): string {
  return (role || 'STAFF').toUpperCase().replace(/_/g, ' ');
}