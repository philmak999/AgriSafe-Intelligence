import React from 'react';

import MetricCards from '../components/MetricCards';
import MRIChart from '../components/MRIChart';
import BiosecurityGauge from '../components/BiosecurityGauge';
import RiskFlagsPanel from '../components/RiskFlagsPanel';
import InspectionLog from '../components/InspectionLog';
import InspectorView from '../components/InspectorView';

function ProducerView() {
  return (
    <>
      <div className="mid-row">
        <MRIChart />
        <BiosecurityGauge score={73} />
      </div>

      <div className="bottom-row">
        <RiskFlagsPanel />
        <InspectionLog />
      </div>
    </>
  );
}

export default function Dashboard({ role }) {
  return (
    <>
      <MetricCards role={role} />
      {role === 'producer' ? <ProducerView /> : <InspectorView />}
    </>
  );
}
