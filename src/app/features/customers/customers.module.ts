import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { CustomersRoutingModule } from './customers-routing.module';
import { CustomersComponent } from './customers.component';

@NgModule({
  declarations: [
    CustomersComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CustomersRoutingModule
  ]
})
export class CustomersModule { }