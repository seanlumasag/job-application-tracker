import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Plus, MoreVertical, Calendar } from "lucide-react";
import { normalizeExternalUrl } from "../lib/url";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { api, clearAuthTokens, getAuthTokens, type ApplicationResponse } from "../lib/api";
import { ApplicationDetailsDialog } from "../components/application-details-dialog";

const stageConfig: Record<string, { label: string; color: string }> = {
  SAVED: { label: "Saved", color: "bg-blue-100 text-blue-700 border-blue-200" },
  APPLIED: { label: "Applied", color: "bg-violet-100 text-violet-700 border-violet-200" },
  INTERVIEW: { label: "Interview", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  OFFER: { label: "Offer", color: "bg-amber-100 text-amber-700 border-amber-200" },
  REJECTED: { label: "Rejected", color: "bg-rose-100 text-rose-700 border-rose-200" },
  WITHDRAWN: { label: "Withdrawn", color: "bg-slate-100 text-slate-700 border-slate-200" },
};

const stageOrder = ["SAVED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"];

const DND_ITEM_TYPE = "APPLICATION_CARD";

type DragItem = {
  id: number;
  fromStage: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [summary, setSummary] = useState<{ stageCounts: Record<string, number>; overdueTasks: number } | null>(
    null
  );
  const [profile, setProfile] = useState<{ userId: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationResponse | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  useEffect(() => {
    if (!getAuthTokens()) {
      navigate("/auth");
      return;
    }

    let active = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [me, apps, dashboard] = await Promise.all([
          api.me(),
          api.applications.list(),
          api.dashboard.summary(),
        ]);
        if (!active) return;
        setProfile(me);
        setApplications(apps);
        setSummary(dashboard);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load dashboard data.");
      } finally {
        if (!active) return;
        setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [navigate]);

  const handleAddJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const created = await api.applications.create({
        company: String(formData.get("company") ?? ""),
        role: String(formData.get("role") ?? ""),
        jobUrl: String(formData.get("jobUrl") ?? ""),
        location: String(formData.get("location") ?? ""),
        notes: String(formData.get("notes") ?? ""),
      });
      setApplications((prev) => [created, ...prev]);
      setIsDialogOpen(false);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create application.");
    }
  };

  const groupedApplications = useMemo(() => {
    const grouped: Record<string, ApplicationResponse[]> = {};
    for (const stage of stageOrder) {
      grouped[stage] = [];
    }
    for (const job of applications) {
      if (!grouped[job.stage]) {
        grouped[job.stage] = [];
      }
      grouped[job.stage].push(job);
    }
    return grouped;
  }, [applications]);

  const stats = useMemo(() => {
    const stageCounts = summary?.stageCounts ?? {};
    const total = Object.values(stageCounts).reduce((acc, value) => acc + value, 0);
    return {
      total,
      applied: stageCounts.APPLIED ?? 0,
      interview: stageCounts.INTERVIEW ?? 0,
      offer: stageCounts.OFFER ?? 0,
      overdue: summary?.overdueTasks ?? 0,
    };
  }, [summary]);

  const initials = "JT";

  const handleSignOut = async () => {
    const tokens = getAuthTokens();
    if (tokens?.refreshToken) {
      try {
        await api.auth.logout(tokens.refreshToken);
      } catch (err) {
        // Ignore logout errors, clear session locally.
      }
    }
    clearAuthTokens();
    navigate("/");
  };

  const isBoardActive = location.pathname === "/dashboard";
  const isApplicationsActive = location.pathname === "/applications";

  const handleMoveApplication = async (id: number, nextStage: string) => {
    let previousStage = "";
    setApplications((prev) =>
      prev.map((job) => {
        if (job.id !== id) return job;
        previousStage = job.stage;
        return { ...job, stage: nextStage };
      })
    );
    try {
      const updated = await api.applications.updateStage(id, nextStage);
      setApplications((prev) => prev.map((job) => (job.id === id ? updated : job)));
    } catch (err) {
      setApplications((prev) =>
        prev.map((job) => (job.id === id ? { ...job, stage: previousStage || job.stage } : job))
      );
      setError(err instanceof Error ? err.message : "Unable to update stage.");
    }
  };

  const handleOpenDetails = (job: ApplicationResponse) => {
    setSelectedApplication(job);
    setDetailsOpen(true);
  };

  const handleSaveEdits = async (id: number, payload: Parameters<typeof api.applications.update>[1]) => {
    setError(null);
    const updated = await api.applications.update(id, payload);
    setApplications((prev) => prev.map((job) => (job.id === updated.id ? updated : job)));
    setSelectedApplication(updated);
    return updated;
  };

  const decrementSummary = (stage: string) => {
    setSummary((prev) => {
      if (!prev) return prev;
      const current = prev.stageCounts?.[stage] ?? 0;
      return {
        ...prev,
        stageCounts: {
          ...prev.stageCounts,
          [stage]: Math.max(0, current - 1),
        },
      };
    });
  };

  const handleDeleteSelected = async () => {
    if (!selectedApplication) return;
    const id = selectedApplication.id;
    const stage = selectedApplication.stage;
    setDeletingId(id);
    setError(null);
    try {
      await api.applications.delete(id);
      setApplications((prev) => prev.filter((job) => job.id !== id));
      decrementSummary(stage);
      setDetailsOpen(false);
      setSelectedApplication(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete application.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteApplication = async (id: number) => {
    const stage = applications.find((job) => job.id === id)?.stage;
    setDeletingId(id);
    setError(null);
    try {
      await api.applications.delete(id);
      setApplications((prev) => prev.filter((job) => job.id !== id));
      if (stage) {
        decrementSummary(stage);
      }
      if (selectedApplication?.id === id) {
        setDetailsOpen(false);
        setSelectedApplication(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete application.");
    } finally {
      setDeletingId(null);
    }
  };


  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-200 px-6 py-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 text-white flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold">JobTrack</p>
              <p className="text-xs text-slate-500">{profile?.email ?? "test@gmail.com"}</p>
            </div>
          </div>

          <nav className="space-y-2 text-sm">
            <Link
              to="/dashboard"
              className={`block w-full rounded-full px-4 py-2 ${
                isBoardActive
                  ? "bg-slate-100 font-semibold text-slate-900"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              Board
            </Link>
            <Link
              to="/applications"
              className={`block w-full rounded-full px-4 py-2 ${
                isApplicationsActive
                  ? "bg-slate-100 font-semibold text-slate-900"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              Applications
            </Link>
          </nav>

          <div className="mt-auto space-y-4 text-sm">
            <Link
              to="/settings"
              className="block w-full text-left px-3 py-2 text-slate-500 hover:text-slate-700"
            >
              Account settings
            </Link>
            <button
              className="w-full text-left px-3 py-2 text-slate-500 hover:text-slate-700"
              onClick={handleSignOut}
            >
              Log out
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <div className="border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <h1 className="text-2xl font-semibold">Your Job Application Tracker</h1>
                <p className="text-sm text-slate-500">Board</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 rounded-full bg-violet-600 hover:bg-violet-700">
                    <Plus className="h-4 w-4" />
                    Add Application
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <form onSubmit={handleAddJob}>
                    <DialogHeader>
                      <DialogTitle>Add New Application</DialogTitle>
                      <DialogDescription>
                        Track a new job application by filling in the details below
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="company">Company</Label>
                        <Input id="company" name="company" placeholder="e.g., Google" required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="role">Role</Label>
                        <Input id="role" name="role" placeholder="e.g., Senior Developer" required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="jobUrl">Job URL</Label>
                        <Input id="jobUrl" name="jobUrl" placeholder="https://..." />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" name="location" placeholder="e.g., Remote" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" name="notes" placeholder="Add any notes or comments..." rows={3} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Add Application</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="px-6 py-6">
            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 mb-4">
                {error}
              </div>
            )}

            <div className="mb-6 flex flex-wrap items-center gap-4">
              <Card className="w-32 border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardDescription>Total</CardDescription>
                  <CardTitle className="text-2xl">{isLoading ? "—" : stats.total}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
              {stageOrder.map((stage) => {
                const jobs = groupedApplications[stage] ?? [];
                const label = stageConfig[stage]?.label ?? stage;
                const badgeClass =
                  stageConfig[stage]?.color ?? "bg-slate-100 text-slate-700 border-slate-200";
                return (
                  <KanbanColumn
                    key={stage}
                    stage={stage}
                    label={label}
                    badgeClass={badgeClass}
                    jobs={jobs}
                    isLoading={isLoading}
                    onMove={handleMoveApplication}
                    onOpenDetails={handleOpenDetails}
                    onDelete={handleDeleteApplication}
                    deletingId={deletingId}
                    onOpenAdd={() => setIsDialogOpen(true)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
      </div>
      <ApplicationDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        application={selectedApplication}
        onSave={handleSaveEdits}
        onDelete={handleDeleteSelected}
      />
    </DndProvider>
  );
}

type KanbanColumnProps = {
  stage: string;
  label: string;
  badgeClass: string;
  jobs: ApplicationResponse[];
  isLoading: boolean;
  onMove: (id: number, nextStage: string) => void;
  onOpenDetails: (job: ApplicationResponse) => void;
  onDelete: (id: number) => void;
  deletingId: number | null;
  onOpenAdd: () => void;
};

function KanbanColumn({
  stage,
  label,
  badgeClass,
  jobs,
  isLoading,
  onMove,
  onOpenDetails,
  onDelete,
  deletingId,
  onOpenAdd,
}: KanbanColumnProps) {
  const [{ isOver }, dropRef] = useDrop(
    () => ({
      accept: DND_ITEM_TYPE,
      drop: (item: DragItem) => {
        if (item.fromStage !== stage) {
          onMove(item.id, stage);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [stage, onMove]
  );

  return (
    <div ref={dropRef} className="rounded-xl">
      <Card
        className={`bg-slate-50/70 border-slate-200 transition ${
          isOver ? "ring-inset ring-2 ring-violet-200/70" : ""
        }`}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={badgeClass}>
              {label}
            </Badge>
            <span className="text-xs text-slate-400">{jobs.length}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 h-32" />
          )}
          {!isLoading && jobs.length === 0 && (
            <button
              className="w-full rounded-xl border border-dashed border-slate-300 bg-white/70 py-10 text-slate-400 hover:text-slate-500"
              onClick={onOpenAdd}
            >
              <Plus className="mx-auto h-5 w-5" />
            </button>
          )}
          {!isLoading &&
            jobs.map((job) => (
              <KanbanCard
                key={job.id}
                job={job}
                onOpenDetails={onOpenDetails}
                onDelete={onDelete}
                deletingId={deletingId}
              />
            ))}
        </CardContent>
      </Card>
    </div>
  );
}

type KanbanCardProps = {
  job: ApplicationResponse;
  onOpenDetails: (job: ApplicationResponse) => void;
  onDelete: (id: number) => void;
  deletingId: number | null;
};

function KanbanCard({ job, onOpenDetails, onDelete, deletingId }: KanbanCardProps) {
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: DND_ITEM_TYPE,
      item: { id: job.id, fromStage: job.stage } satisfies DragItem,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [job.id, job.stage]
  );

  return (
    <div
      ref={dragRef}
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!isDragging) {
          onOpenDetails(job);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (!isDragging) {
            onOpenDetails(job);
          }
        }
      }}
      className={`rounded-xl bg-white border border-slate-200 p-4 cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{job.role}</h3>
          <p className="text-xs text-slate-500">{job.company}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(event) => event.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation();
                onOpenDetails(job);
              }}
            >
              Details
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(job.id);
              }}
              disabled={deletingId === job.id}
            >
              {deletingId === job.id ? "Deleting..." : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {job.location && (
          <span className="rounded-full bg-slate-100 px-2 py-1">{job.location}</span>
        )}
        {normalizeExternalUrl(job.jobUrl) && (
          <a
            href={normalizeExternalUrl(job.jobUrl) ?? undefined}
            draggable={false}
            onClick={(event) => event.stopPropagation()}
            onDragStart={(event) => event.preventDefault()}
            className="rounded-full border border-slate-200 px-2 py-1 text-violet-600"
            target="_blank"
            rel="noreferrer"
          >
            Link
          </a>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-400 flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        Last touch{" "}
        {new Date(job.updatedAt ?? job.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </p>
    </div>
  );
}
