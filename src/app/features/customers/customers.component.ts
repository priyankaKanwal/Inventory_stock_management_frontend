import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import {
  CustomerService,
  Customer,
  CustomerPayload
} from '../../services/customers.service';
import { canManageCustomers } from '../../auth/utils/roles';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html'
})
export class CustomersComponent implements OnInit, OnDestroy {

  customers: Customer[] = [];

  // Pagination state
  currentPage = 1;
  pageSize = 10;
  total = 0;
  totalPages = 1;

  isLoading = false;
  errorMessage = '';

  showFormModal = false;
  editingCustomer: Customer | null = null;
  isSaving = false;

  // Inline toast notifications
  toastMessage: string | null = null;
  toastType: 'success' | 'error' | 'info' = 'info';
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

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
    private customerService: CustomerService
  ) { }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subscriptions.push(
      this.customerService
        .getCustomers({ page: this.currentPage, pageSize: this.pageSize })
        .subscribe({
          next: (response) => {
            this.customers = response.items || [];
            this.currentPage = response.page;
            this.pageSize = response.page_size ?? this.pageSize;
            this.total = response.total;
            this.totalPages = response.total_pages;
            this.isLoading = false;
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage =
              error.error?.detail ||
              'Failed to load customers.';
          }
        })
    );
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.loadCustomers();
  }

  // First visible item number (1-based)
  get startItem(): number {
    if (this.total === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  // Last visible item number (1-based)
  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.total);
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
        this.showToast(
          'success',
          this.editingCustomer
            ? 'Customer updated successfully.'
            : 'Customer created successfully.'
        );
        this.loadCustomers();
      },
      error: (error) => {
        this.isSaving = false;
        this.showToast(
          'error',
          error.error?.detail ||
          'Failed to save customer.'
        );
      }
    }));
  }

  showToast(type: 'success' | 'error' | 'info', message: string): void {
    this.toastType = type;
    this.toastMessage = message;

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
    }, 3500);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    clearTimeout(this.toastTimer);
  }
}