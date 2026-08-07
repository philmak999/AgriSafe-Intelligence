import React from 'react';

import MetricCards from '../components/MetricCards';
import MRIChart from '../components/MRIChart';
import BiosecurityGauge from '../components/BiosecurityGauge';
import RiskFlagsPanel from '../components/RiskFlagsPanel';
import InspectionLog from '../components/InspectionLog';
import InspectorView from '../components/InspectorView';
import { useAuth } from '../AuthContext';
import { herds } from '../data/mockData';

function FarmerView({ farmName }) {
  const herd = herds.find((h) => h.farm === farmName);

  return (
    <>
      <div className="mid-row">
        <MRIChart />
        <BiosecurityGauge score={herd?.mri ?? 0} />
      </div>

      <div className="bottom-row">
        <RiskFlagsPanel scopeFarm={farmName} />
        <InspectionLog scopeFarm={farmName} />
      </div>
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isFarmer = user?.role === 'farmer';

  return (
    <>
      <MetricCards mode={isFarmer ? 'farmer' : 'scientist'} farmName={user?.farmName} />
      {isFarmer ? <FarmerView farmName={user.farmName} /> : <InspectorView />}
    </>
  );
}
