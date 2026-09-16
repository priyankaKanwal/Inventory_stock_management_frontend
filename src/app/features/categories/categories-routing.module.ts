import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { CategoriesComponent } from './categories.component';
import { CategoriesFormComponent } from './pages/categories-form/categories-form.component';

import { roleGuard } from '../../auth/guards/role.guard';

const allRoles = ['SUPER_ADMIN', 'ADMIN_MANAGER', 'STAFF_MANAGER', 'ADMIN', 'STAFF'];

const routes: Routes = [

  // Categories List
  {
    path: '',
    component: CategoriesComponent,
    canActivate: [roleGuard],
    data: {
      roles: allRoles
    }
  },

  // Add Category
  {
    path: 'add',
    component: CategoriesFormComponent,
    canActivate: [roleGuard],
    data: {
      roles: allRoles
    }
  },

  // Edit Category
  {
    path: 'edit/:id',
    component: CategoriesFormComponent,
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
export class CategoriesRoutingModule {}