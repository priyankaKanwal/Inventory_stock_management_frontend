import { Task, TaskTargetType } from '../../services/task.service';
import { isWorker } from './roles';

// Active (non-COMPLETED) tasks that reference a specific record
function activeTargets(tasks: Task[]): Set<string> {
  const set = new Set<string>();

  tasks.forEach((task) => {
    if (
      task.status === 'COMPLETED' ||
      !task.target_id ||
      task.target_type === 'NONE'
    ) {
      return;
    }

    set.add(`${task.target_type}:${task.target_id}`);
  });

  return set;
}

// Active tasks that authorize creating a record of the given type
function activeCreateTypes(tasks: Task[]): Set<string> {
  const set = new Set<string>();

  tasks.forEach((task) => {
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

// Whether a worker may edit / delete / adjust the given record.
// Staff must be covered by an active task; managers use canManage instead.
export function canEditRecord(
  tasks: Task[],
  targetType: TaskTargetType,
  targetId: string
): boolean {
  if (!isWorker()) {
    return false;
  }

  return activeTargets(tasks).has(`${targetType}:${targetId}`);
}

// Whether a worker may create a new record of the given type.
// Staff need an active task targetting that type; managers use canManage.
export function canCreateRecord(
  tasks: Task[],
  targetType: TaskTargetType
): boolean {
  if (!isWorker()) {
    return false;
  }

  return activeCreateTypes(tasks).has(targetType);
}