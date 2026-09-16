import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LayoutComponent } from './layout/layout.component';

import { roleGuard } from '../auth/guards/role.guard';

const allRoles = ['SUPER_ADMIN', 'ADMIN_MANAGER', 'STAFF_MANAGER', 'ADMIN', 'STAFF'];
const superAdminRoles = ['SUPER_ADMIN'];

const routes: Routes = [

  {
    path: '',
    component: LayoutComponent,

    children: [

      // Dashboard
      {
        path: 'dashboard',

        canActivate: [roleGuard],

        data: {
          roles: allRoles
        },

        loadChildren: () =>
          import('../features/dashboard/dashboard.module')
            .then(module => module.DashboardModule)
      },

      // Products
      {
        path: 'products',

        canActivate: [roleGuard],

        data: {
          roles: allRoles
        },

        loadChildren: () =>
          import('../features/products/products.module')
            .then(module => module.ProductsModule)
      },

      // Categories
      {
        path: 'categories',

        canActivate: [roleGuard],

        data: {
          roles: allRoles
        },

        loadChildren: () =>
          import('../features/categories/categories.module')
            .then(module => module.CategoriesModule)
      },

      // Suppliers
      {
        path: 'suppliers',

        canActivate: [roleGuard],

        data: {
          roles: allRoles
        },

        loadChildren: () =>
          import('../features/suppliers/suppliers.module')
            .then(module => module.SuppliersModule)
      },

      // My Tasks + Manage Tasks (guards on child routes)
      {
        path: 'tasks',

        canActivate: [roleGuard],

        data: {
          roles: allRoles
        },

        loadChildren: () =>
          import('../features/tasks/tasks.module')
            .then(module => module.TasksModule)
      },

      // User Management (super admin only)
      {
        path: 'admin/users',

        canActivate: [roleGuard],

        data: {
          roles: superAdminRoles
        },

        loadChildren: () =>
          import('../features/users/users.module')
            .then(module => module.UsersModule)
      },

      // Default
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }

    ]
  }

];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],

  exports: [
    RouterModule
  ]
})
export class LayoutRoutingModule {}