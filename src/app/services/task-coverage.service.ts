import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { TaskService, Task, TaskTargetType } from './task.service';
import { isWorker } from '../auth/utils/roles';

@Injectable({ providedIn: 'root' })
export class TaskCoverageService {

  // My assigned tasks loaded once for task-driven UI gating
  private tasksSubject = new BehaviorSubject<Task[]>([]);

  tasks$ = this.tasksSubject.asObservable();

  private loading = false;
  private loaded = false;

  constructor(private taskService: TaskService) {
    this.reload();
  }

  get isRestrictedWorker(): boolean {
    return isWorker();
  }

  get tasks(): Task[] {
    return this.tasksSubject.getValue();
  }

  // Active (non-COMPLETED) tasks that reference a specific record
  private coveredTargets(): Set<string> {
    const set = new Set<string>();

    this.tasks.forEach((task) => {
      if (
        task.status === 'COMPLETED' ||
        !task.target_id ||
        task.target_type === 'NONE'
      ) {
        return;
      }

      set.add(this.key(task.target_type, task.target_id));
    });

    return set;
  }

  // Active tasks that authorize creating a record of the given type
  private createPermittedTypes(): Set<string> {
    const set = new Set<string>();

    this.tasks.forEach((task) => {
      if (
        task.status === 'COMPLETED' ||
        task.target_type === 'NONE'
      ) {
        return;
      }

      set.add(task.target_type);
    });

    return set;
  }

  reload(): void {
    if (this.loading) {
      return;
    }

    this.loading = true;

    this.taskService.getMyTasks().subscribe({
      next: (tasks) => {
        this.tasksSubject.next(tasks || []);
        this.loaded = true;
        this.loading = false;
      },
      error: () => {
        this.loaded = true;
        this.loading = false;
      }
    });
  }

  // Whether the user may edit / delete / adjust the given record
  canEdit(targetType: TaskTargetType, targetId: string): boolean {
    if (!this.isRestrictedWorker) {
      return false;
    }

    return this.coveredTargets().has(this.key(targetType, targetId));
  }

  // Whether the user may create a new record of the given type
  canCreate(targetType: TaskTargetType): boolean {
    if (!this.isRestrictedWorker) {
      return false;
    }

    return this.createPermittedTypes().has(targetType);
  }

  private key(type: string, id: string): string {
    return `${type}:${id}`;
  }
}