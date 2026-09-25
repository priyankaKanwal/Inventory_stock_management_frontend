import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import {
  TaskService,
  Task,
  TaskPriority,
  TaskStatus,
  TaskTargetType,
  TaskCreatePayload
} from '../../../../services/task.service';

import { User } from '../../../../services/user.service';
import { ProductService } from '../../../../services/product.service';
import { CategoryService } from '../../../../services/category.service';
import { SupplierService } from '../../../../services/supplier.service';

import { Product } from '../../../products/products.component';
import { Category } from '../../../categories/categories.component';
import { Supplier } from '../../../suppliers/suppliers.component';

interface TargetRecord {
  id: string;
  name: string;
}

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html'
})
export class TaskFormComponent implements OnInit {

  @Input() task: Task | null = null;
  @Input() assignees: User[] = [];
  @Input() targetTypes: TaskTargetType[] = [];

  @Output() saved = new EventEmitter<Task>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;

  isSaving = false;
  errorMessage = '';

  products: Product[] = [];
  categories: Category[] = [];
  suppliers: Supplier[] = [];

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private supplierService: SupplierService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      title: [this.task?.title || '', Validators.required],
      description: [this.task?.description || ''],
      priority: [this.task?.priority || 'MEDIUM'],
      due_date: [this.task?.due_date ? this.toDateInput(this.task.due_date) : ''],
      assigned_to_id: [this.task?.assigned_to_id || '', Validators.required],
      target_type: [this.task?.target_type || 'NONE'],
      target_id: [this.task?.target_id || '']
    });

    this.loadRecordOptions();
  }

  get selectedTargetType(): string {
    return this.form.get('target_type')?.value || 'NONE';
  }

  get targetRecords(): TargetRecord[] {
    const type = this.selectedTargetType;

    if (type === 'PRODUCT') {
      return this.products.map((p) => ({ id: p.id, name: p.name }));
    }

    if (type === 'CATEGORY') {
      return this.categories.map((c) => ({ id: c.id, name: c.name }));
    }

    if (type === 'SUPPLIER') {
      return this.suppliers.map((s) => ({ id: s.id, name: s.name }));
    }

    return [];
  }

  toDateInput(iso: string): string {
    const d = new Date(iso);

    if (isNaN(d.getTime())) {
      return '';
    }

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${y}-${m}-${day}`;
  }

  loadRecordOptions(): void {
    this.productService.getProducts({ page: 1, pageSize: 50 }).subscribe({
      next: (response) => {
        this.products = response.items || [];
      },
      error: () => {
        this.products = [];
      }
    });

    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories || [];
      },
      error: () => {
        this.categories = [];
      }
    });

    this.supplierService.getAllSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers || [];
      },
      error: () => {
        this.suppliers = [];
      }
    });
  }

  onTargetTypeChange(): void {
    this.form.get('target_id')?.setValue('');
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    const targetType: TaskTargetType = value.target_type;

    const payload: TaskCreatePayload = {
      title: value.title,
      description: value.description || null,
      priority: value.priority as TaskPriority,
      status: (this.task?.status || 'PENDING') as TaskStatus,
      due_date: value.due_date
        ? new Date(`${value.due_date}T00:00:00`).toISOString()
        : null,
      assigned_to_id: value.assigned_to_id,
      target_type: targetType,
      target_id: targetType === 'NONE' ? null : value.target_id || null
    };

    this.isSaving = true;
    this.errorMessage = '';

    const operation = this.task
      ? this.taskService.updateTask(this.task.id, payload)
      : this.taskService.createTask(payload);

    operation.subscribe({
      next: (task) => {
        this.isSaving = false;
        this.saved.emit(task);
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage =
          error.error?.detail ||
          'Failed to save task.';
      }
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}