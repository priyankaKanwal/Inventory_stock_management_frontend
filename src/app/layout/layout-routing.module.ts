import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LayoutComponent } from './layout/layout.component';
import { roleGuard } from '../auth/guards/role.guard';


const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [

      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: {
          roles: ['admin', 'staff']
        },
        loadChildren: () =>
          import('../features/dashboard/dashboard.module')
            .then(module => module.DashboardModule)
      },

      {
        path: 'products',
        canActivate: [roleGuard],
        data: {
          roles: ['admin', 'staff']
        },
        loadChildren: () =>
          import('../features/products/products.module')
            .then(module => module.ProductsModule)
      },

      {
        path: 'categories',
        canActivate: [roleGuard],
        data: {
          roles: ['admin', 'staff']
        },
        loadChildren: () =>
          import('../features/categories/categories.module')
            .then(module => module.CategoriesModule)
      },

      {
        path: 'suppliers',
        canActivate: [roleGuard],
        data: {
          roles: ['admin', 'staff']
        },
        loadChildren: () =>
          import('../features/suppliers/suppliers.module')
            .then(module => module.SuppliersModule)
      },

      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LayoutRoutingModule {}