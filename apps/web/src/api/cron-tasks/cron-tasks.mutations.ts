import type { QueryClient } from "@tanstack/react-query";
import type { InsertCronTask, UpdateCronTask } from "~shared/queries/cron-tasks.queries";

import {
  createCronTaskRequest,
  deleteCronTaskRequest,
  toggleCronTaskRequest,
  triggerCronTaskRequest,
  updateCronTaskRequest,
} from "./cron-tasks.api";

export function createCronTaskMutationOptions(_queryClient: QueryClient) {
  return {
    mutationFn: (data: InsertCronTask) => createCronTaskRequest(data),
  };
}

export function updateCronTaskMutationOptions(_queryClient: QueryClient) {
  return {
    mutationFn: ({ id, data }: { id: string; data: UpdateCronTask }) => updateCronTaskRequest(id, data),
  };
}

export function deleteCronTaskMutationOptions(_queryClient: QueryClient) {
  return {
    mutationFn: (taskId: string) => deleteCronTaskRequest(taskId),
  };
}

export function toggleCronTaskMutationOptions(_queryClient: QueryClient) {
  return {
    mutationFn: (taskId: string) => toggleCronTaskRequest(taskId),
  };
}

export function triggerCronTaskMutationOptions(_queryClient: QueryClient) {
  return {
    mutationFn: (taskId: string) => triggerCronTaskRequest(taskId),
  };
}
