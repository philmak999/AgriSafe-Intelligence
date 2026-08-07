import React from 'react';
import Timeline from '../components/Timeline';
import { riskTimelineEvents } from '../data/mockData';
import { useAuth } from '../AuthContext';

export default function RiskTimeline() {
  const { user } = useAuth();
  const scopeFarm = user?.role === 'farmer' ? user.farmName : null;

  const events = scopeFarm
    ? riskTimelineEvents.filter((e) => e.farm === scopeFarm)
    : riskTimelineEvents;

  if (scopeFarm && events.length === 0) {
    return (
      <div className="card">
        <div className="card-title">Your Risk Timeline</div>
        <p style={{ fontSize: '13px', color: 'var(--gray-dark)' }}>
          No risk events recorded for your farm.
        </p>
      </div>
    );
  }

  return <Timeline events={events} />;
}
