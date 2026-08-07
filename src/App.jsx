import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

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

import { ROUTES, ROUTE_META } from './routes';

const PUBLIC_ROUTES = [ROUTES.login, ROUTES.farmerRegister];

export default function App() {
  const location = useLocation();

  if (PUBLIC_ROUTES.includes(location.pathname)) {
    return (
      <div className="auth-shell">
        <Routes>
          <Route path={ROUTES.login} element={<Login />} />
          <Route path={ROUTES.farmerRegister} element={<FarmerRegister />} />
        </Routes>
      </div>
    );
  }

  const meta = ROUTE_META[location.pathname] ?? ROUTE_META[ROUTES.dashboard];

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-column">
        <Topbar title={meta.title} subtitle={meta.subtitle} />

        <main className="content-area">
          <Routes>
            <Route path={ROUTES.dashboard} element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path={ROUTES.riskTimeline} element={<RequireAuth><RiskTimeline /></RequireAuth>} />
            <Route path={ROUTES.herdRecords} element={<RequireAuth><HerdRecords /></RequireAuth>} />
            <Route path={ROUTES.inspectionLog} element={<RequireAuth><InspectionLogPage /></RequireAuth>} />
            <Route path={ROUTES.complianceReports} element={<RequireAuth><ComplianceReports /></RequireAuth>} />
            <Route path={ROUTES.mriModel} element={<RequireAuth role="scientist"><MRIModelConfig /></RequireAuth>} />
            <Route path={ROUTES.pathogenTrends} element={<RequireAuth role="scientist"><PathogenTrends /></RequireAuth>} />
            <Route path={ROUTES.automation} element={<RequireAuth role="scientist"><Automation /></RequireAuth>} />
            <Route path={ROUTES.farmerApprovals} element={<RequireAuth role="scientist"><FarmerApprovals /></RequireAuth>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
