import React, { useEffect, useState } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import RequireAuth from './components/RequireAuth';

import Dashboard from './pages/Dashboard';
import RiskTimeline from './pages/RiskTimeline';
import HerdRecords from './pages/HerdRecords';
import InspectionLogPage from './pages/InspectionLogPage';
import ComplianceReports from './pages/ComplianceReports';
import MRIModelConfig from './pages/MRIModelConfig';
import PathogenTrends from './pages/PathogenTrends';
import Automation from './pages/Automation';
import FarmerRegister from './pages/FarmerRegister';
import FarmerApprovals from './pages/FarmerApprovals';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ThemeToggle from './components/ThemeToggle';

import { ROUTES, getRouteMeta } from './routes';

// Unauthenticated shell: login, registration. Matching is delegated to the
// <Route path> entries below rather than a manual pathname string check, so
// e.g. a trailing slash on /login still resolves correctly.
function PublicLayout() {
  return (
    <div className="auth-shell">
      <ThemeToggle className="auth-shell-toggle" />
      <Outlet />
    </div>
  );
}

// Authenticated shell: sidebar + topbar chrome, one RequireAuth guard for
// every route nested under it instead of one per <Route>.
function AuthenticatedLayout() {
  const location = useLocation();
  const meta = getRouteMeta(location.pathname);
  const [navOpen, setNavOpen] = useState(false);

  // Below the sidebar-drawer breakpoint the nav is an overlay; close it on
  // every navigation so it doesn't stay open over the next page.
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  return (
    <RequireAuth>
      <div className="app-shell">
        <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

        <div className="main-column">
          <Topbar title={meta.title} subtitle={meta.subtitle} onMenuClick={() => setNavOpen((open) => !open)} />

          <main className="content-area">
            <Outlet />
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}

// Nested under AuthenticatedLayout: adds the scientist-only check for the
// subset of routes that need it, without repeating the auth check itself.
function ScientistLayout() {
  return (
    <RequireAuth role="scientist">
      <Outlet />
    </RequireAuth>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.login} element={<Login />} />
        <Route path={ROUTES.farmerRegister} element={<FarmerRegister />} />
      </Route>

      <Route element={<AuthenticatedLayout />}>
        <Route path={ROUTES.dashboard} element={<Dashboard />} />
        <Route path={ROUTES.riskTimeline} element={<RiskTimeline />} />
        <Route path={ROUTES.herdRecords} element={<HerdRecords />} />
        <Route path={ROUTES.inspectionLog} element={<InspectionLogPage />} />
        <Route path={ROUTES.complianceReports} element={<ComplianceReports />} />

        <Route element={<ScientistLayout />}>
          <Route path={ROUTES.mriModel} element={<MRIModelConfig />} />
          <Route path={ROUTES.pathogenTrends} element={<PathogenTrends />} />
          <Route path={ROUTES.automation} element={<Automation />} />
          <Route path={ROUTES.farmerApprovals} element={<FarmerApprovals />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
