# Inventory & Stock Management System - Frontend Documentation

Comprehensive architecture, component design, role-based authorization (RBAC), task-based access control (ABAC), API integrations, and developer guide for the **Inventory & Stock Management** client application.

---

## 📑 Table of Contents
1. [Application Overview & Architecture](#application-overview--architecture)
2. [Role-Based Access Control (RBAC) & Task ABAC](#role-based-access-control-rbac--task-abac)
   - [User Roles & Permissions Matrix](#1-user-roles--permissions-matrix)
   - [Attribute-Based Access Control (ABAC) in the UI](#2-attribute-based-access-control-abac-in-the-ui)
   - [Manager-Staff Domain Separation](#3-manager-staff-domain-separation)
3. [Routing Architecture & Route Guards](#routing-architecture--route-guards)
4. [Feature Modules Deep Dive](#feature-modules-deep-dive)
   - [Authentication (`/login`, `/register`)](#1-authentication)
   - [Dashboard (`/dashboard`)](#2-dashboard)
   - [Products & Stock Control (`/products`)](#3-products--stock-control)
   - [Categories & Suppliers (`/categories`, `/suppliers`)](#4-categories--suppliers)
   - [Customers (`/customers`)](#5-customers)
   - [Orders & Lifecycle State Machine (`/orders`)](#6-orders--lifecycle-state-machine)
   - [AI / ML Delivery ETA Prediction (`/predictions` & Orders)](#7-ai--ml-delivery-eta-prediction)
   - [Task Delegation & My Tasks (`/tasks`)](#8-task-delegation--my-tasks)
   - [Team & User Administration (`/admin/users`)](#9-team--user-administration)
5. [State Management & Core Services](#state-management--core-services)
6. [API Integration & Backend Contracts](#api-integration--backend-contracts)
7. [Environment Configuration & Deployment](#environment-configuration--deployment)

---

## Application Overview & Architecture

The frontend is a single-page application (SPA) built with **Angular 17**, utilizing **Tailwind CSS**, **RxJS**, and **TypeScript**. It is designed with modularity, responsive typography, modern glassmorphism UI elements, and strict security guards.

```
src/app/
├── auth/                       # Authentication pages, JWT state, route guards & RBAC helpers
│   ├── guards/                 # auth.guard.ts, role.guard.ts
│   ├── pages/                  # login.component, register.component
│   └── utils/                  # role-auth.ts, auth-state.ts, role-model.ts
│
├── layout/                     # Application shell
│   ├── sidebar/                # Dynamic role-filtered navigation
│   ├── topbar/                 # User avatar, role badges, notifications, logout
│   └── layout/                 # Main wrapper component with router-outlet
│
├── features/                   # Lazy-loaded feature modules
│   ├── dashboard/              # Inventory analytics, valuation, alerts
│   ├── products/               # Product list, filters, stock adjustment modal, forms
│   ├── categories/             # Category management with soft-delete
│   ├── suppliers/              # Supplier management with contact details
│   ├── customers/              # Customer management (ABAC-gated for order staff)
│   ├── orders/                 # Order creation, live item totals, status progression
│   ├── predictions/            # ML delivery prediction dashboard & calculator
│   ├── tasks/                  # Task assignment (Manage Tasks) & Staff duty list (My Tasks)
│   └── users/                  # Super Admin user management & manager teams
│
└── services/                   # Injectable HTTP services communicating with FastAPI
    ├── api.service.ts          # Base HTTP client with headers & error handling
    ├── auth.service.ts         # Login, register, logout, token refresh
    ├── session.service.ts      # Active session management & current user signals
    ├── product.service.ts      # Product CRUD & stock IN/OUT adjustments
    ├── category.service.ts     # Category endpoints
    ├── supplier.service.ts     # Supplier endpoints
    ├── customers.service.ts    # Customer endpoints
    ├── order.service.ts        # Order endpoints & status updates
    ├── prediction.service.ts   # XGBoost ETA prediction endpoints
    ├── task.service.ts         # Manager task creation & staff task updates
    └── user.service.ts         # User list & role updates
```

---

## Role-Based Access Control (RBAC) & Task ABAC

### 1. User Roles & Permissions Matrix

The application provides fine-grained access across 5 distinct roles:

| Feature / Action | `SUPER_ADMIN` | `INVENTORY_MANAGER` | `ORDER_MANAGER` | `INVENTORY_STAFF` | `ORDER_STAFF` |
|---|:---:|:---:|:---:|:---:|:---:|
| **Dashboard** | Full | Inventory metrics | Order metrics | Basic metrics | Basic metrics |
| **View Products** | Yes | Yes | Yes | Yes | No |
| **Create / Edit Products** | Unconditional | Unconditional | No | 🔒 **With Task** | No |
| **Stock Adjustments (IN/OUT)** | Yes | Yes | No | 🔒 **With Task** | No |
| **View Categories & Suppliers** | Yes | Yes | No | Yes | No |
| **Create / Edit Categories & Suppliers** | Unconditional | Unconditional | No | 🔒 **With Task** | No |
| **View Customers** | Yes | No | Yes | No | Yes |
| **Create / Edit Customers** | Unconditional | No | Unconditional | No | 🔒 **With Task** |
| **View Orders** | Yes | Yes | Yes | No | Yes |
| **Create Orders** | Unconditional | No | Unconditional | No | 🔒 **With Task** |
| **Progress Order Status** | Yes | No | Yes | No | Yes |
| **Trigger ML ETA Prediction** | Yes | Yes | Yes | No | Yes |
| **Assign Tasks (`/tasks/manage`)** | All Scopes & Staff | Inventory Scopes | Order Scopes | No | No |
| **My Tasks (`/tasks/my-tasks`)** | Yes | Yes | Yes | Yes | Yes |
| **User Management (`/admin/users`)** | Yes | No | No | No | No |

---

### 2. Attribute-Based Access Control (ABAC) in the UI

In addition to static route guards, the client enforces **Attribute-Based Access Control (ABAC)** at the component level:

1. **Staff Action Buttons are Protected**:
   - `Add Product` / `Edit Product`: Displayed for `INVENTORY_STAFF` only if `canCreateProduct(myTasks)` or `canEditProduct(product, myTasks)` evaluates to `true`.
   - `Add Category`: Displayed for `INVENTORY_STAFF` only if `canCreateCategory(myTasks)` is `true`.
   - `Add Supplier`: Displayed for `INVENTORY_STAFF` only if `canCreateSupplier(myTasks)` is `true`.
   - `Add Customer` / `Edit Customer`: Displayed for `ORDER_STAFF` only if `canCreateCustomer(myTasks)` or `canEditCustomer(customer, myTasks)` is `true`.
   - `New Order`: Displayed for `ORDER_STAFF` only if `canCreateOrder(myTasks)` is `true`.
2. **Real-time Task Synchronisation**:
   - When a staff member navigates the app, `task.service.ts` caches their active duties.
   - When a task is marked `COMPLETED` on the My Tasks page, permissions immediately expire in the UI.

---

### 3. Manager-Staff Domain Separation

The application strictly separates operational domains to prevent cross-department interference:
- **Inventory Department**:
  - `INVENTORY_MANAGER` can only assign tasks to `INVENTORY_STAFF`.
  - Available task scopes: `NONE`, `PRODUCT`, `CATEGORY`, `SUPPLIER`.
  - Linked record selection dropdown filters strictly to products, categories, or suppliers.
- **Order & Sales Department**:
  - `ORDER_MANAGER` can only assign tasks to `ORDER_STAFF`.
  - Available task scopes: `NONE`, `CUSTOMER`, `ORDER`.
  - Linked record selection dropdown filters strictly to customers or orders.
- **Super Administration**:
  - `SUPER_ADMIN` can assign any scope to any staff member.

---

## Routing Architecture & Route Guards

Navigation is guarded by `roleGuard` (`src/app/auth/guards/role.guard.ts`), which checks the user's role against the route's allowed `roles` array:

```typescript
// Route Configuration in layout-routing.module.ts
{
  path: 'products',
  canActivate: [roleGuard],
  data: { roles: [SUPER_ADMIN_ROLE, INVENTORY_MANAGER_ROLE, INVENTORY_STAFF_ROLE, ORDER_MANAGER_ROLE] },
  loadChildren: () => import('../features/products/products.module').then(m => m.ProductsModule)
},
{
  path: 'customers',
  canActivate: [roleGuard],
  data: { roles: [SUPER_ADMIN_ROLE, ORDER_MANAGER_ROLE, ORDER_STAFF_ROLE] },
  loadChildren: () => import('../features/customers/customers.module').then(m => m.CustomersModule)
},
{
  path: 'orders',
  canActivate: [roleGuard],
  data: { roles: [SUPER_ADMIN_ROLE, ORDER_MANAGER_ROLE, ORDER_STAFF_ROLE, INVENTORY_MANAGER_ROLE] },
  loadChildren: () => import('../features/orders/orders.module').then(m => m.OrdersModule)
}
```

If an unauthorized user attempts to access a protected route, `roleGuard` automatically redirects them to `/dashboard` or `/login` with an informative error toast.

---

## Feature Modules Deep Dive

### 1. Authentication
- **Location**: `src/app/auth/`
- **Endpoints**: `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/logout`.
- **Functionality**:
  - Validates user credentials.
  - Stores `access_token` and `user` payload in `localStorage` and `session.service.ts`.
  - Secure `HttpOnly` refresh token is set automatically in browser cookies.
  - Automatically redirects users to `/dashboard` upon successful login.

### 2. Dashboard
- **Location**: `src/app/features/dashboard/`
- **Features**:
  - Real-time KPI summary cards: Total Products, Total Inventory Valuation (currency formatted), Low Stock Alerts, Out of Stock Alerts.
  - Quick action buttons tailored to the user's role.
  - Recent activity stream and urgent task reminders.

### 3. Products & Stock Control
- **Location**: `src/app/features/products/`
- **Features**:
  - **Catalog Table**: SKU, Product Name, Category, Supplier, Unit Price, Stock Level, Stock Status badge (`in stock`, `low stock`, `out of stock`).
  - **Stock Adjustment Modal**:
    - Select operation: **Stock In** (receiving shipments) or **Stock Out** (dispensing inventory).
    - Requires quantity and operational reason.
    - Prevents negative stock levels on the client and handles 400 errors gracefully.
  - **Search & Filters**: Debounced instant search by SKU or name; dropdown filtering by category and supplier; paginated browsing.
  - **ABAC Protection**: "Add Product", "Edit", and "Adjust Stock" buttons appear only when authorized.

### 4. Categories & Suppliers
- **Location**: `src/app/features/categories/` and `src/app/features/suppliers/`
- **Features**:
  - CRUD operations with reactive forms.
  - Soft-delete confirmation dialogs.
  - Visible to Inventory Staff with ABAC-governed creation and update privileges.

### 5. Customers
- **Location**: `src/app/features/customers/`
- **Features**:
  - Customer contact records: Name, Email, Phone, Shipping Address.
  - Searchable customer directory.
  - **ABAC Integration**:
    - `ORDER_STAFF` can click "Add Customer" if they hold an active task with `target_type == 'CUSTOMER'`.
    - `ORDER_STAFF` can click "Edit" on a customer card if assigned to that specific customer (`target_id == customer.id`) or a type-level customer task.

### 6. Orders & Lifecycle State Machine
- **Location**: `src/app/features/orders/`
- **Features**:
  - **Order Placement Modal**:
    - Select Customer from searchable dropdown.
    - Dynamic line-item rows: Choose product, specify quantity, view unit price and live line subtotal.
    - Real-time order total computation.
    - Instant stock check: Warns if ordered quantity exceeds current warehouse inventory (will transition to `AWAITING_STOCK`).
  - **Status Progression**:
    - Visual stepper representing order states: `CONFIRMED` → `PROCESSING` → `PACKED` → `SHIPPED` → `OUT_FOR_DELIVERY` → `DELIVERED`.
    - Handles exceptions: `AWAITING_STOCK` → `SUPPLIER_ORDER_PLACED` → `STOCK_RECEIVED`.
  - **Delivery Tracking**:
    - Displays `predicted_delivery_date` and `actual_delivery_date`.
    - Includes button to trigger ML Delivery Prediction directly on individual orders.

### 7. AI / ML Delivery ETA Prediction
- **Location**: `src/app/features/predictions/` and embedded in `src/app/features/orders/`
- **Features**:
  - **One-Click Order Prediction**: On the Orders page, clicking **"Predict Delivery"** calls `POST /api/v1/predictions/orders/{order_id}`.
  - **Automated Feature Extraction**:
    The backend pulls the 9 parameters automatically:
    1. `order_date`: Placed timestamp.
    2. `order_quantity`: Sum of item quantities.
    3. `number_of_items`: Distinct line item count.
    4. `current_stock`: Warehouse inventory on-hand.
    5. `reorder_level`: Product safety stock threshold.
    6. `shortage_quantity`: Calculated stock deficit.
    7. `supplier_lead_time`: **4 days** if shortage, **2 days** if in stock.
    8. `processing_time`: **1 day** warehouse handling.
    9. `shipping_time`: **3 days** courier transit.
  - **UI Display**: Formats predicted fulfillment duration (e.g., `4.8 days`) and estimated delivery date with calendar icon and status badge.

### 8. Task Delegation & My Tasks
- **Location**: `src/app/features/tasks/`
- **Features**:
  - **Manage Tasks (`/tasks/manage`)**:
    - Accessible by `SUPER_ADMIN`, `INVENTORY_MANAGER`, and `ORDER_MANAGER`.
    - Task Form dynamically restricts scopes based on the manager's role:
      - `INVENTORY_MANAGER` sees: `NONE`, `PRODUCT`, `CATEGORY`, `SUPPLIER`.
      - `ORDER_MANAGER` sees: `NONE`, `CUSTOMER`, `ORDER`.
    - Dynamically populates the "Linked Record" dropdown with products, categories, suppliers, customers, or orders.
    - Assignee dropdown filters only to corresponding staff members.
  - **My Tasks (`/tasks/my-tasks`)**:
    - Accessible by all staff members.
    - Filter duties by Status (`PENDING`, `IN_PROGRESS`, `COMPLETED`) or Priority (`HIGH`, `MEDIUM`, `LOW`).
    - Direct **"Go to Target"** navigation links that take the staff member straight to the assigned `/products`, `/categories`, `/suppliers`, `/customers`, or `/orders` screen.
    - Quick status toggles allowing staff to mark tasks as `IN_PROGRESS` and `COMPLETED`.

### 9. Team & User Administration
- **Location**: `src/app/features/users/`
- **Features**:
  - Super Admin dashboard to inspect all registered users across the platform.
  - Role management modal to promote or demote user roles.
  - Manager team view displaying staff reporting to each manager.

---

## State Management & Core Services

The frontend uses RxJS `BehaviorSubject` and Angular signals to maintain reactive state:

```typescript
// Authentication & Session State (session.service.ts)
private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
public currentUser$ = this.currentUserSubject.asObservable();

// Task Caching for ABAC (task.service.ts)
private myTasksSubject = new BehaviorSubject<Task[]>([]);
public myTasks$ = this.myTasksSubject.asObservable();
```

### Key Services Reference:
- `api.service.ts`: Wraps Angular `HttpClient`, injects `Authorization: Bearer <token>`, appends standard query parameters, and normalizes error responses.
- `auth.service.ts`: Manages session lifecycle, login, registration, and logout.
- `task.service.ts`: Queries manager-initiated tasks and staff duties; provides helper functions `canCreateProduct()`, `canEditProduct()`, `canCreateCustomer()`, `canCreateOrder()`.
- `prediction.service.ts`: Interfaces with the XGBoost ML endpoints.

---

## API Integration & Backend Contracts

The frontend expects the backend API at `http://127.0.0.1:8000/api/v1`.

| Frontend Service | Method | Backend Route | Description |
|---|---|---|---|
| `auth.service.ts` | `POST` | `/auth/login` | Authenticates user; receives JWT token. |
| `product.service.ts` | `GET` | `/products/?page=1&page_size=10` | Retrieves paginated products with stock status. |
| `product.service.ts` | `PATCH` | `/products/{id}/stock` | Submits stock `IN` or `OUT` adjustment. |
| `category.service.ts` | `GET` | `/categories/` | Lists categories for dropdowns and management. |
| `supplier.service.ts` | `GET` | `/suppliers/` | Lists suppliers for dropdowns and management. |
| `customers.service.ts` | `GET` | `/customers/?page=1` | Lists paginated customer accounts. |
| `customers.service.ts` | `POST` | `/customers/` | Creates customer (ABAC gated for staff). |
| `order.service.ts` | `POST` | `/orders/` | Creates sales order with line items. |
| `order.service.ts` | `PATCH` | `/orders/{id}/status` | Advances order state machine. |
| `prediction.service.ts` | `POST` | `/predictions/orders/{id}` | ML XGBoost delivery forecast. |
| `task.service.ts` | `POST` | `/tasks/` | Creates scoped task for staff member. |
| `task.service.ts` | `GET` | `/tasks/my` | Retrieves current user's assigned tasks. |

---

## Environment Configuration & Deployment

### 1. Development Configuration
File: `src/environments/environment.development.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8000'
};
```

### 2. Production Build
```bash
npm run build
```
The compiled output is outputted to `dist/inventory_stock_management/` and is ready for serving via NGINX, Cloudflare Pages, Firebase Hosting, or AWS S3.
