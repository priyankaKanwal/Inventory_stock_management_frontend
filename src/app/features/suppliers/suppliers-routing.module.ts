import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { SuppliersComponent } from './suppliers.component';
import { SuplierFormComponent } from './pages/suplier-form/suplier-form.component';

import { roleGuard } from '../../auth/guards/role.guard';

const allRoles = ['SUPER_ADMIN', 'ADMIN_MANAGER', 'STAFF_MANAGER', 'ADMIN', 'STAFF'];

const routes: Routes = [

  // Suppliers List
  {
    path: '',
    component: SuppliersComponent,
    canActivate: [roleGuard],
    data: {
      roles: allRoles
    }
  },

  // Add Supplier
  {
    path: 'add',
    component: SuplierFormComponent,
    canActivate: [roleGuard],
    data: {
      roles: allRoles
    }
  },

  // Edit Supplier
  {
    path: 'edit/:id',
    component: SuplierFormComponent,
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
export class SuppliersRoutingModule {}