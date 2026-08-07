import React from 'react';
import HerdRecordsTable from '../components/HerdRecordsTable';
import FarmComparisonCard from '../components/FarmComparisonCard';
import { useAuth } from '../AuthContext';

export default function HerdRecords() {
  const { user } = useAuth();
  const scopeFarm = user?.role === 'farmer' ? user.farmName : null;

  if (scopeFarm) {
    return (
      <div className="mid-row">
        <HerdRecordsTable scopeFarm={scopeFarm} />
        <FarmComparisonCard farmName={scopeFarm} />
      </div>
    );
  }

  return <HerdRecordsTable />;
}
