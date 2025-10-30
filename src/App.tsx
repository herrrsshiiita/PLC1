import React, { useEffect, useState } from "react";
import type { TaskItem } from "./types";
import { fetchTasks, createTask, toggleTask, deleteTask } from "./api";

export default function App() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const t = await fetchTasks();
      setTasks(t);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e?: React.FormEvent) {
    e?.preventDefault();
    if (!newDesc.trim()) return;
    try {
      setLoading(true);
      const created = await createTask(newDesc.trim());
      setTasks((s) => [...s, created]);
      setNewDesc("");
    } catch (e: any) {
      setError(e.message || "Failed to create");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id: number) {
    try {
      const updated = await toggleTask(id);
      setTasks((s) => s.map((t) => (t.id === id ? updated : t)));
    } catch (e: any) {
      setError(e.message || "Failed to toggle");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteTask(id);
      setTasks((s) => s.filter((t) => t.id !== id));
    } catch (e: any) {
      setError(e.message || "Failed to delete");
    }
  }

  const filtered = tasks.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.isCompleted : t.isCompleted
  );

  return (
    <div className="container">
      <h1>Basic Task Manager</h1>

      <form onSubmit={handleAdd} className="add-form">
        <input
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          placeholder="New task description"
        />
        <button type="submit">Add</button>
      </form>

      <div className="controls">
        <div className="filters">
          <button onClick={() => setFilter("all")} className={filter === "all" ? "active" : ""}>
            All
          </button>
          <button onClick={() => setFilter("active")} className={filter === "active" ? "active" : ""}>
            Active
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={filter === "completed" ? "active" : ""}
          >
            Completed
          </button>
        </div>
        <div>
          <button onClick={load}>Refresh</button>
        </div>
      </div>

      {loading && <div className="muted">Loading...</div>}
      {error && (
        <div className="error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>x</button>
        </div>
      )}

      <ul className="task-list">
        {filtered.length === 0 && <li className="muted">No tasks</li>}
        {filtered.map((t) => (
          <li key={t.id} className={t.isCompleted ? "completed" : ""}>
            <label>
              <input
                type="checkbox"
                checked={t.isCompleted}
                onChange={() => handleToggle(t.id)}
              />
              <span className="desc">{t.description}</span>
            </label>
            <div className="actions">
              <small className="created">#{t.id}</small>
              <button className="delete" onClick={() => handleDelete(t.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
