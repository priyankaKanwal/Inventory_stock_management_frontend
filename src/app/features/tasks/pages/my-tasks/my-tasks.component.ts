import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { TaskService, Task, TaskStatus } from '../../../../services/task.service';
import { TaskCoverageService } from '../../../../services/task-coverage.service';

@Component({
  selector: 'app-my-tasks',
  templateUrl: './my-tasks.component.html'
})
export class MyTasksComponent implements OnInit, OnDestroy {

  tasks: Task[] = [];

  isLoading = false;
  errorMessage = '';

  updatingId: string | null = null;

  private subscription?: Subscription;

  constructor(
    private taskService: TaskService,
    private taskCoverage: TaskCoverageService
  ) { }

  ngOnInit(): void {
    this.taskCoverage.reload();
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subscription = this.taskService.getMyTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks || [];
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.detail ||
          'Failed to load your tasks. The task service may not be available yet.';
      }
    });
  }

  statusLabel(status: TaskStatus): string {
    return status.toUpperCase().replace(/_/g, ' ');
  }

  priorityClass(priority: string): string {
    const p = priority.toUpperCase();

    if (p === 'HIGH') {
      return 'rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700';
    }

    if (p === 'LOW') {
      return 'rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600';
    }

    return 'rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700';
  }

  statusClass(status: TaskStatus): string {
    const s = status.toUpperCase();

    if (s === 'COMPLETED') {
      return 'rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700';
    }

    if (s === 'IN_PROGRESS') {
      return 'rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700';
    }

    return 'rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700';
  }

  nextStatus(status: TaskStatus): TaskStatus {
    if (status === 'PENDING') {
      return 'IN_PROGRESS';
    }

    return 'COMPLETED';
  }

  canAdvance(status: TaskStatus): boolean {
    return status !== 'COMPLETED';
  }

  updateStatus(task: Task): void {
    const next = this.nextStatus(task.status);

    if (!this.canAdvance(task.status) || this.updatingId) {
      return;
    }

    this.updatingId = task.id;

    this.taskService.updateTaskStatus(task.id, next).subscribe({
      next: (updated) => {
        task.status = updated.status;
        this.updatingId = null;
        this.taskCoverage.reload();
      },
      error: () => {
        this.updatingId = null;
      }
    });
  }

  // Returns the route to the linked record's list page
  recordTarget(task: Task): string[] | null {
    if (
      task.target_type === 'NONE' ||
      !task.target_id
    ) {
      return null;
    }

    const base =
      task.target_type === 'PRODUCT'
        ? 'products'
        : task.target_type === 'CATEGORY'
          ? 'categories'
          : 'suppliers';

    return ['/', base];
  }

  targetLabel(type: string): string {
    return type === 'NONE' ? '—' : type;
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}