import React from 'react';
import InspectionLog from '../components/InspectionLog';
import InspectionHistoryTable from '../components/InspectionHistoryTable';

export default function InspectionLogPage() {
  return (
    <>
      <InspectionLog />
      <InspectionHistoryTable />
    </>
  );
}
