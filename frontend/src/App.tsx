import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/AppShell";
import { RequireAuth } from "./components/RequireAuth";
import { Spinner } from "./components/ui";
import { useMe } from "./lib/queries";
import { ForgotPassword, Login, Register, ResetPassword } from "./pages/Auth";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import People from "./pages/People";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

// The force-graph bundle is the heaviest dependency; only load it where it's used.
const GraphLab = lazy(() => import("./pages/GraphLab"));
const Landing = lazy(() => import("./pages/Landing"));

function PageFallback() {
  return (
    <div className="flex justify-center py-20">
      <Spinner />
    </div>
  );
}

/** Logged-out visitors land on the project overview; members go straight to their feed. */
function Index({ shell }: { shell: ReactNode }) {
  const { data: me, isLoading } = useMe();
  if (isLoading) return <PageFallback />;
  return me ? shell : <Landing />;
}

function ExploreOrHome() {
  const { data: me } = useMe();
  return me ? <Navigate to="/" replace /> : <Home />;
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset/:uid/:token" element={<ResetPassword />} />

        <Route path="/" element={<Index shell={<AppShell />} />}>
          <Route index element={<Home />} />
        </Route>
        <Route element={<AppShell />}>
          <Route path="/explore" element={<ExploreOrHome />} />
          <Route path="/graph" element={<GraphLab />} />
          <Route path="/people" element={<People />} />
          <Route path="/p/:id" element={<PostDetail />} />
          <Route path="/u/:username" element={<Profile />} />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
