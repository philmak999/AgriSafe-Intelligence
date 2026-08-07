import React from 'react';
import ComplianceReportsTable from '../components/ComplianceReportsTable';
import { useAuth } from '../AuthContext';

export default function ComplianceReports() {
  const { user } = useAuth();
  const scopeFarm = user?.role === 'farmer' ? user.farmName : null;

  return <ComplianceReportsTable scopeFarm={scopeFarm} />;
}
