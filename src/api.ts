import type { TaskItem } from "./types";

const API_BASE = "http://localhost:5000/api/tasks";

export async function fetchTasks(): Promise<TaskItem[]> {
  const r = await fetch(API_BASE);
  if (!r.ok) throw new Error("Failed to fetch tasks");
  return r.json();
}

export async function createTask(description: string): Promise<TaskItem> {
  const r = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  if (!r.ok) throw new Error("Failed to create task");
  return r.json();
}

export async function toggleTask(id: number): Promise<TaskItem> {
  const r = await fetch(`${API_BASE}/${id}/toggle`, { method: "PUT" });
  if (!r.ok) throw new Error("Failed to toggle task");
  return r.json();
}

export async function deleteTask(id: number): Promise<void> {
  const r = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error("Failed to delete task");
}
