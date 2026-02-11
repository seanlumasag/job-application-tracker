import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api, clearAuthTokens, getAuthTokens } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<{ userId: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        const me = await api.me();
        if (!active) return;
        setProfile(me);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load profile.");
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

  const handleSignOut = async () => {
    clearAuthTokens();
    navigate("/");
  };

  const handleDeleteAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDeleteStatus(null);
    setIsDeleting(true);
    try {
      await api.deleteAccount(deletePassword);
      clearAuthTokens();
      navigate("/");
    } catch (err) {
      setDeleteStatus(err instanceof Error ? err.message : "Unable to delete account.");
    } finally {
      setIsDeleting(false);
    }
  };

  const isBoardActive = location.pathname === "/dashboard";
  const isApplicationsActive = location.pathname === "/applications";
  const isSettingsActive = location.pathname === "/settings";

  const userIdPreview = useMemo(() => {
    if (!profile?.userId) return "—";
    const id = profile.userId;
    if (id.length <= 10) return id;
    return `${id.slice(0, 6)}...${id.slice(-4)}`;
  }, [profile?.userId]);

  const handleCopyId = async () => {
    if (!profile?.userId) return;
    try {
      await navigator.clipboard.writeText(profile.userId);
      setDeleteStatus("User ID copied.");
    } catch (err) {
      setDeleteStatus("Unable to copy user ID.");
    }
  };

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
              className={`block w-full text-left px-3 py-2 ${
                isSettingsActive
                  ? "text-violet-600 font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
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
                <p className="text-sm text-slate-500">Settings</p>
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
                <CardTitle className="text-2xl">Settings</CardTitle>
                <CardDescription>Manage your account and security preferences.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <Card className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Email</span>
                        <span className="font-semibold text-slate-800">
                          {isLoading ? "Loading..." : profile?.email ?? "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">User ID</span>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-800">{userIdPreview}</span>
                          <button
                            type="button"
                            className="text-xs font-semibold text-violet-600 hover:text-violet-700"
                            onClick={handleCopyId}
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-rose-200 bg-rose-50/40">
                    <CardHeader>
                      <CardTitle className="text-lg text-rose-900">Delete account</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-rose-900">
                      <p className="text-rose-700">
                        This permanently deletes your account and all associated data. This action cannot be
                        undone.
                      </p>
                      <form onSubmit={handleDeleteAccount} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-rose-900">Confirm password</label>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            value={deletePassword}
                            onChange={(event) => setDeletePassword(event.target.value)}
                            className="bg-white"
                          />
                        </div>
                        <Button
                          type="submit"
                          variant="outline"
                          className="border-rose-300 text-rose-700 hover:bg-rose-100"
                          disabled={isDeleting || deletePassword.length === 0}
                        >
                          {isDeleting ? "Deleting..." : "Delete account"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                {deleteStatus && (
                  <p className="mt-4 text-xs text-slate-500">{deleteStatus}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
