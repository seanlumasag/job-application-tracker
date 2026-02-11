import { useEffect, useMemo, useState } from "react";
import { Calendar, Link2, MapPin, Trash2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog as DetailsDialog,
  DialogContent as DetailsDialogContent,
  DialogDescription as DetailsDialogDescription,
  DialogHeader as DetailsDialogHeader,
  DialogTitle as DetailsDialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { normalizeExternalUrl } from "../lib/url";
import { api, type ApplicationResponse, type ApplicationUpdateRequest, type TaskResponse } from "../lib/api";

const stageConfig: Record<string, { label: string; color: string }> = {
  SAVED: { label: "Saved", color: "bg-blue-100 text-blue-700 border-blue-200" },
  APPLIED: { label: "Applied", color: "bg-violet-100 text-violet-700 border-violet-200" },
  INTERVIEW: { label: "Interview", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  OFFER: { label: "Offer", color: "bg-amber-100 text-amber-700 border-amber-200" },
  REJECTED: { label: "Rejected", color: "bg-rose-100 text-rose-700 border-rose-200" },
  WITHDRAWN: { label: "Withdrawn", color: "bg-slate-100 text-slate-700 border-slate-200" },
};

type ApplicationDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: ApplicationResponse | null;
  onSave: (id: number, payload: ApplicationUpdateRequest) => Promise<ApplicationResponse>;
  onDelete: (id: number) => Promise<void>;
};

export function ApplicationDetailsDialog({
  open,
  onOpenChange,
  application,
  onSave,
  onDelete,
}: ApplicationDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<ApplicationUpdateRequest>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);

  useEffect(() => {
    if (!application) return;
    setEditValues({
      company: application.company,
      role: application.role,
      jobUrl: application.jobUrl ?? "",
      location: application.location ?? "",
      notes: application.notes ?? "",
      stage: application.stage,
    });
    setIsEditing(false);
  }, [application, open]);

  useEffect(() => {
    if (!open || !application) {
      setTasks([]);
      setTasksError(null);
      return;
    }
    let active = true;
    const load = async () => {
      setTasksLoading(true);
      setTasksError(null);
      try {
        const data = await api.tasks.listForApplication(application.id);
        if (!active) return;
        setTasks(data);
      } catch (err) {
        if (!active) return;
        setTasksError(err instanceof Error ? err.message : "Unable to load tasks.");
      } finally {
        if (!active) return;
        setTasksLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [application, open]);

  const selectedLink = normalizeExternalUrl(application?.jobUrl);

  const handleEditChange = (field: keyof ApplicationUpdateRequest, value: string) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdits = async () => {
    if (!application) return;
    setIsSaving(true);
    try {
      const updated = await onSave(application.id, {
        company: editValues.company?.trim() || application.company,
        role: editValues.role?.trim() || application.role,
        location: editValues.location?.trim() || null,
        jobUrl: editValues.jobUrl?.trim() || null,
        notes: editValues.notes?.trim() || null,
        stage: editValues.stage ?? application.stage,
      });
      setEditValues({
        company: updated.company,
        role: updated.role,
        jobUrl: updated.jobUrl ?? "",
        location: updated.location ?? "",
        notes: updated.notes ?? "",
        stage: updated.stage,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!application) return;
    setIsDeleting(true);
    try {
      await onDelete(application.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const toLocalDateTime = (dateValue: string) => {
    if (!dateValue) return null;
    return `${dateValue}T09:00:00`;
  };

  const handleAddTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!application || !taskTitle.trim()) return;
    try {
      const created = await api.tasks.create(application.id, {
        title: taskTitle.trim(),
        dueAt: toLocalDateTime(taskDueDate),
      });
      setTasks((prev) => [created, ...prev]);
      setTaskTitle("");
      setTaskDueDate("");
    } catch (err) {
      setTasksError(err instanceof Error ? err.message : "Unable to create task.");
    }
  };

  const handleToggleTask = async (task: TaskResponse) => {
    const nextStatus = task.status === "DONE" ? "OPEN" : "DONE";
    setTasks((prev) =>
      prev.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item))
    );
    try {
      const updated = await api.tasks.updateStatus(task.id, nextStatus);
      if (updated) {
        setTasks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      }
    } catch (err) {
      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? { ...item, status: task.status } : item))
      );
      setTasksError(err instanceof Error ? err.message : "Unable to update task.");
    }
  };

  const handleDeleteTask = async (task: TaskResponse) => {
    setDeletingTaskId(task.id);
    try {
      await api.tasks.delete(task.id);
      setTasks((prev) => prev.filter((item) => item.id !== task.id));
    } catch (err) {
      setTasksError(err instanceof Error ? err.message : "Unable to delete task.");
    } finally {
      setDeletingTaskId((current) => (current === task.id ? null : current));
    }
  };

  return (
    <DetailsDialog open={open} onOpenChange={onOpenChange}>
      <DetailsDialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DetailsDialogHeader>
          <DetailsDialogTitle>Application Details</DetailsDialogTitle>
          <DetailsDialogDescription>
            Review the full record for this application.
          </DetailsDialogDescription>
        </DetailsDialogHeader>
        {application && (
          <div className="mt-6 flex-1 space-y-6 text-sm overflow-y-auto pr-2 -mr-2">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editValues.role ?? ""}
                        onChange={(event) => handleEditChange("role", event.target.value)}
                        placeholder="Role"
                      />
                      <Input
                        value={editValues.company ?? ""}
                        onChange={(event) => handleEditChange("company", event.target.value)}
                        placeholder="Company"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold">{application.role}</h3>
                      <p className="text-slate-500">{application.company}</p>
                    </>
                  )}
                </div>
                {isEditing ? (
                  <select
                    value={editValues.stage ?? application.stage}
                    onChange={(event) => handleEditChange("stage", event.target.value)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {Object.keys(stageConfig).map((stage) => (
                      <option key={stage} value={stage}>
                        {stageConfig[stage]?.label ?? stage}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge
                    variant="outline"
                    className={
                      stageConfig[application.stage]?.color ??
                      "bg-slate-100 text-slate-700 border-slate-200"
                    }
                  >
                    {stageConfig[application.stage]?.label ?? application.stage}
                  </Badge>
                )}
              </div>
              {isEditing ? (
                <div className="mt-4 grid gap-3">
                  <Input
                    value={editValues.location ?? ""}
                    onChange={(event) => handleEditChange("location", event.target.value)}
                    placeholder="Location"
                  />
                  <Input
                    value={editValues.jobUrl ?? ""}
                    onChange={(event) => handleEditChange("jobUrl", event.target.value)}
                    placeholder="Job URL"
                  />
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {application.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {application.location}
                    </span>
                  )}
                  {selectedLink && (
                    <a
                      href={selectedLink}
                      className="flex items-center gap-1 text-violet-600 hover:text-violet-700"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Link2 className="h-3 w-3" />
                      Link
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">Dates</p>
              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-4 w-4" />
                  Applied{" "}
                  {new Date(application.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-4 w-4" />
                  Last updated{" "}
                  {new Date(application.updatedAt ?? application.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">Notes</p>
              {isEditing ? (
                <Textarea
                  value={editValues.notes ?? ""}
                  onChange={(event) => handleEditChange("notes", event.target.value)}
                  rows={4}
                />
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-slate-600">
                  {application.notes?.trim() || "No notes added yet."}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Tasks</p>
              </div>
              <form onSubmit={handleAddTask} className="flex flex-wrap items-center gap-2">
                <Input
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder="Add a task"
                />
                <Input
                  type="date"
                  value={taskDueDate}
                  onChange={(event) => setTaskDueDate(event.target.value)}
                  className="min-w-[150px]"
                />
                <Button type="submit" disabled={!taskTitle.trim()}>
                  Add
                </Button>
              </form>
              {tasksError && <p className="text-xs text-rose-600">{tasksError}</p>}
              {tasksLoading ? (
                <div className="text-xs text-slate-500">Loading tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-500">
                  No tasks yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={task.status === "DONE"}
                          onChange={() => handleToggleTask(task)}
                        />
                        <span className={task.status === "DONE" ? "line-through text-slate-400" : ""}>
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {task.dueAt && (
                          <span className="text-xs text-slate-500">
                            {new Date(task.dueAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-rose-500"
                          onClick={() => handleDeleteTask(task)}
                          disabled={deletingTaskId === task.id}
                          aria-label={`Delete task ${task.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdits} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save changes"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="text-red-600"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                  <Button onClick={() => setIsEditing(true)}>Edit details</Button>
                </>
              )}
            </div>
          </div>
        )}
      </DetailsDialogContent>
    </DetailsDialog>
  );
}
