import type { QueryClient } from "@tanstack/react-query";
import type { InsertCronTask, UpdateCronTask } from "~shared/queries/cron-tasks.queries";

import {
  createCronTaskRequest,
  deleteCronTaskRequest,
  toggleCronTaskRequest,
  triggerCronTaskRequest,
  updateCronTaskRequest,
} from "./cron-tasks.api";
import { cronTasksKeys } from "./cron-tasks.keys";

export function createCronTaskMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (data: InsertCronTask) => createCronTaskRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.paginated });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.stats });
    },
  };
}

export function updateCronTaskMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: ({ id, data }: { id: string; data: UpdateCronTask }) => updateCronTaskRequest(id, data),
    onSuccess: (_: unknown, variables: { id: string; data: UpdateCronTask }) => {
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.paginated });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.stats });
    },
  };
}

export function deleteCronTaskMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (taskId: string) => deleteCronTaskRequest(taskId),
    onSuccess: (_: unknown, taskId: string) => {
      queryClient.removeQueries({ queryKey: cronTasksKeys.byId(taskId) });
      queryClient.removeQueries({ queryKey: cronTasksKeys.runs(taskId) });
      queryClient.removeQueries({ queryKey: cronTasksKeys.runStats(taskId) });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.paginated });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.stats });
    },
  };
}

export function toggleCronTaskMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (taskId: string) => toggleCronTaskRequest(taskId),
    onSuccess: (_: unknown, taskId: string) => {
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.byId(taskId) });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.paginated });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.stats });
    },
  };
}

export function triggerCronTaskMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (taskId: string) => triggerCronTaskRequest(taskId),
    onSuccess: (_: unknown, taskId: string) => {
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.byId(taskId) });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.paginated });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.runs(taskId) });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.runStats(taskId) });
      queryClient.invalidateQueries({ queryKey: cronTasksKeys.stats });
    },
  };
}
