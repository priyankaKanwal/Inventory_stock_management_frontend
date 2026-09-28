import { currentUser } from './auth-state';
import {
  ALL_ROLES,
  AppRole,
  INVENTORY_MANAGER_ROLE,
  INVENTORY_STAFF_ROLE,
  MANAGER_ROLES,
  ORDER_MANAGER_ROLE,
  ORDER_STAFF_ROLE,
  STAFF_ROLES,
  SUPER_ADMIN_ROLE
} from './role-model';

export {
  ALL_ROLES,
  AppRole,
  INVENTORY_MANAGER_ROLE,
  INVENTORY_STAFF_ROLE,
  MANAGER_ROLES,
  ORDER_MANAGER_ROLE,
  ORDER_STAFF_ROLE,
  STAFF_ROLES,
  SUPER_ADMIN_ROLE,
  parseRole
} from './role-model';

export const ROUTE_ROLES: Record<string, AppRole[]> = {
  superAdmin: [SUPER_ADMIN_ROLE],
  managers: [SUPER_ADMIN_ROLE, ...MANAGER_ROLES],
  inventory: [SUPER_ADMIN_ROLE, INVENTORY_MANAGER_ROLE],
  orders: [SUPER_ADMIN_ROLE, ORDER_MANAGER_ROLE, ORDER_STAFF_ROLE, INVENTORY_MANAGER_ROLE],
  predictions: [SUPER_ADMIN_ROLE, ORDER_MANAGER_ROLE, ORDER_STAFF_ROLE, INVENTORY_MANAGER_ROLE],
  products: [SUPER_ADMIN_ROLE, INVENTORY_MANAGER_ROLE, INVENTORY_STAFF_ROLE, ORDER_MANAGER_ROLE],
  everyone: ALL_ROLES
};

export function currentRole(): AppRole | null {
  return currentUser()?.role ?? null;
}

export function hasRoles(...roles: AppRole[]): boolean {

  const role = currentRole();

  return role !== null && roles.includes(role);
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
// by their assigned tasks (see the task-access util).
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