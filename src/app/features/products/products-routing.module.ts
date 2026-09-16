import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { ProductsComponent } from './products.component';
import { ProductsFormComponent } from './pages/products-form/products-form.component';

import { roleGuard } from '../../auth/guards/role.guard';

const allRoles = ['SUPER_ADMIN', 'ADMIN_MANAGER', 'STAFF_MANAGER', 'ADMIN', 'STAFF'];

const routes: Routes = [

  // Products List
  {
    path: '',
    component: ProductsComponent,
    canActivate: [roleGuard],
    data: {
      roles: allRoles
    }
  },

  // Add Product
  {
    path: 'add',
    component: ProductsFormComponent,
    canActivate: [roleGuard],
    data: {
      roles: allRoles
    }
  },

  // Edit Product
  {
    path: 'edit/:id',
    component: ProductsFormComponent,
    canActivate: [roleGuard],
    data: {
      roles: allRoles
    }
  }

];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class ProductsRoutingModule {}