import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { TaskService, Task, TaskStatus, TaskTargetType } from '../../../../services/task.service';
import { UserService, User } from '../../../../services/user.service';
import { isSuperAdmin } from '../../../../auth/utils/roles';

type TaskFilter = TaskStatus | '';

@Component({
  selector: 'app-manage-tasks',
  templateUrl: './manage-tasks.component.html'
})
export class ManageTasksComponent implements OnInit, OnDestroy {

  tasks: Task[] = [];
  assignees: User[] = [];
  allUsers: User[] = [];

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  deletingId: string | null = null;

  showForm = false;
  editingTask: Task | null = null;

  filterStatus: TaskFilter = '';
  filterAssignee: string = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private taskService: TaskService,
    private userService: UserService
  ) { }

  get isSuper(): boolean {
    return isSuperAdmin();
  }

  get targetTypes(): TaskTargetType[] {
    return ['NONE', 'PRODUCT', 'CATEGORY', 'SUPPLIER'];
  }

  get filteredTasks(): Task[] {
    return this.tasks.filter((task) => {
      const statusMatch = !this.filterStatus || task.status === this.filterStatus;
      const assigneeMatch = !this.filterAssignee || task.assigned_to_id === this.filterAssignee;
      return statusMatch && assigneeMatch;
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadTasks();
  }

  loadUsers(): void {
    const source = this.isSuper
      ? this.userService.getUsers()
      : this.userService.getUsersTeam();

    this.subscriptions.push(source.subscribe({
      next: (users) => {
        this.assignees = users || [];
        this.allUsers = users || [];
      },
      error: () => { /* surfaced by task load errors */ }
    }));
  }

  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subscriptions.push(this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks || [];
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.detail ||
          'Failed to load tasks. The task service may not be available yet.';
      }
    }));
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

  targetLabel(type: string): string {
    return type === 'NONE' ? '—' : type;
  }

  assigneeName(task: Task): string {
    if (task.assignee_username) {
      return task.assignee_username;
    }

    const match =
      this.allUsers.find((u) => u.id === task.assigned_to_id) ||
      this.assignees.find((u) => u.id === task.assigned_to_id);

    return match ? match.username : task.assigned_to_id;
  }

  assignerName(task: Task): string {
    if (task.assigner_username) {
      return task.assigner_username;
    }

    const match = this.allUsers.find((u) => u.id === task.assigned_by_id);

    return match ? match.username : task.assigned_by_id;
  }

  openCreate(): void {
    this.editingTask = null;
    this.showForm = true;
  }

  openEdit(task: Task): void {
    this.editingTask = task;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingTask = null;
  }

  onSaved(): void {
    this.showForm = false;
    this.editingTask = null;
    this.successMessage = 'Task saved successfully.';
    this.loadTasks();
  }

  deleteTask(task: Task): void {
    const confirmed = window.confirm(
      `Are you sure you want to delete task "${task.title}"?`
    );

    if (!confirmed) {
      return;
    }

    this.deletingId = task.id;

    this.subscriptions.push(this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.tasks = this.tasks.filter((t) => t.id !== task.id);
        this.successMessage = 'Task deleted.';
      },
      error: (error) => {
        this.deletingId = null;
        this.errorMessage =
          error.error?.detail ||
          'Failed to delete task.';
      }
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}