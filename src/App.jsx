import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

import Dashboard from './pages/Dashboard';
import RiskTimeline from './pages/RiskTimeline';
import HerdRecords from './pages/HerdRecords';
import InspectionLogPage from './pages/InspectionLogPage';
import ComplianceReports from './pages/ComplianceReports';
import MRIModelConfig from './pages/MRIModelConfig';
import PathogenTrends from './pages/PathogenTrends';

import { ROUTES, ROUTE_META } from './routes';

export default function App() {
  const [role, setRole] = useState('producer');
  const location = useLocation();

  const meta = ROUTE_META[location.pathname] ?? ROUTE_META[ROUTES.dashboard];
  const showRoleToggle = location.pathname === ROUTES.dashboard;

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-column">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          role={role}
          onRoleChange={setRole}
          showRoleToggle={showRoleToggle}
        />

        <main className="content-area">
          <Routes>
            <Route path={ROUTES.dashboard} element={<Dashboard role={role} />} />
            <Route path={ROUTES.riskTimeline} element={<RiskTimeline />} />
            <Route path={ROUTES.herdRecords} element={<HerdRecords />} />
            <Route path={ROUTES.inspectionLog} element={<InspectionLogPage />} />
            <Route path={ROUTES.complianceReports} element={<ComplianceReports />} />
            <Route path={ROUTES.mriModel} element={<MRIModelConfig />} />
            <Route path={ROUTES.pathogenTrends} element={<PathogenTrends />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
