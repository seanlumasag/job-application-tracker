import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Calendar, Link2, MapPin, MoreVertical, Plus } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { ApplicationDetailsDialog } from "../components/application-details-dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import {
  api,
  clearAuthTokens,
  getAuthTokens,
  type ApplicationResponse,
  type ApplicationUpdateRequest,
} from "../lib/api";
import { normalizeExternalUrl } from "../lib/url";

const stageConfig: Record<string, { label: string; color: string }> = {
  SAVED: { label: "Saved", color: "bg-blue-100 text-blue-700 border-blue-200" },
  APPLIED: { label: "Applied", color: "bg-violet-100 text-violet-700 border-violet-200" },
  INTERVIEW: { label: "Interview", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  OFFER: { label: "Offer", color: "bg-amber-100 text-amber-700 border-amber-200" },
  REJECTED: { label: "Rejected", color: "bg-rose-100 text-rose-700 border-rose-200" },
  WITHDRAWN: { label: "Withdrawn", color: "bg-slate-100 text-slate-700 border-slate-200" },
};

const stageFilters = ["ALL", "SAVED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"];

export default function Applications() {
  const navigate = useNavigate();
  const location = useLocation();
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [profile, setProfile] = useState<{ userId: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeStage, setActiveStage] = useState("ALL");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationResponse | null>(null);

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
        const [me, apps] = await Promise.all([api.me(), api.applications.list()]);
        if (!active) return;
        setProfile(me);
        setApplications(apps);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load applications.");
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

  const initials = useMemo(() => {
    if (!profile?.email) return "JT";
    const raw = profile.email.split("@")[0].replace(/[^a-zA-Z]/g, "");
    return raw.slice(0, 2).toUpperCase() || "JT";
  }, [profile?.email]);

  const filteredApplications = useMemo(() => {
    if (activeStage === "ALL") return applications;
    return applications.filter((job) => job.stage === activeStage);
  }, [applications, activeStage]);

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

  const handleDeleteApplication = async (id: number) => {
    setDeletingId(id);
    setError(null);
    try {
      await api.applications.delete(id);
      setApplications((prev) => prev.filter((job) => job.id !== id));
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

  const handleOpenDetails = (job: ApplicationResponse) => {
    setSelectedApplication(job);
    setDetailsOpen(true);
  };

  const handleSaveEdits = async (id: number, payload: ApplicationUpdateRequest) => {
    setError(null);
    const updated = await api.applications.update(id, payload);
    setApplications((prev) => prev.map((job) => (job.id === updated.id ? updated : job)));
    setSelectedApplication(updated);
    return updated;
  };

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

  return (
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
                <p className="text-sm text-slate-500">Applications</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 mb-4">
                {error}
              </div>
            )}

            <Card className="border-slate-200 shadow-lg shadow-slate-200/40">
              <CardHeader className="pb-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">Applications</CardTitle>
                    <CardDescription>
                      Create new records, filter by stage, and drill into details.
                    </CardDescription>
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
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {stageFilters.map((stage) => (
                    <button
                      key={stage}
                      onClick={() => setActiveStage(stage)}
                      className={`rounded-full px-4 py-1 text-xs font-semibold ${
                        activeStage === stage
                          ? "bg-violet-100 text-violet-700"
                          : "bg-slate-100 text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>

                {isLoading ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-10 text-sm text-slate-400">
                    Loading applications...
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-10 text-sm text-slate-500">
                    No applications yet.
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredApplications.map((job) => (
                      <div
                        key={job.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOpenDetails(job)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleOpenDetails(job);
                          }
                        }}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm cursor-pointer"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold">{job.role}</h3>
                            <p className="text-sm text-slate-500">{job.company}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={stageConfig[job.stage]?.color ?? "bg-slate-100 text-slate-700 border-slate-200"}
                            >
                              {stageConfig[job.stage]?.label ?? job.stage}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleOpenDetails(job);
                                  }}
                                >
                                  Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDeleteApplication(job.id);
                                  }}
                                  disabled={deletingId === job.id}
                                >
                                  {deletingId === job.id ? "Deleting..." : "Delete"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.location}
                            </span>
                          )}
                          {normalizeExternalUrl(job.jobUrl) && (
                            <a
                              href={normalizeExternalUrl(job.jobUrl) ?? undefined}
                              onClick={(event) => event.stopPropagation()}
                              className="flex items-center gap-1 text-violet-600 hover:text-violet-700"
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Link2 className="h-3 w-3" />
                              Link
                            </a>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(job.updatedAt ?? job.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ApplicationDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        application={selectedApplication}
        onSave={handleSaveEdits}
        onDelete={handleDeleteApplication}
      />
    </div>
  );
}
