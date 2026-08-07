import React from 'react';
import InspectionLog from '../components/InspectionLog';
import InspectionHistoryTable from '../components/InspectionHistoryTable';
import { useAuth } from '../AuthContext';

export default function InspectionLogPage() {
  const { user } = useAuth();
  const scopeFarm = user?.role === 'farmer' ? user.farmName : null;

  return (
    <>
      <InspectionLog scopeFarm={scopeFarm} />
      <InspectionHistoryTable scopeFarm={scopeFarm} />
    </>
  );
}
