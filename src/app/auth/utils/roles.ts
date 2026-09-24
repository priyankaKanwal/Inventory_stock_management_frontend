export type AppRole =
  | 'SUPER_ADMIN'
  | 'INVENTORY_MANAGER'
  | 'ORDER_MANAGER'
  | 'INVENTORY_STAFF'
  | 'ORDER_STAFF';

export const SUPER_ADMIN_ROLE: AppRole = 'SUPER_ADMIN';
export const INVENTORY_MANAGER_ROLE: AppRole = 'INVENTORY_MANAGER';
export const ORDER_MANAGER_ROLE: AppRole = 'ORDER_MANAGER';
export const INVENTORY_STAFF_ROLE: AppRole = 'INVENTORY_STAFF';
export const ORDER_STAFF_ROLE: AppRole = 'ORDER_STAFF';

export const ALL_ROLES: AppRole[] = [
  SUPER_ADMIN_ROLE,
  INVENTORY_MANAGER_ROLE,
  ORDER_MANAGER_ROLE,
  INVENTORY_STAFF_ROLE,
  ORDER_STAFF_ROLE
];

export const MANAGER_ROLES: AppRole[] = [
  INVENTORY_MANAGER_ROLE,
  ORDER_MANAGER_ROLE
];

export const STAFF_ROLES: AppRole[] = [
  INVENTORY_STAFF_ROLE,
  ORDER_STAFF_ROLE
];

export const ROUTE_ROLES: Record<string, AppRole[]> = {
  superAdmin: [SUPER_ADMIN_ROLE],
  managers: [SUPER_ADMIN_ROLE, ...MANAGER_ROLES],
  inventory: [SUPER_ADMIN_ROLE, INVENTORY_MANAGER_ROLE],
  orders: [SUPER_ADMIN_ROLE, ORDER_MANAGER_ROLE, ORDER_STAFF_ROLE, INVENTORY_MANAGER_ROLE],
  predictions: [SUPER_ADMIN_ROLE, ORDER_MANAGER_ROLE, ORDER_STAFF_ROLE, INVENTORY_MANAGER_ROLE],
  products: [SUPER_ADMIN_ROLE, INVENTORY_MANAGER_ROLE, INVENTORY_STAFF_ROLE, ORDER_MANAGER_ROLE],
  everyone: ALL_ROLES
};

export function currentRole(): AppRole {
  return (
    (localStorage.getItem('role') || 'ORDER_STAFF').toUpperCase() as AppRole
  );
}

export function hasRoles(...roles: AppRole[]): boolean {
  return roles.includes(currentRole());
}

export function isSuperAdmin(): boolean {
  return currentRole() === SUPER_ADMIN_ROLE;
}

export function isInventoryManager(): boolean {
  return currentRole() === INVENTORY_MANAGER_ROLE;
}

export function isOrderManager(): boolean {
  return currentRole() === ORDER_MANAGER_ROLE;
}

export function isInventoryStaff(): boolean {
  return currentRole() === INVENTORY_STAFF_ROLE;
}

export function isOrderStaff(): boolean {
  return currentRole() === ORDER_STAFF_ROLE;
}

export function isManager(): boolean {
  return hasRoles(SUPER_ADMIN_ROLE, ...MANAGER_ROLES);
}

export function isStaff(): boolean {
  return hasRoles(...STAFF_ROLES);
}

// Staff roles have narrow portfolio-wide permissions and are gated per-record
// by their assigned tasks (see TaskCoverageService).
export function isWorker(): boolean {
  return isStaff();
}

// Portfolio-wide inventory write access
export function canManageInventory(): boolean {
  return isSuperAdmin() || isInventoryManager();
}

// View the products catalog (order staff excluded)
export function canViewProducts(): boolean {
  return isSuperAdmin() || isInventoryManager() || isInventoryStaff() || isOrderManager();
}

export function canManageCategories(): boolean {
  return isSuperAdmin() || isInventoryManager();
}

export function canManageSuppliers(): boolean {
  return isSuperAdmin() || isInventoryManager();
}

export function canManageOrders(): boolean {
  return isSuperAdmin() || isOrderManager();
}

export function canViewOrders(): boolean {
  return isSuperAdmin() || isOrderManager() || isOrderStaff() || isInventoryManager();
}

export function canTransitionOrderStatus(): boolean {
  return isSuperAdmin() || isOrderManager() || isOrderStaff();
}

export function canManageCustomers(): boolean {
  return isSuperAdmin() || isOrderManager();
}

export function canManageTasks(): boolean {
  return isSuperAdmin() || isManager();
}

export function canViewPredictions(): boolean {
  return isSuperAdmin() || isOrderManager() || isOrderStaff() || isInventoryManager();
}

export function hasFullInventoryAccess(): boolean {
  return canManageInventory();
}

export function roleLabel(role: string): string {
  return (role || '').toUpperCase().replace(/_/g, ' ');
}