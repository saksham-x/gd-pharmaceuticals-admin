import api from "../base/api";

export type TaskPriority = "Normal" | "High";

export type Task = {
  _id: string;
  title: string;
  dueDate: string | null;
  priority: TaskPriority;
  done: boolean;
  assignee: { _id: string; name: string; email: string } | null;
  enquiry: { _id: string; reference: string; name: string } | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskPayload = {
  title: string;
  // "2026-10-14" or "" for no deadline.
  dueDate: string;
  priority: TaskPriority;
  assignee: string;
  enquiry: string;
  notes: string;
};

export type TaskStatus = "open" | "done" | "all";

export async function getTasks(status: TaskStatus = "open", mine = false) {
  const response = await api.get<Task[]>("/api/tasks", {
    params: { status, ...(mine && { mine: "true" }) },
  });
  return response.data;
}

export async function createTask(payload: TaskPayload) {
  const response = await api.post<Task>("/api/tasks", payload);
  return response.data;
}

export async function updateTask(id: string, payload: Partial<TaskPayload>) {
  const response = await api.put<Task>(`/api/tasks/${id}`, payload);
  return response.data;
}

export async function toggleTaskDone(id: string) {
  const response = await api.put<Task>(`/api/tasks/${id}/done`);
  return response.data;
}

export async function deleteTask(id: string) {
  await api.delete(`/api/tasks/${id}`);
}
