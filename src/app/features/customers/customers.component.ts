import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import {
  CustomerService,
  Customer,
  CustomerPayload
} from '../../services/customers.service';
import { ToastService } from '../../services/toast.service';
import { canManageCustomers } from '../../auth/utils/roles';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html'
})
export class CustomersComponent implements OnInit, OnDestroy {

  customers: Customer[] = [];

  isLoading = false;
  errorMessage = '';

  showFormModal = false;
  editingCustomer: Customer | null = null;
  isSaving = false;

  private subscriptions: Subscription[] = [];

  canManage = canManageCustomers();

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    address: ['']
  });

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subscriptions.push(this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.customers = customers || [];
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.detail ||
          'Failed to load customers.';
      }
    }));
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('');
  }

  openCreate(): void {
    this.editingCustomer = null;
    this.form.reset();
    this.showFormModal = true;
  }

  openEdit(customer: Customer): void {
    this.editingCustomer = customer;
    this.form.patchValue({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || ''
    });
    this.showFormModal = true;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CustomerPayload = {
      name: (this.form.value.name || '').trim(),
      email: (this.form.value.email || '').trim().toLowerCase(),
      phone: (this.form.value.phone || '').trim() || null,
      address: (this.form.value.address || '').trim() || null
    };

    this.isSaving = true;

    const operation = this.editingCustomer
      ? this.customerService.updateCustomer(this.editingCustomer.id, payload)
      : this.customerService.addCustomer(payload);

    this.subscriptions.push(operation.subscribe({
      next: () => {
        this.isSaving = false;
        this.showFormModal = false;
        this.toast.success(
          this.editingCustomer
            ? 'Customer updated successfully.'
            : 'Customer created successfully.'
        );
        this.loadCustomers();
      },
      error: (error) => {
        this.isSaving = false;
        this.toast.error(
          error.error?.detail ||
          'Failed to save customer.'
        );
      }
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}