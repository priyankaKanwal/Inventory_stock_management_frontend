import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from './api.service';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskTargetType = 'PRODUCT' | 'CATEGORY' | 'SUPPLIER' | 'NONE';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string | null;
  assigned_to_id: string;
  assigned_by_id: string;
  target_type: TaskTargetType;
  target_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  assignee_username?: string | null;
  assignee_email?: string | null;
  assigner_username?: string | null;
}

export interface TaskFilters {
  status?: TaskStatus | '';
  assigned_to?: string | '';
}

export type TaskCreatePayload = Pick<
  Task,
  'title' | 'priority' | 'status' | 'target_type' | 'target_id'
> & {
  description?: string | null;
  due_date?: string | null;
  assigned_to_id: string;
};

@Injectable({ providedIn: 'root' })
export class TaskService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  // GET - Tasks assigned to the current user
  getMyTasks(): Observable<Task[]> {
    return this.http.get<{ items: Task[] }>(
      this.buildUrl('tasks/my')
    ).pipe(map((response) => response.items));
  }

  // GET - Tasks assigned by the current user (managers)
  getTasks(filters?: TaskFilters): Observable<Task[]> {
    const params: string[] = [];

    if (filters?.status) {
      params.push(`status=${encodeURIComponent(filters.status)}`);
    }

    if (filters?.assigned_to) {
      params.push(`assigned_to=${encodeURIComponent(filters.assigned_to)}`);
    }

    const query = params.length ? `?${params.join('&')}` : '';

    return this.http.get<{ items: Task[] }>(
      this.buildUrl(`tasks/${query}`)
    ).pipe(map((response) => response.items));
  }

  // GET - Single task
  getTask(id: string): Observable<Task> {
    return this.http.get<Task>(
      this.buildUrl(`tasks/${id}`)
    );
  }

  // POST - Create & assign a task
  createTask(task: TaskCreatePayload): Observable<Task> {
    return this.http.post<Task>(
      this.buildUrl('tasks/'),
      task
    );
  }

  // PUT - Update a task
  updateTask(id: string, task: Partial<TaskCreatePayload>): Observable<Task> {
    return this.http.put<Task>(
      this.buildUrl(`tasks/${id}`),
      task
    );
  }

  // PATCH - Update task status
  updateTaskStatus(id: string, status: TaskStatus): Observable<Task> {
    return this.http.patch<Task>(
      this.buildUrl(`tasks/${id}/status`),
      { status }
    );
  }

  // DELETE - Delete a task
  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(
      this.buildUrl(`tasks/${id}`)
    );
  }
}