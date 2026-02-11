import { createBrowserRouter } from "react-router-dom";
import Landing from "./pages/landing";
import Auth from "./pages/auth";
import Dashboard from "./pages/dashboard";
import Applications from "./pages/applications";
import Settings from "./pages/settings";
import NotFound from "./pages/not-found";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/auth",
    Component: Auth,
  },
  {
    path: "/dashboard",
    Component: Dashboard,
  },
  {
    path: "/applications",
    Component: Applications,
  },
  {
    path: "/settings",
    Component: Settings,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
